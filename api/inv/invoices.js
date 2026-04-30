const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const Invoice = require('../../models/inv/Invoice');
const Transaction = require('../../models/inv/Transaction');
const SystemSetting = require('../../models/inv/SystemSetting');
const { jwtAuth, requireRole } = require('../../middleware/inv-auth');
const { calculateStandardVat, calculateMarginVat, DEFAULT_VAT_RATE } = require('../../utils/inv-vat-calculator');

// All routes require Staff+ access
router.use(jwtAuth, requireRole('admin', 'staff'));

// ─── Helper: Generate invoice number ────────────────────────────────────────
function generateInvoiceNumber() {
  const now = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `INV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

// ─── Helper: Get company info from SystemSetting ────────────────────────────
async function getCompanyInfo() {
  const defaults = {
    name: 'Tech Cross',
    address: 'Dublin, Ireland',
    phone: '',
    vatNumber: '',
    logo: ''
  };
  try {
    const setting = await SystemSetting.findOne({ key: 'companyInfo' });
    if (setting && setting.value) {
      return { ...defaults, ...setting.value };
    }
  } catch {
    // fallback to defaults
  }
  return defaults;
}

// ─── Helper: Create SMTP transporter ────────────────────────────────────────
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

// ─── Helper: Generate PDF buffer ────────────────────────────────────────────
function generatePdfBuffer(invoice, companyInfo) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Company header
    doc.fontSize(20).text(companyInfo.name, { align: 'center' });
    doc.fontSize(10).text(companyInfo.address, { align: 'center' });
    if (companyInfo.phone) {
      doc.text(`Tel: ${companyInfo.phone}`, { align: 'center' });
    }
    if (companyInfo.vatNumber) {
      doc.text(`VAT Reg No: ${companyInfo.vatNumber}`, { align: 'center' });
    }
    doc.moveDown();

    // Invoice title
    doc.fontSize(16).text('VAT INVOICE', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-GB')}`);
    doc.moveDown();

    // Customer info
    if (invoice.customerName) doc.text(`Customer: ${invoice.customerName}`);
    if (invoice.customerAddress) doc.text(`Address: ${invoice.customerAddress}`);
    if (invoice.customerVatNumber) doc.text(`VAT Number: ${invoice.customerVatNumber}`);
    doc.moveDown();

    // Items table header
    const tableTop = doc.y;
    const col = { name: 50, qty: 280, price: 340, vat: 420, subtotal: 490 };

    doc.font('Helvetica-Bold');
    doc.text('Item', col.name, tableTop);
    doc.text('Qty', col.qty, tableTop);
    doc.text('Unit Price', col.price, tableTop);
    doc.text('VAT', col.vat, tableTop);
    doc.text('Subtotal', col.subtotal, tableTop);
    doc.font('Helvetica');

    doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

    let y = tableTop + 25;
    for (const item of invoice.items) {
      doc.text(item.name, col.name, y, { width: 220 });
      doc.text(String(item.quantity), col.qty, y);
      doc.text(`€${item.unitPrice.toFixed(2)}`, col.price, y);
      if (item.isMarginScheme) {
        doc.text('Margin Scheme', col.vat, y, { width: 65 });
      } else {
        doc.text(item.vatAmount != null ? `€${item.vatAmount.toFixed(2)}` : '€0.00', col.vat, y);
      }
      doc.text(`€${item.subtotal.toFixed(2)}`, col.subtotal, y);
      y += 20;
    }

    // Totals
    doc.moveTo(50, y).lineTo(560, y).stroke();
    y += 10;
    doc.text(`Net Total: €${invoice.netTotal.toFixed(2)}`, col.vat, y);
    y += 15;
    doc.text(`VAT Total: €${invoice.vatTotal.toFixed(2)}`, col.vat, y);
    y += 15;
    doc.font('Helvetica-Bold');
    doc.text(`Gross Total: €${invoice.grossTotal.toFixed(2)}`, col.vat, y);
    doc.font('Helvetica');

    // Margin scheme note
    const hasMarginItems = invoice.items.some(i => i.isMarginScheme);
    if (hasMarginItems) {
      y += 30;
      doc.fontSize(8).text('Note: Items marked "Margin Scheme" are second-hand goods sold under the VAT Margin Scheme. VAT is calculated on the profit margin only and is not shown separately.', 50, y, { width: 510 });
    }

    doc.end();
  });
}

