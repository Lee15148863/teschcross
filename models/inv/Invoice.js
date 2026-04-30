const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber:     { type: String, required: true, unique: true },
  transaction:       { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  customerName:      { type: String, trim: true },
  customerAddress:   { type: String, trim: true },
  customerVatNumber: { type: String, trim: true },
  customerEmail:     { type: String, trim: true },
  items: [{
    name:            { type: String, required: true },
    quantity:        { type: Number, required: true },
    unitPrice:       { type: Number, required: true },
    vatAmount:       { type: Number },
    subtotal:        { type: Number, required: true },
    isMarginScheme:  { type: Boolean, default: false }
  }],
  netTotal:    { type: Number, required: true },
  vatTotal:    { type: Number, required: true },
  grossTotal:  { type: Number, required: true },
  pdfPath:     { type: String },
  emailStatus: { type: String, enum: ['not_sent', 'sent', 'failed'], default: 'not_sent' },
  emailSentAt: { type: Date },
  createdAt:   { type: Date, default: Date.now }
});

InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ transaction: 1 });
InvoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
