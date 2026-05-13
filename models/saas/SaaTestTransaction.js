const mongoose = require('mongoose');

const SaaTestTransactionSchema = new mongoose.Schema({
  storeId:       { type: mongoose.Schema.Types.ObjectId, ref: 'SaaStore', required: true },
  items:         [{ productId: mongoose.Schema.Types.ObjectId, name: String, price: Number }],
  total:         { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card'], required: true },
  createdAt:     { type: Date, default: Date.now },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'SaaSUser', default: null }
});

SaaTestTransactionSchema.index({ storeId: 1, createdAt: -1 });

module.exports = mongoose.model('SaaTestTransaction', SaaTestTransactionSchema);