// ─── GET /api/inv/invoices ──────────────────────────────────────────────────
// Invoice list with filters
router.get('/', async (req, res) => {
  try {
    const filter = {};
    const { invoiceNumber, customer, startDate, endDate } = req.query;

    if (invoiceNumber) {
      filter.invoiceNumber = { $regex: invoiceNumber, $options: 'i' };
    }
    if (customer) {
      filter.customerName = { $regex: customer, $options: 'i' };
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const invoices = await Invoice.find(filter)
      .populate('transaction', 'receiptNumber totalAmount paymentMethod createdAt')
      .sort({ createdAt: -1 });

    res.json({ data: invoices });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── POST /api/inv/invoices/batch-send ──────────────────────────────────────
// Batch send invoices via email
// NOTE: Must be defined BEFORE /:id routes to avoid matching 'batch-send' as an id
router.post('/batch-send', async (req, res) => {
  try {
    const { invoiceIds } = req.body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({ error: '缺少要发送的 Invoice ID 列表', code: 'VALIDATION_ERROR' });
    }

    const invoices = await Invoice.find({ _id: { $in: invoiceIds } });
    if (invoices.length === 0) {
      return res.status(404).json({ error: '未找到指定的 Invoice 记录' });
    }

    const companyInfo = await getCompanyInfo();
    const transporter = createTransporter();
    const results = [];

    for (const invoice of invoices) {
      if (!invoice.customerEmail) {
        results.push({ invoiceId: invoice._id, status: 'failed', error: '缺少客户邮箱' });
        continue;
      }

      try {
        const pdfBuffer = await generatePdfBuffer(invoice, companyInfo);

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: invoice.customerEmail,
          subject: `VAT Invoice ${invoice.invoiceNumber}`,
          text: `Dear ${invoice.customerName || 'Customer'},\n\nPlease find attached your VAT Invoice ${invoice.invoiceNumber}.\n\nTotal: €${invoice.grossTotal.toFixed(2)}\n\nThank you for your business.\n\n${companyInfo.name}`,
          attachments: [{
            filename: `${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        });

        invoice.emailStatus = 'sent';
        invoice.emailSentAt = new Date();
        await invoice.save();
        results.push({ invoiceId: invoice._id, status: 'sent' });
      } catch (emailErr) {
        invoice.emailStatus = 'failed';
        await invoice.save();
        results.push({ invoiceId: invoice._id, status: 'failed', error: emailErr.message });
      }
    }

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── POST /api/inv/invoices/:transactionId/generate ─────────────────────────
// Generate VAT Invoice from a transaction
router.post('/:transactionId/generate', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { customerName, customerAddress, customerVatNumber, customerEmail } = req.body;

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: '交易记录不存在' });
    }

    // Check if invoice already generated
    if (transaction.invoiceGenerated) {
      // Find existing invoice
      const existing = await Invoice.findOne({ transaction: transactionId });
      if (existing) {
        return res.status(409).json({
          error: '该交易已生成 Invoice',
          code: 'INVOICE_EXISTS',
          invoice: existing
        });
      }
    }

    // Build invoice items from transaction items
    const vatRate = DEFAULT_VAT_RATE;
    let netTotal = 0;
    let vatTotal = 0;

    const invoiceItems = transaction.items.map(item => {
      const price = item.discountedPrice != null ? item.discountedPrice : item.unitPrice;
      const subtotal = price * item.quantity;
      const isMarginScheme = item.isSecondHand || false;

      let vatAmount = 0;
      if (isMarginScheme) {
        vatAmount = calculateMarginVat(price, item.costPrice, vatRate) * item.quantity;
      } else {
        vatAmount = calculateStandardVat(price, vatRate) * item.quantity;
      }

      // Net = subtotal - vat for standard items; for margin scheme, net = subtotal
      const itemNet = isMarginScheme ? subtotal : subtotal - vatAmount;
      netTotal += itemNet;
      vatTotal += isMarginScheme ? vatAmount : vatAmount;

      return {
        name: item.name + (isMarginScheme ? ' — Second-hand goods — Margin Scheme applied' : ''),
        quantity: item.quantity,
        unitPrice: price,
        vatAmount: isMarginScheme ? 0 : Math.round(vatAmount * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        isMarginScheme
      };
    });

    netTotal = Math.round(netTotal * 100) / 100;
    vatTotal = Math.round(vatTotal * 100) / 100;
    const grossTotal = Math.round((netTotal + vatTotal) * 100) / 100;

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Create Invoice record
    const invoice = await Invoice.create({
      invoiceNumber,
      transaction: transaction._id,
      customerName: customerName || '',
      customerAddress: customerAddress || '',
      customerVatNumber: customerVatNumber || '',
      customerEmail: customerEmail || '',
      items: invoiceItems,
      netTotal,
      vatTotal,
      grossTotal
    });

    // Mark transaction as invoice generated
    transaction.invoiceGenerated = true;
    await transaction.save();

    res.status(201).json(invoice);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: '交易记录不存在' });
    }
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Invoice 编号重复，请重试', code: 'DUPLICATE_INVOICE' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/invoices/:id/pdf ──────────────────────────────────────────
// Generate and return Invoice PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice 不存在' });
    }

    const companyInfo = await getCompanyInfo();
    const pdfBuffer = await generatePdfBuffer(invoice, companyInfo);

    // Store pdf path reference
    invoice.pdfPath = `invoices/${invoice.invoiceNumber}.pdf`;
    await invoice.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Invoice 不存在' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── POST /api/inv/invoices/:id/send ────────────────────────────────────────
// Send Invoice PDF via email
router.post('/:id/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: '缺少收件人邮箱', code: 'VALIDATION_ERROR' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice 不存在' });
    }

    const companyInfo = await getCompanyInfo();
    const pdfBuffer = await generatePdfBuffer(invoice, companyInfo);
    const transporter = createTransporter();

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: `VAT Invoice ${invoice.invoiceNumber}`,
        text: `Dear ${invoice.customerName || 'Customer'},\n\nPlease find attached your VAT Invoice ${invoice.invoiceNumber}.\n\nTotal: €${invoice.grossTotal.toFixed(2)}\n\nThank you for your business.\n\n${companyInfo.name}`,
        attachments: [{
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      });

      invoice.emailStatus = 'sent';
      invoice.emailSentAt = new Date();
      invoice.customerEmail = email;
      await invoice.save();

      res.json({ message: 'Invoice 已发送', emailStatus: 'sent' });
    } catch (emailErr) {
      invoice.emailStatus = 'failed';
      await invoice.save();
      res.status(500).json({ error: '邮件发送失败', emailStatus: 'failed' });
    }
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Invoice 不存在' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
