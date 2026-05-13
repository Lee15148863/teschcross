const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const StoreSignup = require('../../models/saas/StoreSignup');
const SaaSUser = require('../../models/saas/SaaSUser');
const { maskMongoUri, validateMongoUriFormat } = require('../../utils/mongo-uri-validator');

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
      // T20/T21 optional fields
      timezone, currency, mongoUri, deploymentPin, atlasOwnershipConfirmed,
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

    // If mongoUri provided, require full onboarding fields
    let validatedPinStr = '';
    if (mongoUri) {
      if (!timezone) return res.status(400).json({ error: 'Timezone required when providing MongoDB URI' });
      if (!currency) return res.status(400).json({ error: 'Currency required when providing MongoDB URI' });
      if (!deploymentPin) return res.status(400).json({ error: 'Deployment PIN required when providing MongoDB URI' });
      if (atlasOwnershipConfirmed !== true) {
        return res.status(400).json({ error: 'You must confirm Atlas data ownership (atlasOwnershipConfirmed=true)' });
      }
      validatedPinStr = String(deploymentPin).replace(/\D/g, '');
      if (validatedPinStr.length < 4 || validatedPinStr.length > 20) {
        return res.status(400).json({ error: 'Deployment PIN must be 4-20 digits' });
      }
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

    // Build signup fields
    const signupFields = {
      storeName, ownerName, username: username.trim(), email, phone: phone || '', country: country || '',
      businessType: businessType || '', notes: notes || '', password: hashedPw
    };

    // Handle MongoDB URI onboarding fields
    if (mongoUri) {
      // Validate URI format (fast, no connection)
      const fmtCheck = validateMongoUriFormat(mongoUri, {
        mainPosDbName: process.env.STORE_NAME || 'techcross',
        adminDbName: process.env.SAAS_DB_NAME || 'saas_admin',
      });
      if (!fmtCheck.ok) {
        return res.status(400).json({ error: 'Invalid MongoDB URI: ' + fmtCheck.message, maskedUri: fmtCheck.maskedUri });
      }

      // Store masked URI, never full URI in response
      signupFields.mongoUri = mongoUri;
      signupFields.mongoUriMasked = maskMongoUri(mongoUri);
      signupFields.mongoUriValidationStatus = 'pending';
      signupFields.timezone = timezone;
      signupFields.currency = currency;

      // Hash deployment PIN immediately — never store plaintext
      signupFields.deploymentPinHash = await bcrypt.hash(validatedPinStr, BCRYPT_SALT_ROUNDS);
      signupFields.pinSetAt = new Date();
      signupFields.atlasOwnershipConfirmed = true;

      if (subscriptionPlan) signupFields.subscriptionPlan = subscriptionPlan;
      if (trialLengthDays) signupFields.trialLengthDays = trialLengthDays;
    } else {
      // Production gate: reject legacy signup unless ALLOW_LEGACY_SIGNUP=true
      if (process.env.ALLOW_LEGACY_SIGNUP !== 'true') {
        return res.status(400).json({ error: 'MongoDB Atlas URI required. Set ALLOW_LEGACY_SIGNUP=true for development mode.' });
      }
      // Legacy signup — mark timezone/currency if provided
      if (timezone) signupFields.timezone = timezone;
      if (currency) signupFields.currency = currency;
    }

    const signup = await StoreSignup.create(signupFields);

    // Build response — never include mongoUri or deploymentPinHash
    const response = {
      success: true,
      message: 'Registration submitted. Awaiting approval.',
      id: signup._id,
    };
    if (signup.mongoUriMasked) {
      response.mongoUriMasked = signup.mongoUriMasked;
    }

    res.json(response);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'This email has already registered' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/saas/signup — list signups (super_admin only)
router.get('/', superAdminAuth, async (req, res) => {
  try {
    const signups = await StoreSignup.find({}).sort({ createdAt: -1 });
    res.json(signups);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
