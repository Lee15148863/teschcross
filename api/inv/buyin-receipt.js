const express = require('express');
const router = express.Router();
const Expense = require('../../models/inv/Expense');
const Product = require('../../models/inv/Product');
const InvUser = require('../../models/inv/User');
const SystemSetting = require('../../models/inv/SystemSetting');
const { jwtAuth, requireRole } = require('../../middleware/inv-auth');

router.use(jwtAuth, requireRole('root', 'manager', 'staff'));

const DEFAULT_COMPANY = {
  name: 'TechCross Repair Centre',
  address: 'UNIT M.4, Navan Town Centre, Kennedy Road, Navan, Co. Meath, C15 F658',
  phone: '046 905 9854',
  vatNumber: 'IE3330982OH'
};

// GET /api/inv/buyin-receipt/by-product/:productId — lookup by product, find linked expense
router.get('/by-product/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const expenseId = product.attributes && product.attributes.buyInExpenseId;
    if (!expenseId) {
      return res.status(404).json({ error: 'No buy-in receipt linked to this product' });
    }
    // Forward to expense-based lookup
    req.params.expenseId = expenseId;
    return getReceipt(req, res);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/inv/buyin-receipt/:expenseId
router.get('/:expenseId', getReceipt);

async function getReceipt(req, res) {
  try {
    const expense = await Expense.findById(req.params.expenseId).lean();
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Find linked product via attributes.buyInExpenseId
    const product = await Product.findOne({ 'attributes.buyInExpenseId': req.params.expenseId }).lean();

    // Operator
    let operatorName = '';
    if (expense.operator) {
      const op = await InvUser.findById(expense.operator).select('displayName username').lean();
      if (op) operatorName = op.displayName || op.username || '';
    }

    // Company info from settings, fallback to defaults
    const settingsDocs = await SystemSetting.find({
      key: { $in: ['companyInfo', 'receiptHeader', 'receiptFooter'] }
    }).lean();
    const settings = {};
    for (const d of settingsDocs) { settings[d.key] = d.value; }

    const company = settings.companyInfo || DEFAULT_COMPANY;

    res.json({
      receiptType: 'buyin',
      receiptRef: 'BUY-' + String(expense._id).slice(-8).toUpperCase(),
      date: expense.date || expense.createdAt,
      operator: operatorName,
      store: {
        name: company.name || DEFAULT_COMPANY.name,
        address: company.address || DEFAULT_COMPANY.address,
        phone: company.phone || DEFAULT_COMPANY.phone,
        vatNumber: company.vatNumber || DEFAULT_COMPANY.vatNumber,
        logo: company.logo || ''
      },
      device: product ? {
        _id: product._id,
        name: product.name || '',
        serialNumber: product.serialNumber || '',
        sku: product.sku || '',
        attributes: product.attributes || {},
        source: product.source || 'customer'
      } : null,
      buyIn: {
        amount: expense.amount,
        paymentMethod: expense.paymentMethod || 'cash',
        description: expense.description || '',
        category: expense.category
      },
      receiptHeader: settings.receiptHeader || '',
      receiptFooter: settings.receiptFooter || 'Thank you for your business!'
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = router;
