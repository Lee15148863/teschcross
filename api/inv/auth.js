const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const InvUser = require('../../models/inv/User');
const LoginLog = require('../../models/inv/LoginLog');
const { jwtAuth, requireRole } = require('../../middleware/inv-auth');
const { validatePassword } = require('../../utils/inv-validators');

const JWT_SECRET = process.env.INV_JWT_SECRET;
const TOKEN_EXPIRES_IN = '8h';
const BCRYPT_SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const CAPTCHA_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// ─── Server-side CAPTCHA store ──────────────────────────────────────────────
// Map<captchaId, { answer: number, expiresAt: number }>
const captchaStore = new Map();

// Periodic cleanup of expired CAPTCHAs (every 5 minutes)
const captchaCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, data] of captchaStore) {
    if (now > data.expiresAt) {
      captchaStore.delete(id);
    }
  }
}, CAPTCHA_EXPIRY_MS);
// Unref so the timer doesn't prevent Node.js process from exiting
if (captchaCleanupInterval.unref) {
  captchaCleanupInterval.unref();
}

// ─── POST /api/inv/auth/captcha ─────────────────────────────────────────────
// Generate a simple math CAPTCHA
router.post('/captcha', (req, res) => {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const answer = a + b;
  const captchaId = crypto.randomUUID();
  const question = `${a} + ${b} = ?`;

  captchaStore.set(captchaId, {
    answer,
    expiresAt: Date.now() + CAPTCHA_EXPIRY_MS
  });

  res.json({ captchaId, question });
});

// ─── POST /api/inv/auth/login ───────────────────────────────────────────────
// Validate username, password, and CAPTCHA; handle account lockout
router.post('/login', async (req, res) => {
  try {
    const { username, password, captchaId, captchaAnswer, humanCheck } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // Validate human check (simple checkbox or CAPTCHA)
    if (captchaId) {
      // Math CAPTCHA mode
      const captchaData = captchaStore.get(captchaId);
      if (!captchaData) {
        return res.status(400).json({ error: '验证码无效或已过期' });
      }
      captchaStore.delete(captchaId);
      if (Date.now() > captchaData.expiresAt) {
        return res.status(400).json({ error: '验证码已过期' });
      }
      if (Number(captchaAnswer) !== captchaData.answer) {
        return res.status(400).json({ error: '验证码错误' });
      }
    } else if (!humanCheck) {
      // Simple checkbox mode
      return res.status(400).json({ error: '请确认您不是机器人' });
    }

    // Find user
    const user = await InvUser.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (!user.active) {
      return res.status(403).json({ error: '账号已停用，请联系管理员' });
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(423).json({
        error: `账号已锁定，请 ${remainingMin} 分钟后再试`,
        lockedUntil: user.lockedUntil,
        remainingMinutes: remainingMin
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Increment failure count
      const newFailedAttempts = (user.failedAttempts || 0) + 1;
      const updateFields = { failedAttempts: newFailedAttempts };

      // Lock account after MAX_FAILED_ATTEMPTS consecutive failures
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        updateFields.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }

      await InvUser.findByIdAndUpdate(user._id, updateFields);

      // Record failed login log
      await LoginLog.create({
        user: user._id,
        username: user.username,
        success: false,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(() => {}); // Log write failure should not affect main flow

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        return res.status(423).json({
          error: `连续登录失败 ${MAX_FAILED_ATTEMPTS} 次，账号已锁定 15 分钟`,
          lockedUntil: updateFields.lockedUntil,
          remainingMinutes: 15
        });
      }

      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // Success: reset failure count and clear lockout
    await InvUser.findByIdAndUpdate(user._id, {
      failedAttempts: 0,
      lockedUntil: null
    });

    // Record successful login log
    await LoginLog.create({
      user: user._id,
      username: user.username,
      success: true,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {});

    // Token expiry: staff 10h, admin 20min
    const tokenExpiry = user.role === 'admin' ? '20m' : '10h';

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        permissions: user.getPermissions()
      }
    });
  } catch (err) {
    console.error('Login error:', err.message, err.stack);
    res.status(500).json({ error: '服务器错误', detail: err.message });
  }
});

// ─── GET /api/inv/auth/users ────────────────────────────────────────────────
// Get user list (Admin only)
router.get('/users', jwtAuth, requireRole('admin'), async (req, res) => {
  try {
    const users = await InvUser.find({}, '-password').sort({ createdAt: -1 });
    res.json(users.map(u => ({ ...u.toObject(), permissions: u.getPermissions() })));
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── POST /api/inv/auth/users ───────────────────────────────────────────────
// Create user (Admin only)
router.post('/users', jwtAuth, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, displayName, role, permissions } = req.body;

    // Required fields validation
    if (!username || !password || !displayName || !role) {
      return res.status(400).json({ error: '缺少必填字段：username、password、displayName、role' });
    }

    // Role validation
    if (!['admin', 'staff'].includes(role)) {
      return res.status(400).json({ error: '角色必须为 admin 或 staff' });
    }

    // Password complexity validation
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ error: pwCheck.error });
    }

    // Username uniqueness check
    const existing = await InvUser.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await InvUser.create({
      username,
      password: hashedPassword,
      displayName,
      role,
      permissions: permissions || {}
    });

    res.status(201).json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: '用户名已存在' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── PUT /api/inv/auth/users/:id ────────────────────────────────────────────
// Edit user (Admin only) — can update displayName, role, active
router.put('/users/:id', jwtAuth, requireRole('admin'), async (req, res) => {
  try {
    const { displayName, role, active, permissions } = req.body;
    const updateFields = {};

    if (displayName !== undefined) updateFields.displayName = displayName;
    if (role !== undefined) {
      if (!['admin', 'staff'].includes(role)) {
        return res.status(400).json({ error: '角色必须为 admin 或 staff' });
      }
      updateFields.role = role;
    }
    if (active !== undefined) updateFields.active = active;
    if (permissions !== undefined) updateFields.permissions = permissions;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: '没有提供需要更新的字段' });
    }

    updateFields.updatedAt = new Date();

    const user = await InvUser.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ ...user.toObject(), permissions: user.getPermissions() });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── PUT /api/inv/auth/users/:id/disable ────────────────────────────────────
