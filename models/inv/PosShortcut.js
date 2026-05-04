const mongoose = require('mongoose');

const PosShortcutSchema = new mongoose.Schema({
  sort_no:    { type: Number, required: true, unique: true, min: 1, max: 20 },
  title:      { type: String, default: '', trim: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  price:      { type: Number, default: 0, min: 0 },
  vat:        { type: Number, default: 0.23, min: 0, max: 1 },
  sku:        { type: String, default: '', trim: true },
  status:     { type: Boolean, default: false },
  updatedAt:  { type: Date, default: Date.now }
});

PosShortcutSchema.index({ sort_no: 1 }, { unique: true });

module.exports = mongoose.model('PosShortcut', PosShortcutSchema);
