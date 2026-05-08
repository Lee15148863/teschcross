/**
 * inv-invoice-pdf.js — Production Invoice PDF Generator (Pro Design v2)
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
const fs = require('fs');
const path = require('path');

// ─── Company Info (hardcoded per spec) ─────────────────────────────────
const COMPANY = {
  name: 'TechCross Repair Centre',
  vatNumber: 'IE3330982OH',
  address: 'UNIT M.4, Navan Town Centre',
  address2: 'Kennedy Road, Navan, Co. Meath, C15 F658',
  phone: '046 905 9854',
  mobile: '089 482 5300',
  logoPath: path.join(__dirname, '..', 'logo.png'),
  logoWidth: 80,
};

// ─── Layout constants (A4: 595 x 842 pt, 72 DPI) ────────────────────────
const MARGIN = 50;
const PAGE_WIDTH = 595;
const USABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN;

// Colors
const BRAND_BLUE = '#0056b3';
const BRAND_LIGHT_BLUE = '#e7f1ff';
const DARK = '#1a1a1a';
const GRAY = '#4a4a4a';
const LIGHT = '#8a8a8a';

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
  doc.strokeColor(color || BRAND_BLUE);
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
  doc.lineWidth(1);
}

// ─── Pro Design Sections ────────────────────────────────────────────────

function drawProHeaderWithLogo(doc) {
  let y = MARGIN + 10;

  // Brand bar background
  doc.rect(MARGIN, y, USABLE_WIDTH, 60).fill(BRAND_BLUE);

  // Logo
  let logoRight = MARGIN + 15;
  try {
    if (fs.existsSync(COMPANY.logoPath)) {
      doc.image(COMPANY.logoPath, MARGIN + 15, y + 8, { width: COMPANY.logoWidth });
      logoRight = MARGIN + 15 + COMPANY.logoWidth + 15;
    }
  } catch (e) { /* skip logo */ }

  // Company name
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff');
  doc.text(COMPANY.name, logoRight, y + 14, { align: 'left', width: USABLE_WIDTH - (logoRight - MARGIN) });

  // VAT number
  doc.font('Helvetica').fontSize(10).fillColor('#ffffff');
  doc.text('VAT Number: ' + COMPANY.vatNumber, logoRight, y + 34, { align: 'left', width: USABLE_WIDTH - (logoRight - MARGIN) });

  y += 70;

  // Contact info below brand bar
  doc.font('Helvetica').fontSize(9).fillColor(GRAY);
  doc.text(COMPANY.address, MARGIN, y);
  y += 12;
  doc.text(COMPANY.address2, MARGIN, y);
  y += 12;
  doc.text('Tel: ' + COMPANY.phone + ' | Mob/WhatsApp: ' + COMPANY.mobile, MARGIN, y);
  y += 25;

  return y;
}

function drawProInvoiceInfoWithBillTo(doc, invoice, startY) {
  let y = startY;
  const rightColX = MARGIN + USABLE_WIDTH / 2;

  // TAX INVOICE title (right side)
  doc.font('Helvetica-Bold').fontSize(20).fillColor(BRAND_BLUE);
  doc.text('TAX INVOICE', rightColX, startY - 50, { align: 'right', width: USABLE_WIDTH / 2 });

  // Bill To section (left side)
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND_BLUE);
  doc.text('Bill To:', MARGIN, startY - 50);

  doc.font('Helvetica').fontSize(9).fillColor(DARK);
  let billToY = startY - 35;

  // Use invoice.customerName and invoice.customerContact
  doc.text(invoice.customerName || 'Walk-in Customer', MARGIN, billToY);
  billToY += 12;

  if (invoice.customerContact) {
    doc.text(invoice.customerContact, MARGIN, billToY);
    billToY += 12;
  }

  // Invoice info (right column, aligned)
  doc.font('Helvetica').fontSize(10).fillColor(DARK);
  const infoY = startY - 35;

  // Invoice No
  doc.text('Invoice No:', rightColX, infoY, { align: 'left', width: 80 });
  doc.font('Helvetica-Bold');
  doc.text(invoice.invoiceNumber, rightColX + 85, infoY, { align: 'left', width: USABLE_WIDTH / 2 - 85 });
  doc.font('Helvetica');

  // Date
  const dateStr = invoice.transactionDate
    ? formatDate(invoice.transactionDate)
    : formatDate(invoice.createdAt);
  doc.text('Date:', rightColX, infoY + 16, { align: 'left', width: 80 });
  doc.font('Helvetica-Bold');
  doc.text(dateStr, rightColX + 85, infoY + 16, { align: 'left', width: USABLE_WIDTH / 2 - 85 });
  doc.font('Helvetica');

  // Payment Method
  const pmtLabels = { cash: 'Cash', card: 'Card', split: 'Split (Cash + Card)' };
  doc.text('Payment:', rightColX, infoY + 32, { align: 'left', width: 80 });
  doc.font('Helvetica-Bold');
  doc.text(pmtLabels[invoice.paymentMethod] || invoice.paymentMethod, rightColX + 85, infoY + 32, { align: 'left', width: USABLE_WIDTH / 2 - 85 });
  doc.font('Helvetica');

  y += 10;
  hr(doc, y, BRAND_LIGHT_BLUE, 2);
  y += 18;

  return y;
}

