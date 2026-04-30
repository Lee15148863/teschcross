const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true }, // YYYYMMDDHHmmss
  items: [{
    product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:         { type: String, required: true },
    sku:          { type: String, required: true },
    serialNumber: { type: String },
    quantity:     { type: Number, required: true, min: 1 },
    unitPrice:    { type: Number, required: true },
    costPrice:    { type: Number, required: true },
    isSecondHand: { type: Boolean, default: false },
    purchasedFromCustomer: { type: Boolean, default: false },
    marginScheme: { type: Boolean, default: false },
    source:       { type: String, enum: ['customer', 'dealer', 'other', ''], default: '' },
    vatRate:      { type: Number, default: 0.23 },
    discount:     {
      type:  { type: String, enum: ['percentage', 'fixed'] },
      value: { type: Number }
    },
    discountedPrice: { type: Number },
    subtotal:     { type: Number, required: true },
    vatAmount:    { type: Number, default: 0 },
    marginVat:    { type: Number, default: 0 }
  }],
  orderDiscount: {
    type:  { type: String, enum: ['percentage', 'fixed'] },
    value: { type: Number }
  },
  subtotalBeforeOrderDiscount: { type: Number },
  totalAmount:      { type: Number, required: true },
  standardVatTotal: { type: Number, default: 0 },
  marginVatTotal:   { type: Number, default: 0 },
  paymentMethod:    { type: String, enum: ['cash', 'card', 'split'], required: true },
  cardAmount:       { type: Number },
  cashReceived:     { type: Number },
  changeGiven:      { type: Number },
  operator:         { type: mongoose.Schema.Types.ObjectId, ref: 'InvUser', required: true },
  discountOperator: { type: mongoose.Schema.Types.ObjectId, ref: 'InvUser' },
  invoiceGenerated: { type: Boolean, default: false },
  exported:         { type: Boolean, default: false },
  createdAt:        { type: Date, default: Date.now }
});

TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ receiptNumber: 1 }, { unique: true });
TransactionSchema.index({ 'items.serialNumber': 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
