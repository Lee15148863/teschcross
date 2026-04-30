const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true, trim: true },
  password:       { type: String, required: true }, // bcrypt hash
  displayName:    { type: String, required: true, trim: true },
  role:           { type: String, enum: ['admin', 'staff'], required: true },
  active:         { type: Boolean, default: true },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil:    { type: Date },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('InvUser', UserSchema);
