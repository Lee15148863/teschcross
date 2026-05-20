const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const StoreSignup = require('../../models/saas/StoreSignup');
const SaaSUser = require('../../models/saas/SaaSUser');

const JWT_SECRET = process.env.SAAS_JWT_SECRET;
const BCRYPT_SALT_ROUNDS = 10;

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

// POST /api/saas/signup — store owner registration request
router.post('/', async (req, res) => {
  try {
    const {
      storeName, ownerName, username, email, phone, country, businessType, notes, password,
      timezone, currency, byoMongoRequested,
      subscriptionPlan, trialLengthDays
    } = req.body;

    if (!storeName || !ownerName || !email) {
      return res.status(400).json({ error: 'Store name, owner name, and email are required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password is required and must be at least 6 characters' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check username uniqueness across SaaS users
    const existingUser = await SaaSUser.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    // Idempotent: if pending signup exists, treat as success (retry-safe)
    const existing = await StoreSignup.findOne({ email: email.toLowerCase(), status: 'pending' });
    if (existing) {
      return res.json({ success: true, message: 'Registration submitted. Awaiting approval.', id: existing._id });
    }

    const hashedPw = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Build signup fields — no raw mongoUri collected at signup
    const signupFields = {
      storeName, ownerName, username: username.trim(), email, phone: phone || '', country: country || '',
      businessType: businessType || '', notes: notes || '', password: hashedPw
    };

    if (timezone) signupFields.timezone = timezone;
    if (currency) signupFields.currency = currency;

    var byoIntent = byoMongoRequested === true || byoMongoRequested === 'true';
    if (byoIntent) {
      signupFields.databasePreference = 'byo';
      signupFields.byoMongoRequested = true;
      signupFields.byoMongoConfigured = false;
      signupFields.byoSetupStatus = 'pending_admin_verification';
    } else {
      signupFields.databasePreference = 'managed';
      signupFields.byoMongoRequested = false;
      signupFields.byoMongoConfigured = false;
    }

    if (subscriptionPlan) signupFields.subscriptionPlan = subscriptionPlan;
    if (trialLengthDays) signupFields.trialLengthDays = trialLengthDays;

    const signup = await StoreSignup.create(signupFields);

    // Response — never include raw mongoUri or maskedUri
    const response = {
      success: true,
      message: 'Registration submitted. Awaiting approval.',
      id: signup._id,
      databasePreference: signupFields.databasePreference
    };

    if (byoIntent) {
      response.byoMongoRequested = true;
      response.byoNote = 'BYO MongoDB requested. TechCross/Admin verification required before activation.';
    }

    res.json(response);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'This email has already registered' });
    }
    console.error('[signup] error:', e.name || 'Error', e.message || e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/saas/signup — list signups (super_admin only)
router.get('/', superAdminAuth, async (req, res) => {
  try {
    const signups = await StoreSignup.find({}).sort({ createdAt: -1 });
    res.json(signups);
  } catch (e) {
    console.error('[signup] list error:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
