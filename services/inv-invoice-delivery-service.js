/**
 * inv-invoice-delivery-service.js — Invoice Delivery Service
 *
 * Handles invoice PDF generation, email sending with PDF attachment,
 * and invoice data retrieval.
 * All deliveries are audit-logged.
 *
 * Uses Invoice snapshot data only — NO recalculation from Transaction.
 */

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Invoice = require('../models/inv/Invoice');
const AuditLog = require('../models/inv/AuditLog');
const pdfGenerator = require('./inv-invoice-pdf');
const shareService = require('./inv-share-service');

// ─── Helpers ─────────────────────────────────────────────────────────────

function encryptData(data) {
  const key = process.env.INV_AUDIT_KEY;
  if (!key) throw new Error('INV_AUDIT_KEY not configured');
  const derivedKey = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: (parseInt(process.env.SMTP_PORT) || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// ─── Service Functions ───────────────────────────────────────────────────

/**
 * Send an invoice via email with PDF attachment.
 *
 * @param {string} invoiceId - Invoice ObjectId
 * @param {string} recipientEmail - Recipient email address
 * @param {string} operatorId - User ObjectId of the operator
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function emailInvoice(invoiceId, recipientEmail, operatorId) {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw Object.assign(new Error('Invalid invoice ID'), { code: 'VALIDATION_ERROR' });
  }
  if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
    throw Object.assign(new Error('Valid recipient email is required'), { code: 'VALIDATION_ERROR' });
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw Object.assign(new Error('Invoice not found'), { code: 'NOT_FOUND' });
  }

  // Generate PDF
  const pdfBuffer = await pdfGenerator.generate(invoice);

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: recipientEmail,
    subject: 'VAT Invoice ' + invoice.invoiceNumber + ' — TechCross Repair Centre',
    text: 'Dear ' + (invoice.customerName || 'Customer') + ',\n\n'
      + 'Please find attached your VAT Invoice ' + invoice.invoiceNumber + '.\n\n'
      + 'Total: €' + (invoice.grossTotal || 0).toFixed(2) + '\n\n'
      + 'Thank you for your business.\n\n'
      + 'TechCross Repair Centre',
    attachments: [{
      filename: invoice.invoiceNumber + '.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  });

  // Update invoice status
  invoice.emailStatus = 'sent';
  invoice.emailSentAt = new Date();
  invoice.customerContact = recipientEmail;
  await invoice.save();

  // Audit log
  try {
    await AuditLog.create({
      action: 'INVOICE_EMAILED',
      operator: operatorId,
      targetType: 'Invoice',
      targetId: invoice._id.toString(),
      encryptedData: encryptData({
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber: invoice.receiptNumber,
        recipient: recipientEmail,
        messageId: info.messageId,
      }),
      module: 'checkout',
      createdAt: new Date(),
    });
  } catch (_) { /* non-blocking */ }

  return { success: true, messageId: info.messageId };
}

/**
 * Generate PDF buffer for an invoice.
 *
 * @param {string} invoiceId - Invoice ObjectId
 * @returns {Promise<Buffer>} PDF buffer
 */
async function getInvoicePdf(invoiceId) {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw Object.assign(new Error('Invalid invoice ID'), { code: 'VALIDATION_ERROR' });
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw Object.assign(new Error('Invoice not found'), { code: 'NOT_FOUND' });
  }

  return pdfGenerator.generate(invoice);
}

/**
 * Get invoice data for frontend display.
 *
 * @param {string} invoiceId - Invoice ObjectId
 * @returns {Promise<Object>} Invoice document
 */
async function getInvoiceData(invoiceId) {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw Object.assign(new Error('Invalid invoice ID'), { code: 'VALIDATION_ERROR' });
  }

  const invoice = await Invoice.findById(invoiceId)
    .populate('operator', 'displayName username');

  if (!invoice) {
    throw Object.assign(new Error('Invoice not found'), { code: 'NOT_FOUND' });
  }

  return invoice;
}

/**
 * Generate a WhatsApp deep link for invoice sharing.
 * Uses secure share token (14-day expiry). Message format per spec.
 *
 * @param {string} invoiceId - Invoice ObjectId
 * @param {string} phoneNumber - Customer phone number
 * @param {string} operatorId - User ObjectId of the operator
 * @returns {Promise<{link: string, text: string, shareUrl: string, pdfUrl: string, expiresAt: Date}>}
 */
async function getInvoiceWhatsAppLink(invoiceId, phoneNumber, operatorId) {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw Object.assign(new Error('Invalid invoice ID'), { code: 'VALIDATION_ERROR' });
  }

  const invoice = await Invoice.findById(invoiceId).select('invoiceNumber receiptNumber');
  if (!invoice) {
    throw Object.assign(new Error('Invoice not found'), { code: 'NOT_FOUND' });
  }

  // Create secure share token
  const { shareUrl, pdfUrl, expiresAt } = await shareService.createInvoiceToken(invoiceId, operatorId);

  // Normalize phone number
  let cleanPhone = String(phoneNumber || '').replace(/\D/g, '');
  if (!cleanPhone.startsWith('353') && cleanPhone.startsWith('08')) {
    cleanPhone = '353' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('353') && cleanPhone.startsWith('8')) {
    cleanPhone = '353' + cleanPhone;
  } else if (!cleanPhone.startsWith('353')) {
    cleanPhone = '353' + cleanPhone;
  }

  const text = 'Hi,\n\n'
    + 'Your TechCross invoice is ready.\n\n'
    + 'View / Download:\n'
    + shareUrl + '\n\n'
    + 'This secure link expires in 14 days.';

  const link = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(text);

  return { link, text, shareUrl, pdfUrl, expiresAt };
}

module.exports = {
  emailInvoice,
  getInvoicePdf,
  getInvoiceData,
  getInvoiceWhatsAppLink,
};
