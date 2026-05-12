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

// ─── Super Admin Impersonation ───────────────────────────────────────────────

// POST /api/saas/stores/impersonate/:storeId — super_admin enters any store
router.post('/impersonate/:storeId', superAdminAuth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    // Generate a scoped JWT that keeps super_admin role but targets this store
    const token = jwt.sign(
      { userId: req.user.userId, username: req.user.username, role: 'super_admin', storeId: req.params.storeId, impersonating: true },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, store: { id: store._id, name: store.name } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Store settings API (store owner + super_admin) ─────────────────────────────

function storeOrSuperAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
      if (decoded.role === 'super_admin') { req.user = decoded; return next(); }
      if (decoded.storeId === req.params.id && (decoded.role === 'store_root' || decoded.role === 'manager' || decoded.role === 'staff')) {
        req.user = decoded; return next();
      }
    } catch (e) { /* fall through */ }
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// GET /api/saas/stores/:id/settings — get store display settings
router.get('/:id/settings', storeOrSuperAuth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).select('name logo address phone email vatNumber receiptTC');
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json(store);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:id/settings — update store display settings
router.put('/:id/settings', storeOrSuperAuth, async (req, res) => {
  try {
    const allowed = ['name', 'logo', 'address', 'phone', 'email', 'vatNumber', 'receiptTC'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    updates.updatedAt = new Date();
    const store = await Store.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('name logo address phone email vatNumber receiptTC');
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json({ success: true, store });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Store User Management (super_admin only) ─────────────────────────────────

// GET /api/saas/stores/:storeId/users — list users for a store (super_admin invisible)
router.get('/:storeId/users', superAdminAuth, async (req, res) => {
  try {
    const users = await SaaSUser.find(
      { storeId: req.params.storeId, role: { $ne: 'super_admin' } },
      '-password'
    ).sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/saas/stores/:storeId/users/:userId — delete a store user (protect super_admin)
router.delete('/:storeId/users/:userId', superAdminAuth, async (req, res) => {
  try {
    const targetUser = await SaaSUser.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin' });
    }
    await SaaSUser.findByIdAndDelete(req.params.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:storeId/users/:userId/disable — disable a user (protect super_admin)
router.put('/:storeId/users/:userId/disable', superAdminAuth, async (req, res) => {
  try {
    const targetUser = await SaaSUser.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot disable super admin' });
    }
    targetUser.active = false;
    targetUser.updatedAt = new Date();
    await targetUser.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:storeId/users/:userId/enable — re-enable a disabled user
router.put('/:storeId/users/:userId/enable', superAdminAuth, async (req, res) => {
  try {
    const targetUser = await SaaSUser.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    targetUser.active = true;
    targetUser.updatedAt = new Date();
    await targetUser.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
