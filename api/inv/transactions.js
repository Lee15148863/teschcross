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
    const { items, orderDiscount, paymentMethod, cashReceived, cardAmount } = req.body;

    // Validate cart is not empty
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '购物车为空', code: 'EMPTY_CART' });
    }

    // Validate payment method
    if (!paymentMethod || !['cash', 'card', 'split'].includes(paymentMethod)) {
      return res.status(400).json({ error: '支付方式无效，必须为 cash、card 或 split', code: 'VALIDATION_ERROR' });
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

      // Stock check: warn but don't block sale (stock can go negative)
      // This allows selling items that aren't inventory-tracked (stock=0)

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
        vatRate: product.vatRate || 0.23,
        discount: item.discount || null
      });
    }

    // Calculate discounted cart using the discount engine
    // Use marginScheme flag to determine VAT type (margin vs standard)
    // Use per-item vatRate for calculation
    const calcItems = cartItems.map(item => ({
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      quantity: item.quantity,
      isSecondHand: item.marginScheme,  // discount engine uses isSecondHand to pick Margin VAT
      vatRate: item.vatRate || 0.23,
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

    // Payment validation and change calculation
    let changeGiven = undefined;
    let cashReceivedVal = undefined;
    let cardAmountVal = undefined;

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
    } else if (paymentMethod === 'split') {
      // Split payment: card + cash
      if (cardAmount === undefined || cardAmount === null || typeof cardAmount !== 'number' || cardAmount < 0) {
        return res.status(400).json({ error: '混合支付需要提供卡付金额', code: 'VALIDATION_ERROR' });
      }
      if (cardAmount > cartResult.totalAmount) {
        return res.status(400).json({ error: '卡付金额不能超过应付总额', code: 'VALIDATION_ERROR' });
      }
      if (cashReceived === undefined || cashReceived === null || typeof cashReceived !== 'number') {
        return res.status(400).json({ error: '混合支付需要提供现金金额', code: 'VALIDATION_ERROR' });
      }
      const remaining = Math.round((cartResult.totalAmount - cardAmount) * 100) / 100;
      if (cashReceived < remaining) {
        return res.status(400).json({
          error: `现金不足: 卡付 ${cardAmount}，还需现金 ${remaining}，实收 ${cashReceived}`,
          code: 'VALIDATION_ERROR'
        });
      }
      cardAmountVal = cardAmount;
      cashReceivedVal = cashReceived;
      changeGiven = Math.round((cashReceived - remaining) * 100) / 100;
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
        vatRate: item.vatRate,
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
    if (cardAmountVal !== undefined) transactionData.cardAmount = cardAmountVal;
    if (changeGiven !== undefined) transactionData.changeGiven = changeGiven;
    if (req.body.discountOperator) transactionData.discountOperator = req.body.discountOperator;

    const transaction = await Transaction.create(transactionData);

    // Auto-create StockMovement(exit) for each item and decrement stock
    // With error compensation: if stock update fails, log to AuditLog for manual reconciliation
    const stockErrors = [];
    for (const item of transactionItems) {
      try {
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
      } catch (stockErr) {
        console.error(`Stock update failed for product ${item.product}:`, stockErr.message);
        stockErrors.push({ product: item.product, name: item.name, quantity: item.quantity, error: stockErr.message });
      }
    }

    // If any stock updates failed, write compensation audit log
    if (stockErrors.length > 0) {
      try {
        await AuditLog.create({
          action: 'stock_update_failed',
          operator: req.user.userId,
          targetType: 'transaction',
          targetId: transaction._id.toString(),
          encryptedData: JSON.stringify({ receiptNumber, stockErrors, timestamp: new Date().toISOString() }),
          ip: req.ip || req.connection?.remoteAddress
        });
      } catch (auditErr) {
        console.error('Failed to write stock error audit log:', auditErr.message);
      }
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

    const response = { transaction, receipt: receiptData };
    if (stockErrors.length > 0) {
      response.stockWarnings = stockErrors;
      response.message = '交易成功，但部分库存更新失败，请管理员核对';
    }
    res.status(201).json(response);
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

// ─── POST /api/inv/transactions/refund ──────────────────────────────────────
// Process refund — staff and admin can both refund
router.post('/refund', async (req, res) => {
  try {
    const { receiptNumber, items, refundMethod, reason } = req.body;

    if (!refundMethod || !['cash', 'card'].includes(refundMethod)) {
      return res.status(400).json({ error: 'Refund method must be cash or card', code: 'VALIDATION_ERROR' });
    }

    let refundItems = [];
    let originalTransaction = null;

    // Mode 1: Refund by receipt number (full or partial)
    if (receiptNumber) {
      originalTransaction = await Transaction.findOne({ receiptNumber });
      if (!originalTransaction) {
        return res.status(404).json({ error: 'Transaction not found', code: 'NOT_FOUND' });
      }

      const txnItems = originalTransaction.items || [];

      if (items && items.length > 0) {
        // Partial refund: only specified items
        for (const ri of items) {
          const found = txnItems.find(ti => ti.product.toString() === ri.product || ti.name === ri.name);
          if (!found) continue;
          const qty = Math.min(ri.quantity || found.quantity, found.quantity);
          refundItems.push({
            product: found.product,
            name: found.name,
            sku: found.sku || '',
            quantity: qty,
            unitPrice: found.discountedPrice || found.unitPrice,
            subtotal: Math.round((found.discountedPrice || found.unitPrice) * qty * 100) / 100,
            isSecondHand: found.isSecondHand || false,
            marginScheme: found.marginScheme || false,
            vatRate: found.vatRate || 0.23
          });
        }
      } else {
        // Full refund
        refundItems = txnItems.map(ti => ({
          product: ti.product,
          name: ti.name,
          sku: ti.sku || '',
          quantity: ti.quantity,
          unitPrice: ti.discountedPrice || ti.unitPrice,
          subtotal: ti.subtotal,
          isSecondHand: ti.isSecondHand || false,
          marginScheme: ti.marginScheme || false,
          vatRate: ti.vatRate || 0.23
        }));
      }
    }
    // Mode 2: Manual refund (no receipt number)
    else if (items && items.length > 0) {
      for (const ri of items) {
        if (!ri.name || !ri.amount) continue;
        refundItems.push({
          product: null,
          name: ri.name,
          sku: ri.sku || '',
          quantity: ri.quantity || 1,
          unitPrice: ri.amount,
          subtotal: Math.round((ri.amount) * (ri.quantity || 1) * 100) / 100,
          isSecondHand: false,
          marginScheme: false,
          vatRate: 0.23
        });
      }
    }

    if (!refundItems.length) {
      return res.status(400).json({ error: 'No items to refund', code: 'VALIDATION_ERROR' });
    }

    const totalRefund = Math.round(refundItems.reduce((sum, i) => sum + i.subtotal, 0) * 100) / 100;

    // Calculate VAT for refund (negative)
    let stdVatRefund = 0, marginVatRefund = 0;
    for (const item of refundItems) {
      const rate = item.vatRate || 0.23;
      if (item.marginScheme) {
        // Margin VAT not easily reversed without cost price, set to 0
        marginVatRefund += 0;
      } else {
        stdVatRefund += Math.round(item.unitPrice * rate / (1 + rate) * item.quantity * 100) / 100;
      }
    }

    // Generate refund receipt number: R + timestamp
    const now = new Date();
    const pad = (n, l = 2) => String(n).padStart(l, '0');
    const refundReceiptNumber = `R${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    // Create refund transaction (negative amount)
    const refundTxn = await Transaction.create({
      receiptNumber: refundReceiptNumber,
      items: refundItems.map(i => ({
        product: i.product,
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: -i.unitPrice,
        costPrice: 0,
        isSecondHand: i.isSecondHand,
        marginScheme: i.marginScheme,
        vatRate: i.vatRate,
        discountedPrice: -i.unitPrice,
        subtotal: -i.subtotal,
        vatAmount: 0,
        marginVat: 0
      })),
      totalAmount: -totalRefund,
      standardVatTotal: -stdVatRefund,
      marginVatTotal: -marginVatRefund,
      paymentMethod: refundMethod,
      cashReceived: refundMethod === 'cash' ? -totalRefund : null,
      operator: req.user.userId
    });

    // Restore stock for refunded items
    for (const item of refundItems) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
          updatedAt: new Date()
        });
        await StockMovement.create({
          product: item.product,
          type: 'entry',
          quantity: item.quantity,
          operator: req.user.userId,
          referenceId: refundTxn._id.toString(),
          referenceType: 'refund',
          note: `Refund - ${refundReceiptNumber}${reason ? ' - ' + reason : ''}`
        });
      }
    }

    res.status(201).json({
      message: 'Refund processed',
      refund: {
        receiptNumber: refundReceiptNumber,
        totalRefund,
        refundMethod,
        items: refundItems,
        originalReceipt: receiptNumber || null
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Refund receipt number conflict, please retry', code: 'DUPLICATE_RECEIPT' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/transactions ──────────────────────────────────────────────
// Transaction list with date range filter and pagination
router.get('/', async (req, res) => {
  try {
    const filter = {};
    const { startDate, endDate, page, limit, q } = req.query;

    // Receipt number search
    if (q && typeof q === 'string' && q.trim()) {
      filter.receiptNumber = { $regex: q.trim(), $options: 'i' };
    }

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
        'receiptNumber', 'totalAmount', 'paymentMethod', 'cardAmount', 'cashReceived',
        'changeGiven', 'standardVatTotal', 'marginVatTotal', 'createdAt',
        'operator', 'itemCount'
      ];
      let csv = headers.join(',') + '\n';
      for (const t of transactions) {
        const row = [
          t.receiptNumber,
          t.totalAmount,
          t.paymentMethod,
          t.cardAmount || '',
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

    // Create AuditLog with encrypted data — DISABLED per requirement: no delete audit log
    // Deletion is permanent, no logging

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

      // AuditLog — DISABLED per requirement: no delete audit log

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
