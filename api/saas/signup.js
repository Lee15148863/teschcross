const express = require('express');
const router = express.Router();
const StoreSignup = require('../../models/saas/StoreSignup');

// POST /api/saas/signup — store owner registration request
router.post('/', async (req, res) => {
  try {
    const { storeName, ownerName, email, phone, country, businessType, notes } = req.body;
    if (!storeName || !ownerName || !email) {
      return res.status(400).json({ error: 'Store name, owner name, and email are required' });
    }
    const signup = await StoreSignup.create({
      storeName, ownerName, email, phone: phone || '', country: country || '',
      businessType: businessType || '', notes: notes || ''
    });
    res.json({ success: true, message: 'Registration submitted. Awaiting approval.', id: signup._id });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'This email has already registered' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/saas/signup — list signups (super_admin only, placeholder middleware)
router.get('/', async (req, res) => {
  try {
    const signups = await StoreSignup.find({}).sort({ createdAt: -1 });
    res.json(signups);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
