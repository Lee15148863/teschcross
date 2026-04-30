const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action:        { type: String, required: true },
  operator:      { type: mongoose.Schema.Types.ObjectId, ref: 'InvUser', required: true },
  targetType:    { type: String, required: true },
  targetId:      { type: String },
  encryptedData: { type: String, required: true }, // AES-256 encrypted
  ip:            { type: String },
  createdAt:     { type: Date, default: Date.now }
});

AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
