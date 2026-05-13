const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Store = require('../../models/saas/Store');
const Deployment = require('../../models/saas/Deployment');
const SaaTestProduct = require('../../models/saas/SaaTestProduct');
const SaaTestTransaction = require('../../models/saas/SaaTestTransaction');

const JWT_SECRET = process.env.SAAS_JWT_SECRET;

// ─── Auth: verify JWT and extract storeId ───────────────────────────────
function posAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    req.user = decoded;
    // storeId from JWT only — never from client
    req.storeId = decoded.storeId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Role gate: staff can only read ────────────────────────────────────
function writeRoleGate(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].indexOf(req.method) === -1) return next();
  if (req.user.role === 'staff') {
    return res.status(403).json({ error: 'Insufficient permissions. Staff cannot write.' });
  }
  next();
}

// ─── Freeze gate: backend-first readonly enforcement ───────────────────
// Uses storeId direct lookup, falls back to storeName for legacy records.
async function freezeGate(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].indexOf(req.method) !== -1) return next();
  try {
    let dep = await Deployment.findOne({ storeId: req.storeId }).select('status');
    if (!dep) {
      const store = await Store.findById(req.storeId).select('name');
      if (!store) return next();
      dep = await Deployment.findOne({ storeName: store.name }).select('status');
    }
    if (dep && dep.status === 'readonly_frozen') {
      return res.status(403).json({ error: 'STORE_FROZEN_READONLY', message: 'System is in read-only mode.' });
    }
    next();
  } catch (e) {
    next();
  }
}

// ─── All POS routes: auth + role + freeze ──────────────────────────────
router.use(posAuth, writeRoleGate, freezeGate);

// GET /api/saas/pos/status — check if store is frozen
router.get('/status', async (req, res) => {
  try {
    let dep = await Deployment.findOne({ storeId: req.storeId }).select('status subscriptionExpiresAt subscriptionStatus');
    if (!dep) {
      const store = await Store.findById(req.storeId).select('name');
      if (store) {
        dep = await Deployment.findOne({ storeName: store.name }).select('status subscriptionExpiresAt subscriptionStatus');
      }
    }
    let frozen = false;
    let message = '';
    if (dep) {
      if (dep.status === 'readonly_frozen') {
        frozen = true;
        message = 'System is in read-only mode.';
      }
      if (dep.subscriptionStatus === 'expired' || dep.subscriptionStatus === 'readonly_frozen') {
        frozen = true;
        message = message || 'Subscription ' + dep.subscriptionStatus + '.';
      }
    }
    res.json({ frozen, message });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/saas/pos/products — list products for auth'd store
router.get('/products', async (req, res) => {
  try {
    const products = await SaaTestProduct.find({ storeId: req.storeId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/saas/pos/products — add fake product
router.post('/products', async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Product name required' });
    if (price == null || price < 0) return res.status(400).json({ error: 'Valid price required' });
    const product = await SaaTestProduct.create({
      storeId: req.storeId,
      name: name.trim(),
      price: Number(price),
      category: (category || '').trim()
    });
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/saas/pos/products/:id — soft delete
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await SaaTestProduct.findOne({ _id: req.params.id, storeId: req.storeId });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.active = false;
    product.deletedAt = new Date();
    product.deletedBy = req.user.userId;
    product.updatedAt = new Date();
    await product.save();
    res.json({ success: true, product });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/saas/pos/transactions — list transactions for auth'd store
router.get('/transactions', async (req, res) => {
  try {
    var filter = { storeId: req.storeId };
    var days = parseInt(req.query.days, 10);
    if (days > 0) {
      var since = new Date();
      since.setDate(since.getDate() - days);
      since.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: since };
    }
    const txs = await SaaTestTransaction.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(txs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/saas/pos/transactions — create fake sale
router.post('/transactions', async (req, res) => {
  try {
    const { productId, amount, paymentMethod } = req.body;
    if (!paymentMethod || ['cash', 'card'].indexOf(paymentMethod) === -1) {
      return res.status(400).json({ error: 'paymentMethod must be cash or card' });
    }
    var total = 0;
    var items = [];
    if (productId) {
      var product = await SaaTestProduct.findOne({ _id: productId, storeId: req.storeId });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      total = amount != null ? Number(amount) : product.price;
      items.push({ productId: product._id, name: product.name, price: total });
    } else {
      total = amount != null ? Number(amount) : 0;
      if (total <= 0) return res.status(400).json({ error: 'Amount required when no product specified' });
      items.push({ name: 'Manual entry', price: total });
    }
    const tx = await SaaTestTransaction.create({
      storeId: req.storeId,
      items: items,
      total: total,
      paymentMethod: paymentMethod,
      createdBy: req.user.userId
    });
    res.status(201).json(tx);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/saas/pos/summary — today's totals
router.get('/summary', async (req, res) => {
  try {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var match = { storeId: req.storeId, createdAt: { $gte: today } };
    var txs = await SaaTestTransaction.find(match).lean();
    var count = txs.length;
    var total = 0;
    var cashTotal = 0;
    var cardTotal = 0;
    for (var i = 0; i < txs.length; i++) {
      total += txs[i].total;
      if (txs[i].paymentMethod === 'cash') cashTotal += txs[i].total;
      else cardTotal += txs[i].total;
    }
    res.json({ date: today, transactionCount: count, totalSales: total, cashTotal: cashTotal, cardTotal: cardTotal });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
