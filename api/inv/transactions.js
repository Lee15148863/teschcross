const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Transaction = require('../../models/inv/Transaction');
const Product = require('../../models/inv/Product');
const StockMovement = require('../../models/inv/StockMovement');
const AuditLog = require('../../models/inv/AuditLog');
const { jwtAuth, requireRole } = require('../../middleware/inv-auth');
const { calculateDiscountedCart, validateDiscountFloor } = require('../../utils/inv-discount-calculator');
const { DEFAULT_VAT_RATE } = require('../../utils/inv-vat-calculator');

// All routes require Staff+ access
router.use(jwtAuth, requireRole('admin', 'staff'));

// ─── Helper: AES-256 encrypt ────────────────────────────────────────────────
function encryptData(data) {
  const key = process.env.INV_AUDIT_KEY;
  if (!key) throw new Error('INV_AUDIT_KEY not configured');
  // Derive a 32-byte key from the env var
  const derivedKey = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// ─── Helper: Generate receipt number ────────────────────────────────────────
function generateReceiptNumber() {
  const now = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

// ─── POST /api/inv/transactions/checkout ────────────────────────────────────
// Core checkout endpoint
router.post('/checkout', async (req, res) => {
  try {
    const { items, orderDiscount, paymentMethod, cashReceived } = req.body;

    // Validate cart is not empty
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '购物车为空', code: 'EMPTY_CART' });
    }

    // Validate payment method
    if (!paymentMethod || !['cash', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ error: '支付方式无效，必须为 cash 或 card', code: 'VALIDATION_ERROR' });
    }

    // Pre-validate: ensure all items have product IDs
    for (let i = 0; i < items.length; i++) {
      if (!items[i].product) {
        return res.status(400).json({
          error: `items[${i}] 缺少商品ID`,
          code: 'VALIDATION_ERROR'
        });
      }
    }

    // Validate each item and fetch product data
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    for (const p of products) {
      productMap[p._id.toString()] = p;
    }

    // Build cart items with product data
    const cartItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const product = productMap[item.product];
      if (!product) {
        return res.status(400).json({
          error: `商品不存在: ${item.product}`,
          code: 'NOT_FOUND'
        });
      }

      if (!product.active) {
        return res.status(400).json({
          error: `商品已停用: ${product.name}`,
          code: 'PRODUCT_DISABLED'
        });
      }

      const quantity = item.quantity || 1;
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          error: `items[${i}] 数量必须为正整数`,
          code: 'VALIDATION_ERROR'
        });
      }

      // Check stock
      if (product.stock < quantity) {
        return res.status(400).json({
          error: `库存不足: ${product.name}（当前库存 ${product.stock}，需要 ${quantity}）`,
          code: 'INSUFFICIENT_STOCK'
        });
      }

      cartItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        serialNumber: product.serialNumber || item.serialNumber || '',
        quantity,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        isSecondHand: product.isSecondHand || false,
        purchasedFromCustomer: product.purchasedFromCustomer || false,
        marginScheme: product.marginScheme || false,
        source: product.source || '',
        discount: item.discount || null
      });
    }

    // Calculate discounted cart using the discount engine
    // Use marginScheme flag to determine VAT type (margin vs standard)
    const calcItems = cartItems.map(item => ({
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      quantity: item.quantity,
      isSecondHand: item.marginScheme,  // discount engine uses isSecondHand to pick Margin VAT
      discount: item.discount
    }));

    const cartResult = calculateDiscountedCart(calcItems, orderDiscount || null, DEFAULT_VAT_RATE);

    // Validate discount floor for each item
    for (let i = 0; i < cartResult.items.length; i++) {
      const calcItem = cartResult.items[i];
      const floorCheck = validateDiscountFloor(calcItem.discountedPrice, calcItem.costPrice, DEFAULT_VAT_RATE);
      if (!floorCheck.valid) {
        return res.status(400).json({
          error: `${cartItems[i].name}: ${floorCheck.error}`,
          code: 'DISCOUNT_BELOW_COST'
        });
      }
    }

    // Cash payment: validate and calculate change
    let changeGiven = undefined;
    let cashReceivedVal = undefined;
    if (paymentMethod === 'cash') {
      if (cashReceived === undefined || cashReceived === null || typeof cashReceived !== 'number') {
        return res.status(400).json({ error: '现金支付需要提供实收金额', code: 'VALIDATION_ERROR' });
      }
      if (cashReceived < cartResult.totalAmount) {
        return res.status(400).json({
          error: `实收金额不足: 需要 ${cartResult.totalAmount}，实收 ${cashReceived}`,
          code: 'VALIDATION_ERROR'
        });
      }
      cashReceivedVal = cashReceived;
      changeGiven = Math.round((cashReceived - cartResult.totalAmount) * 100) / 100;
    }

    // Generate receipt number
    const receiptNumber = generateReceiptNumber();

    // Build transaction items
    const transactionItems = cartItems.map((item, idx) => {
      const calcItem = cartResult.items[idx];
      return {
        product: item.product,
        name: item.name,
        sku: item.sku,
        serialNumber: item.serialNumber,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        isSecondHand: item.isSecondHand,
        purchasedFromCustomer: item.purchasedFromCustomer,
        marginScheme: item.marginScheme,
        source: item.source,
        discount: item.discount || undefined,
        discountedPrice: calcItem.discountedPrice,
        subtotal: calcItem.subtotal,
        vatAmount: calcItem.vatAmount,
        marginVat: calcItem.marginVat
      };
    });

    // Create Transaction record
    const transactionData = {
      receiptNumber,
      items: transactionItems,
      totalAmount: cartResult.totalAmount,
      subtotalBeforeOrderDiscount: cartResult.subtotalBeforeOrderDiscount,
      standardVatTotal: cartResult.standardVatTotal,
      marginVatTotal: cartResult.marginVatTotal,
      paymentMethod,
      operator: req.user.userId
    };

    if (orderDiscount && orderDiscount.type && orderDiscount.value) {
      transactionData.orderDiscount = orderDiscount;
    }
    if (cashReceivedVal !== undefined) transactionData.cashReceived = cashReceivedVal;
    if (changeGiven !== undefined) transactionData.changeGiven = changeGiven;
    if (req.body.discountOperator) transactionData.discountOperator = req.body.discountOperator;

    const transaction = await Transaction.create(transactionData);

    // Auto-create StockMovement(exit) for each item and decrement stock
    for (const item of transactionItems) {
      await StockMovement.create({
        product: item.product,
        type: 'exit',
        quantity: item.quantity,
        operator: req.user.userId,
        referenceId: transaction._id.toString(),
        referenceType: 'transaction',
        serialNumber: item.serialNumber || undefined,
        note: `销售出库 - 小票 ${receiptNumber}`
      });

      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
        updatedAt: new Date()
      });
    }

    // Generate formatted receipt data for Print Agent
    const { generateReceipt } = require('../../utils/inv-receipt-generator');
    let receiptData = null;
    try {
      const SystemSetting = require('../../models/inv/SystemSetting');
      let companyInfo = null;
      const setting = await SystemSetting.findOne({ key: 'companyInfo' });
      if (setting && setting.value) companyInfo = setting.value;
      receiptData = generateReceipt(transaction.toObject(), companyInfo);
    } catch (e) {
      // Receipt generation failure should not block checkout
      console.error('Receipt generation error:', e.message);
    }

    res.status(201).json({ transaction, receipt: receiptData });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: '无效的ID格式', code: 'VALIDATION_ERROR' });
    }
    if (err.code === 11000) {
      return res.status(409).json({ error: '小票号重复，请重试', code: 'DUPLICATE_RECEIPT' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/transactions ──────────────────────────────────────────────
// Transaction list with date range filter and pagination
router.get('/', async (req, res) => {
  try {
    const filter = {};
    const { startDate, endDate, page, limit } = req.query;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('operator', 'username displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/transactions/export ───────────────────────────────────────
// Export transactions as JSON/CSV, mark exported=true
// NOTE: This route must be defined BEFORE /:id to avoid matching 'export' as an id
router.get('/export', async (req, res) => {
  try {
    const { format, startDate, endDate } = req.query;
    const exportFormat = format || 'json';

    if (!['json', 'csv'].includes(exportFormat)) {
      return res.status(400).json({ error: '导出格式无效，支持 json 或 csv', code: 'VALIDATION_ERROR' });
    }

    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const transactions = await Transaction.find(filter)
      .populate('operator', 'username displayName')
      .sort({ createdAt: -1 });

    // Mark exported
    const ids = transactions.map(t => t._id);
    if (ids.length > 0) {
      await Transaction.updateMany({ _id: { $in: ids } }, { $set: { exported: true } });
    }

    if (exportFormat === 'csv') {
      // Generate CSV
      const headers = [
        'receiptNumber', 'totalAmount', 'paymentMethod', 'cashReceived',
        'changeGiven', 'standardVatTotal', 'marginVatTotal', 'createdAt',
        'operator', 'itemCount'
      ];
      let csv = headers.join(',') + '\n';
      for (const t of transactions) {
        const row = [
          t.receiptNumber,
          t.totalAmount,
          t.paymentMethod,
          t.cashReceived || '',
          t.changeGiven || '',
          t.standardVatTotal,
          t.marginVatTotal,
          t.createdAt.toISOString(),
          t.operator ? (t.operator.displayName || t.operator.username) : '',
          t.items.length
        ];
        csv += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csv);
    }

    // JSON format
    res.json({ data: transactions, count: transactions.length });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/transactions/:id ──────────────────────────────────────────
// Transaction detail
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('operator', 'username displayName')
      .populate('discountOperator', 'username displayName')
      .populate('items.product', 'name sku category stock');

    if (!transaction) {
      return res.status(404).json({ error: '交易记录不存在' });
    }

    res.json(transaction);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: '交易记录不存在' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── DELETE /api/inv/transactions/:id/delete ────────────────────────────────
// Silent delete (Admin only)
router.delete('/:id/delete', requireRole('admin'), async (req, res) => {
  try {
    const { confirm } = req.body;

    // Require confirmation
    if (!confirm) {
      return res.status(400).json({ error: '需要确认删除操作（confirm: true）', code: 'VALIDATION_ERROR' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: '交易记录不存在' });
    }

    // Only allow if invoiceGenerated=false
    if (transaction.invoiceGenerated) {
      return res.status(409).json({
        error: '该交易已开发票，不可删除',
        code: 'DELETE_NOT_ALLOWED'
      });
    }

    // Restore product stock for each item
    for (const item of transaction.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
        updatedAt: new Date()
      });
    }

    // Delete associated StockMovement(exit) records
    await StockMovement.deleteMany({
      referenceId: transaction._id.toString(),
      referenceType: 'transaction',
      type: 'exit'
    });

    // Create AuditLog with encrypted data
    try {
      const encryptedData = encryptData({
        transaction: transaction.toObject(),
        deletedAt: new Date().toISOString(),
        deletedBy: req.user.username
      });

      await AuditLog.create({
        action: 'silent_delete',
        operator: req.user.userId,
        targetType: 'transaction',
        targetId: transaction._id.toString(),
        encryptedData,
        ip: req.ip || req.connection?.remoteAddress
      });
    } catch (auditErr) {
      // Log audit error but don't block deletion
      console.error('审计日志创建失败:', auditErr.message);
    }

    // Physically delete the transaction
    await Transaction.findByIdAndDelete(transaction._id);

    res.json({ message: '交易记录已删除' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: '交易记录不存在' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── DELETE /api/inv/transactions/batch-delete ──────────────────────────────
// Batch delete exported records (Admin only)
router.delete('/batch-delete', requireRole('admin'), async (req, res) => {
  try {
    const { ids, confirm } = req.body;

    // Require confirmation
    if (!confirm) {
      return res.status(400).json({ error: '需要确认删除操作（confirm: true）', code: 'VALIDATION_ERROR' });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '缺少要删除的交易ID列表', code: 'VALIDATION_ERROR' });
    }

    // Find all transactions
    const transactions = await Transaction.find({ _id: { $in: ids } });

    if (transactions.length === 0) {
      return res.status(404).json({ error: '未找到指定的交易记录' });
    }

    // Only allow deleting exported transactions
    const nonExported = transactions.filter(t => !t.exported);
    if (nonExported.length > 0) {
      return res.status(400).json({
        error: `以下交易未导出，不可批量删除: ${nonExported.map(t => t.receiptNumber).join(', ')}`,
        code: 'VALIDATION_ERROR'
      });
    }

    const deletedReceipts = [];

    for (const transaction of transactions) {
      // Restore product stock
      for (const item of transaction.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
          updatedAt: new Date()
        });
      }

      // Delete associated StockMovement(exit) records
      await StockMovement.deleteMany({
        referenceId: transaction._id.toString(),
        referenceType: 'transaction',
        type: 'exit'
      });

      // Create AuditLog
      try {
        const encryptedData = encryptData({
          transaction: transaction.toObject(),
          deletedAt: new Date().toISOString(),
          deletedBy: req.user.username
        });

        await AuditLog.create({
          action: 'batch_delete',
          operator: req.user.userId,
          targetType: 'transaction',
          targetId: transaction._id.toString(),
          encryptedData,
          ip: req.ip || req.connection?.remoteAddress
        });
      } catch (auditErr) {
        console.error('审计日志创建失败:', auditErr.message);
      }

      deletedReceipts.push(transaction.receiptNumber);
    }

    // Physically delete all transactions
    await Transaction.deleteMany({ _id: { $in: ids } });

    res.json({
      message: `已删除 ${deletedReceipts.length} 条交易记录`,
      deletedReceipts
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: '无效的ID格式', code: 'VALIDATION_ERROR' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
