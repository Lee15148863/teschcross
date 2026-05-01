const mongoose = require('mongoose');

// Permission keys for each module
const PERMISSION_KEYS = [
  'pos',           // POS 收银
  'products',      // 商品管理
  'stock',         // 库存管理
  'suppliers',     // 供应商管理
  'purchases',     // 采购管理
  'transactions',  // 交易记录
  'reports',       // 报表中心
  'invoices',      // VAT Invoice
  'settings',      // 系统设置
  'users',         // 用户管理
  'expenses',      // 每日支出
  'refund',        // 退款
  'website'        // 网站管理
];

const PermissionsSchema = new mongoose.Schema({
  pos:          { type: Boolean, default: true },
  products:     { type: Boolean, default: false },
  stock:        { type: Boolean, default: false },
  suppliers:    { type: Boolean, default: false },
  purchases:    { type: Boolean, default: false },
  transactions: { type: Boolean, default: false },
  reports:      { type: Boolean, default: false },
  invoices:     { type: Boolean, default: false },
  settings:     { type: Boolean, default: false },
  users:        { type: Boolean, default: false },
  expenses:     { type: Boolean, default: false },
  refund:       { type: Boolean, default: true },
  website:      { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true, trim: true },
  password:       { type: String, required: true },
  displayName:    { type: String, required: true, trim: true },
  role:           { type: String, enum: ['admin', 'staff'], required: true },
  permissions:    { type: PermissionsSchema, default: () => ({}) },
  active:         { type: Boolean, default: true },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil:    { type: Date },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now }
});

// Admin always has all permissions
UserSchema.methods.getPermissions = function() {
  if (this.role === 'admin') {
    const all = {};
    PERMISSION_KEYS.forEach(k => all[k] = true);
    return all;
  }
  return this.permissions ? this.permissions.toObject() : {};
};

module.exports = mongoose.model('InvUser', UserSchema);
module.exports.PERMISSION_KEYS = PERMISSION_KEYS;
