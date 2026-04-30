const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const SystemSetting = require('../../models/inv/SystemSetting');
const AuditLog = require('../../models/inv/AuditLog');
const { jwtAuth, requireRole } = require('../../middleware/inv-auth');

// ─── Default settings ───────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  vatRate: 0.23,
  lowStockDefaults: { phone: 10, accessory: 30, tablet: 5 },
  companyInfo: {
    name: 'Tech Cross',
    address: 'Unit 4, Navan Shopping Centre, Navan, Co. Meath, Ireland',
    phone: '046 905 9854',
    vatNumber: '',
    logo: ''
  }
};

// ─── Helper: AES-256 encrypt ────────────────────────────────────────────────
function encryptData(data) {
  const key = process.env.INV_AUDIT_KEY;
  if (!key) throw new Error('INV_AUDIT_KEY not configured');
  const derivedKey = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// ─── GET /api/inv/settings ──────────────────────────────────────────────────
// Get all system settings (Staff+ access)
router.get('/', jwtAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const docs = await SystemSetting.find({});
    const settings = {};

    // Start with defaults
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      settings[key] = value;
    }

    // Override with stored values
    for (const doc of docs) {
      settings[doc.key] = doc.value;
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/settings/audit-log ────────────────────────────────────────
// View audit log (Admin only)
// Must be defined BEFORE any parameterized routes
router.get('/audit-log', jwtAuth, requireRole('admin'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({})
        .populate('operator', 'username displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments({})
    ]);

    res.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── PUT /api/inv/settings ──────────────────────────────────────────────────
// Update system settings (Admin only)
router.put('/', jwtAuth, requireRole('admin'), async (req, res) => {
  try {
    const { key, value, settings } = req.body;

    // Bulk update mode: { settings: { vatRate: 0.23, companyInfo: {...} } }
    if (settings && typeof settings === 'object') {
      const results = {};
      for (const [k, v] of Object.entries(settings)) {
        const doc = await SystemSetting.findOneAndUpdate(
          { key: k },
          { key: k, value: v, updatedBy: req.user.userId, updatedAt: new Date() },
          { upsert: true, new: true }
        );
        results[k] = doc.value;

        // Audit log for vatRate changes
        if (k === 'vatRate') {
          try {
            const encryptedData = encryptData({
              key: k,
              newValue: v,
              changedAt: new Date().toISOString(),
              changedBy: req.user.username
            });

            await AuditLog.create({
              action: 'vat_rate_change',
              operator: req.user.userId,
              targetType: 'setting',
              targetId: k,
              encryptedData,
              ip: req.ip || req.connection?.remoteAddress
            });
          } catch (auditErr) {
            console.error('审计日志创建失败:', auditErr.message);
          }
        }
      }
      return res.json(results);
    }

    // Single update mode: { key: 'vatRate', value: 0.23 }
    if (!key || typeof key !== 'string' || key.trim() === '') {
      return res.status(400).json({ error: '缺少设置键名（key）', code: 'VALIDATION_ERROR' });
    }

    if (value === undefined || value === null) {
      return res.status(400).json({ error: '缺少设置值（value）', code: 'VALIDATION_ERROR' });
    }

    const doc = await SystemSetting.findOneAndUpdate(
      { key: key.trim() },
      { key: key.trim(), value, updatedBy: req.user.userId, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    // Audit log for vatRate changes
    if (key.trim() === 'vatRate') {
      try {
        const encryptedData = encryptData({
          key: key.trim(),
          newValue: value,
          changedAt: new Date().toISOString(),
          changedBy: req.user.username
        });

        await AuditLog.create({
          action: 'vat_rate_change',
          operator: req.user.userId,
          targetType: 'setting',
          targetId: key.trim(),
          encryptedData,
          ip: req.ip || req.connection?.remoteAddress
        });
      } catch (auditErr) {
        console.error('审计日志创建失败:', auditErr.message);
      }
    }

    res.json({ key: doc.key, value: doc.value });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('；') });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
