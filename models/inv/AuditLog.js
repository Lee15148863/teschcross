const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action:        { type: String, required: true },
  operator:      { type: mongoose.Schema.Types.ObjectId, ref: 'InvUser', required: true },
  targetType:    { type: String, required: true },
  targetId:      { type: String },
  encryptedData: { type: String, required: true }, // AES-256 encrypted (legacy + primary store)
  // Enriched fields for queryability (added SOFT FREEZE phase)
  role:          { type: String, enum: ['root', 'manager', 'staff', '', null], default: null },
  module:        { type: String, enum: ['checkout', 'refund', 'device', 'system', 'user', 'dailyclose', '', null], default: null },
  beforeSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  afterSnapshot:  { type: mongoose.Schema.Types.Mixed, default: null },
  ip:            { type: String },
  createdAt:     { type: Date, default: Date.now }
});

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ module: 1, createdAt: -1 });
AuditLogSchema.index({ operator: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
