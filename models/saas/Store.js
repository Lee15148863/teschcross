const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  ownerName:    { type: String, trim: true },
  email:        { type: String, trim: true, lowercase: true },
  phone:        { type: String, trim: true },
  country:      { type: String, trim: true },
  businessType: { type: String, trim: true },
  notes:        { type: String, trim: true },

  // Store display settings (from dashboard)
  logo:       { type: String },
  address:    { type: String, trim: true },
  vatNumber:  { type: String, trim: true },
  receiptTC:  { type: String, trim: true },

  status:      { type: String, enum: ['active', 'suspended', 'frozen', 'pending'], default: 'pending' },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'SaaSUser', default: null },
  approvedAt:  { type: Date },

  // T20/T21 — timezone and currency from signup, no mongoUri here
  timezone:    { type: String, trim: true },
  currency:    { type: String, trim: true },

  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now }
});

StoreSchema.index({ email: 1 });
StoreSchema.index({ status: 1 });

module.exports = mongoose.model('SaaStore', StoreSchema);
