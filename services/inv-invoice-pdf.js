/**
 * inv-invoice-pdf.js — Production Invoice PDF Generator
 *
 * Generates A4 portrait PDF invoices using PDFKit.
 * Company info is hardcoded per TechCross specs.
 * Margin Scheme goods DO NOT display VAT amounts.
 *
 * Usage:
 *   const generator = require('./services/inv-invoice-pdf');
 *   const pdfBuffer = await generator.generate(invoice);
 */

const PDFDocument = require('pdfkit');

// ─── Company Info (hardcoded per spec) ─────────────────────────────────
const COMPANY = {
  name: 'TechCross Repair Centre',
  vatNumber: 'IE3330982OH',
  address: 'UNIT M.4, Navan Town Centre',
  address2: 'Kennedy Road, Navan, Co. Meath, C15 F658',
  phone: '046 905 9854',
  mobile: '089 482 5300',
};

// ─── Layout constants (A4: 595 x 842 pt, 72 DPI) ────────────────────────
const MARGIN = 50;
const PAGE_WIDTH = 595;
const USABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN;

// Colors
const DARK = '#222222';
const GRAY = '#555555';
const LIGHT = '#999999';

// ─── Helpers ────────────────────────────────────────────────────────────
function euro(n) {
  return '€' + (n || 0).toFixed(2);
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Draw helpers ───────────────────────────────────────────────────────
function hr(doc, y, color, width) {
  doc.lineWidth(width || 1);
  doc.strokeColor(color || '#000');
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
  doc.lineWidth(1);
}

function wrapText(doc, text, x, y, width, lineHeight) {
  doc.text(text, x, y, { width: width || USABLE_WIDTH, lineBreak: true });
  return doc.y + (lineHeight || 4);
}

// ─── Sections ───────────────────────────────────────────────────────────

function drawHeader(doc) {
  let y = MARGIN + 15;

  // Company name
  doc.font('Helvetica-Bold').fontSize(20).fillColor(DARK);
  doc.text(COMPANY.name, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 24;

  // VAT number
  doc.font('Helvetica').fontSize(10).fillColor(DARK);
  doc.text('VAT Number: ' + COMPANY.vatNumber, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 15;

  // Address lines
  doc.fontSize(9).fillColor(GRAY);
  doc.text(COMPANY.address, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 13;
  doc.text(COMPANY.address2, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 13;

  // Contact
  doc.text('Tel: ' + COMPANY.phone + ' | Mob/WhatsApp: ' + COMPANY.mobile, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 20;

  // Divider
  hr(doc, y, '#000', 2);
  y += 18;

  return y;
}

function drawInvoiceInfo(doc, invoice, startY) {
  let y = startY;

  // Title
  doc.font('Helvetica-Bold').fontSize(16).fillColor(DARK);
  doc.text('INVOICE / RECEIPT', MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 26;

  // Invoice number
  doc.font('Helvetica').fontSize(10).fillColor(DARK);
  doc.text('Invoice No: ' + invoice.invoiceNumber, MARGIN, y, { align: 'left', width: USABLE_WIDTH });
  y += 15;

  // Date
  const dateStr = invoice.transactionDate
    ? formatDate(invoice.transactionDate)
    : formatDate(invoice.createdAt);
  doc.text('Date: ' + dateStr, MARGIN, y, { align: 'left', width: USABLE_WIDTH });
  y += 15;

  // Payment method
  const pmtLabels = { cash: 'Cash', card: 'Card', split: 'Split (Cash + Card)' };
  doc.text('Payment Method: ' + (pmtLabels[invoice.paymentMethod] || invoice.paymentMethod), MARGIN, y);
  y += 22;

  // Subtle divider
  hr(doc, y, '#ccc', 0.5);
  y += 14;

  return y;
}

function drawItemsTable(doc, invoice, startY) {
  let y = startY;

  // ─── Table setup ─────────────────────────────────────
  const colItem = MARGIN;
  const colQty = 370;
  const colPrice = 420;
  const colTotal = 490;
  const colEnd = PAGE_WIDTH - MARGIN;
  const rowH = 20;
  const headerH = 24;
  const padding = 4;

  // Table header
  doc.rect(MARGIN, y, USABLE_WIDTH, headerH).fill('#f5f5f5');
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK);
  doc.text('Item', colItem + padding, y + padding + 2, { width: colQty - colItem - padding });
  doc.text('Qty', colQty, y + padding + 2, { width: colPrice - colQty, align: 'center' });
  doc.text('Price', colPrice, y + padding + 2, { width: colTotal - colPrice, align: 'right' });
  doc.text('Total', colTotal, y + padding + 2, { width: colEnd - colTotal, align: 'right' });
  y += headerH;

  // Table rows
  const items = invoice.items || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Alternating row background
    if (i % 2 === 1) {
      doc.rect(MARGIN, y, USABLE_WIDTH, rowH).fill('#fafafa');
    }

    doc.font('Helvetica').fontSize(9).fillColor(DARK);

    // Item name
    doc.text(item.name || '—', colItem + padding, y + padding, {
      width: colQty - colItem - padding - 4,
      lineBreak: true,
    });

    // Qty
    const qtyStr = String(item.quantity || 1);
    doc.text(qtyStr, colQty, y + padding, { width: colPrice - colQty, align: 'center' });

    // Unit Price
    doc.text(euro(item.unitPrice), colPrice, y + padding, { width: colTotal - colPrice, align: 'right' });

    // Line Total
    doc.text(euro(item.lineTotal), colTotal, y + padding, { width: colEnd - colTotal, align: 'right' });

    y += rowH;
  }

  // Bottom border
  hr(doc, y, '#ccc', 0.5);
  y += 12;

  return y;
}

function drawTotal(doc, invoice, startY) {
  let y = startY;

  // Total
  doc.font('Helvetica-Bold').fontSize(14).fillColor(DARK);
  doc.text('Total: ' + euro(invoice.grossTotal), MARGIN, y, { align: 'right', width: USABLE_WIDTH });
  y += 26;

  // Margin Scheme note (if applicable)
  if (invoice.hasMarginItems) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(GRAY);
    doc.text(
      'Margin Scheme applied – VAT is accounted for under Irish second-hand goods margin scheme.',
      MARGIN, y, { align: 'center', width: USABLE_WIDTH }
    );
    y += 18;
  }

  return y;
}

function drawFooter(doc) {
  const pageH = doc.page.height;
  let y = pageH - MARGIN - 130;

  // If not enough room, start a new page
  if (doc.y > y) {
    doc.addPage();
    y = MARGIN + 20;
  }

  // Separator
  hr(doc, y, '#ccc', 1);
  y += 14;

  // Thank you message
  doc.font('Helvetica').fontSize(9).fillColor(GRAY);
  doc.text('Thank you for choosing TechCross Repair Centre.', MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 16;

  doc.text(
    'We appreciate your business and hope you are satisfied with our service.\n'
    + 'If you have any questions regarding this invoice or your device,\n'
    + 'please do not hesitate to contact us via phone or WhatsApp.',
    MARGIN, y, { align: 'center', width: USABLE_WIDTH }
  );
  y += 24;

  doc.fontSize(8).fillColor(LIGHT);
  doc.text(
    'This is a computer-generated invoice and does not require a signature.',
    MARGIN, y, { align: 'center', width: USABLE_WIDTH }
  );
  y += 16;
}

// ─── Main generate function ─────────────────────────────────────────────

/**
 * Generate a full A4 invoice PDF from invoice data.
 *
 * @param {Object} invoice - Fully populated invoice document
 * @returns {Promise<Buffer>} PDF as buffer
 */
async function generate(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      info: {
        Title: 'VAT Invoice - ' + (invoice.invoiceNumber || ''),
        Author: COMPANY.name,
        Subject: 'VAT Invoice',
        Keywords: 'invoice, vat, techcross',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      let y = drawHeader(doc);
      y = drawInvoiceInfo(doc, invoice, y);
      y = drawItemsTable(doc, invoice, y);
      y = drawTotal(doc, invoice, y);
      drawFooter(doc);
    } catch (err) {
      reject(err);
      return;
    }

    doc.end();
  });
}

module.exports = { generate };