function drawProItemsTable(doc, invoice, startY) {
  let y = startY;

  // Table column positions
  const colItem = MARGIN;
  const colQty = 360;
  const colPrice = 410;
  const colTotal = 485;
  const colEnd = PAGE_WIDTH - MARGIN;
  const rowH = 22;
  const headerH = 28;
  const padding = 6;

  // Header
  doc.rect(MARGIN, y, USABLE_WIDTH, headerH).fill(BRAND_BLUE);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
  doc.text('Item Description', colItem + padding, y + padding + 4, { width: colQty - colItem - padding });
  doc.text('Qty', colQty, y + padding + 4, { width: colPrice - colQty, align: 'center' });
  doc.text('Unit Price', colPrice, y + padding + 4, { width: colTotal - colPrice, align: 'right' });
  doc.text('Line Total', colTotal, y + padding + 4, { width: colEnd - colTotal, align: 'right' });
  y += headerH;

  // Rows
  const items = invoice.items || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (i % 2 === 1) {
      doc.rect(MARGIN, y, USABLE_WIDTH, rowH).fill('#f8f9fa');
    }

    doc.font('Helvetica').fontSize(9).fillColor(DARK);
    doc.text(item.name || '—', colItem + padding, y + padding + 2, {
      width: colQty - colItem - padding - 4,
      lineBreak: true,
    });

    doc.text(String(item.quantity || 1), colQty, y + padding + 2, { width: colPrice - colQty, align: 'center' });
    doc.text(euro(item.unitPrice), colPrice, y + padding + 2, { width: colTotal - colPrice, align: 'right' });

    doc.font('Helvetica-Bold');
    doc.text(euro(item.lineTotal), colTotal, y + padding + 2, { width: colEnd - colTotal, align: 'right' });
    doc.font('Helvetica');

    y += rowH;
  }

  hr(doc, y, BRAND_LIGHT_BLUE, 1.5);
  y += 16;

  return y;
}

function drawProTotal(doc, invoice, startY) {
  let y = startY;

  // Highlighted total box
  doc.rect(PAGE_WIDTH - MARGIN - 180, y, 180, 45).fill(BRAND_LIGHT_BLUE);

  doc.font('Helvetica').fontSize(11).fillColor(DARK);
  doc.text('Total Amount Due:', PAGE_WIDTH - MARGIN - 170, y + 12, { align: 'left', width: 100 });

  doc.font('Helvetica-Bold').fontSize(18).fillColor(BRAND_BLUE);
  doc.text(euro(invoice.grossTotal), PAGE_WIDTH - MARGIN - 170, y + 22, { align: 'right', width: 160 });

  y += 55;

  // Margin Scheme note
  if (invoice.hasMarginItems) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(GRAY);
    doc.rect(MARGIN, y, USABLE_WIDTH, 30).fill('#fff3cd');
    doc.text(
      'Margin Scheme applied – VAT is accounted for under Irish second-hand goods margin scheme.',
      MARGIN + 10, y + 10, { align: 'left', width: USABLE_WIDTH - 20 }
    );
    y += 40;
  }

  return y;
}

function drawProFooter(doc) {
  const pageH = doc.page.height;
  let y = pageH - MARGIN - 100;

  if (doc.y > y) {
    doc.addPage();
    y = MARGIN + 20;
  }

  hr(doc, y, BRAND_LIGHT_BLUE, 1);
  y += 16;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_BLUE);
  doc.text('Thank you for choosing TechCross Repair Centre.', MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 14;

  doc.font('Helvetica').fontSize(9).fillColor(GRAY);
  doc.text(
    'We appreciate your business and hope you are satisfied with our service. If you have any questions',
    MARGIN, y, { align: 'center', width: USABLE_WIDTH }
  );
  y += 12;
  doc.text(
    'regarding this invoice or your device, please do not hesitate to contact us via phone or WhatsApp.',
    MARGIN, y, { align: 'center', width: USABLE_WIDTH }
  );
  y += 20;

  doc.fontSize(8).fillColor(LIGHT);
  doc.text(
    'This is a computer-generated invoice and does not require a signature.',
    MARGIN, y, { align: 'center', width: USABLE_WIDTH }
  );
}

// ─── Main generate function ─────────────────────────────────────────────

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
      let y = drawProHeaderWithLogo(doc);
      y = drawProInvoiceInfoWithBillTo(doc, invoice, y);
      y = drawProItemsTable(doc, invoice, y);
      y = drawProTotal(doc, invoice, y);
      drawProFooter(doc);
    } catch (err) {
      reject(err);
      return;
    }

    doc.end();
  });
}

module.exports = { generate };