// Disable user (Admin only)
router.put('/users/:id/disable', jwtAuth, requireRole('admin'), async (req, res) => {
  try {
    const user = await InvUser.findByIdAndUpdate(
      req.params.id,
      { active: false, updatedAt: new Date() },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── PUT /api/inv/auth/users/:id/reset-password ─────────────────────────────
// Reset password (Admin only)
router.put('/users/:id/reset-password', jwtAuth, requireRole('admin'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: '新密码不能为空' });
    }

    // Password complexity validation
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ error: pwCheck.error });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await InvUser.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword, failedAttempts: 0, lockedUntil: null, updatedAt: new Date() },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ message: '密码重置成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── DELETE /api/inv/auth/users/:id ─────────────────────────────────────────
// Permanently delete user (Admin only)
router.delete('/users/:id', jwtAuth, requireRole('admin'), async (req, res) => {
  try {
    const targetUser = await InvUser.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // Cannot delete yourself
    if (targetUser._id.toString() === req.user.userId) {
      return res.status(400).json({ error: '不能删除自己的账号' });
    }

    // Check if user has transaction records
    const Transaction = require('../../models/inv/Transaction');
    const hasTransactions = await Transaction.findOne({ operator: req.params.id });
    if (hasTransactions) {
      return res.status(409).json({
        error: '该用户已有交易记录，不可删除。请使用停用功能。',
        code: 'HAS_TRANSACTIONS'
      });
    }

    await InvUser.findByIdAndDelete(req.params.id);

    // Clean up login logs
    const LoginLog = require('../../models/inv/LoginLog');
    await LoginLog.deleteMany({ user: req.params.id });

    res.json({ message: '用户已永久删除' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// Export for testing
router._captchaStore = captchaStore;

module.exports = router;
