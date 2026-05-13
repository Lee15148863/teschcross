const mongoose = require('mongoose');

const SaaTestProductSchema = new mongoose.Schema({
  storeId:   { type: mongoose.Schema.Types.ObjectId, ref: 'SaaStore', required: true },
  name:      { type: String, required: true, trim: true },
  price:     { type: Number, required: true, min: 0 },
  category:  { type: String, default: '', trim: true },
  active:    { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

SaaTestProductSchema.index({ storeId: 1, active: 1 });

module.exports = mongoose.model('SaaTestProduct', SaaTestProductSchema);
