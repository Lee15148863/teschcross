const mongoose = require('mongoose');

const LoginLogSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'InvUser', required: true },
  username:  { type: String, required: true },
  success:   { type: Boolean, required: true },
  ip:        { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

LoginLogSchema.index({ createdAt: -1 });
LoginLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('LoginLog', LoginLogSchema);
