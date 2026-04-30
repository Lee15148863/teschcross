const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  sku:          { type: String, required: true, unique: true, trim: true },
  category:     { type: String, required: true, trim: true },
  costPrice:    { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  stock:        { type: Number, default: 0, min: 0 },
  isSecondHand: { type: Boolean, default: false },
  serialNumber: { type: String, trim: true },
  attributes:   { type: mongoose.Schema.Types.Mixed, default: {} },
  active:       { type: Boolean, default: true },
  lowStockThreshold: { type: Number, default: 10 },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now }
});

ProductSchema.index({ name: 'text', sku: 'text', serialNumber: 'text' });
ProductSchema.index({ category: 1, active: 1 });

module.exports = mongoose.model('Product', ProductSchema);
