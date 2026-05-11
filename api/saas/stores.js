const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Store = require('../../models/saas/Store');
const StoreSignup = require('../../models/saas/StoreSignup');
const SaaSUser = require('../../models/saas/SaaSUser');

const JWT_SECRET = process.env.INV_JWT_SECRET || 'saas-dev-secret';
const BCRYPT_SALT_ROUNDS = 10;

// Super admin auth middleware
function superAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
      if (decoded.role === 'super_admin') { req.user = decoded; return next(); }
    } catch (e) { /* fall through */ }
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// GET /api/saas/stores — list all stores (super_admin only)
router.get('/', superAdminAuth, async (req, res) => {
  try {
    const stores = await Store.find({}).sort({ createdAt: -1 });
    res.json(stores);
  } catch (e) { res.status(500).json({ error: 'Internal server error' }); }
});

// POST /api/saas/stores/approve/:signupId — approve a store signup (super_admin)
router.post('/approve/:signupId', superAdminAuth, async (req, res) => {
  try {
    const signup = await StoreSignup.findById(req.params.signupId);
    if (!signup) return res.status(404).json({ error: 'Signup not found' });
    if (signup.status !== 'pending') return res.status(400).json({ error: 'Signup already processed' });

    // Create the store
    const store = await Store.create({
      name: signup.storeName, ownerName: signup.ownerName, email: signup.email,
      phone: signup.phone, country: signup.country, businessType: signup.businessType,
      notes: signup.notes, status: 'active', approvedBy: req.user.userId, approvedAt: new Date()
    });

    // Create store_root user
    const defaultPw = 'store_' + Math.random().toString(36).slice(2, 8);
    const hashed = await bcrypt.hash(defaultPw, BCRYPT_SALT_ROUNDS);
    const rootUser = await SaaSUser.create({
      username: 'admin_' + store.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      password: hashed, displayName: signup.ownerName, email: signup.email,
      role: 'store_root', storeId: store._id, active: true
    });

    // Mark signup as approved
    signup.status = 'approved';
    signup.reviewedBy = req.user.userId;
    signup.reviewedAt = new Date();
    await signup.save();

    res.json({ success: true, store: { id: store._id, name: store.name }, credentials: { username: rootUser.username, password: defaultPw } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/saas/stores/reject/:signupId — reject a store signup (super_admin)
router.post('/reject/:signupId', superAdminAuth, async (req, res) => {
  try {
    const signup = await StoreSignup.findById(req.params.signupId);
    if (!signup) return res.status(404).json({ error: 'Signup not found' });
    signup.status = 'rejected';
    signup.reviewedBy = req.user.userId;
    signup.reviewedAt = new Date();
    await signup.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:id/suspend — suspend a store (super_admin)
router.put('/:id/suspend', superAdminAuth, async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, { status: 'suspended', updatedAt: new Date() }, { new: true });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json({ success: true, status: store.status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:id/activate — activate a store (super_admin)
router.put('/:id/activate', superAdminAuth, async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, { status: 'active', updatedAt: new Date() }, { new: true });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json({ success: true, status: store.status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
