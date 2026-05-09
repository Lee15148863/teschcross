/**
 * inv-invoice-pdf.js — Production Invoice PDF Generator (Clean v3)
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

// Colors — subtle gray scheme
const DARK = '#1a1a1a';
const GRAY = '#495057';
const LIGHT = '#868e96';
const TABLE_HEADER = '#f1f3f5';
const STRIPE = '#f8f9fa';
const BORDER = '#dee2e6';

// ─── Helpers ────────────────────────────────────────────────────────────
function euro(n) {
  return '€' + (n || 0).toFixed(2);
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function vatLabel(vatType) {
  if (vatType === 'margin') return 'Margin Scheme (Second-hand Goods)';
  if (vatType === 'service' || vatType === 'reduced') return '13.5%';
  return '23%';
}

function isMarginItem(item) {
  return item.vatType === 'margin';
}

// ─── Draw helpers ───────────────────────────────────────────────────────
function hr(doc, y) {
  doc.lineWidth(1);
  doc.strokeColor(BORDER);
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
}

// ─── Sections ───────────────────────────────────────────────────────────

function drawProHeaderWithLogo(doc) {
  let y = MARGIN + 15;

  // Logo (optional, left-aligned)
  let leftX = MARGIN;
  try {
    if (fs.existsSync(COMPANY.logoPath)) {
      doc.image(COMPANY.logoPath, MARGIN, y, { width: COMPANY.logoWidth });
      leftX = MARGIN + COMPANY.logoWidth + 15;
    }
  } catch (e) { /* skip logo */ }

  // Company name
  doc.font('Helvetica-Bold').fontSize(18).fillColor(DARK);
  doc.text(COMPANY.name, leftX, y, { align: 'left' });

  // VAT number
  doc.font('Helvetica').fontSize(9).fillColor(GRAY);
  doc.text('VAT Number: ' + COMPANY.vatNumber, leftX, y + 22, { align: 'left' });

  y += 48;

  // Contact info
  doc.font('Helvetica').fontSize(9).fillColor(GRAY);
  doc.text(COMPANY.address, MARGIN, y);
  y += 13;
  doc.text(COMPANY.address2, MARGIN, y);
  y += 13;
  doc.text('Tel: ' + COMPANY.phone + ' | Mob/WhatsApp: ' + COMPANY.mobile, MARGIN, y);
  y += 22;

  // Divider
  hr(doc, y);
  y += 18;

  return y;
}

function drawProInvoiceInfoWithBillTo(doc, invoice, startY) {
  let y = startY;
  const rightColX = MARGIN + USABLE_WIDTH / 2;

  // TAX INVOICE title (right side)
  doc.font('Helvetica-Bold').fontSize(14).fillColor(DARK);
  doc.text('TAX INVOICE', PAGE_WIDTH - MARGIN - 200, y, { align: 'right', width: 200 });

  // Bill To section (left side)
  doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK);
  doc.text('Bill To:', MARGIN, y);

  doc.font('Helvetica').fontSize(9).fillColor(GRAY);
  doc.text(invoice.customerName || 'Walk-in Customer', MARGIN, y + 16);

  let leftBottom = y + 16 + 13;
  if (invoice.customerContact) {
    doc.text(invoice.customerContact, MARGIN, leftBottom);
    leftBottom += 13;
  }

  // Invoice details (right column)
  const pmtLabels = { cash: 'Cash', card: 'Card', split: 'Split (Cash + Card)' };
  const dateStr = invoice.transactionDate
    ? formatDate(invoice.transactionDate)
    : formatDate(invoice.createdAt);

  const infoLines = [
    { label: 'Invoice No:', value: invoice.invoiceNumber },
    { label: 'Date:', value: dateStr },
    { label: 'Payment:', value: pmtLabels[invoice.paymentMethod] || invoice.paymentMethod },
  ];

  let rightBottom = y;
  for (const line of infoLines) {
    doc.font('Helvetica').fontSize(10).fillColor(GRAY);
    doc.text(line.label, rightColX, rightBottom, { align: 'left', width: 75 });
    doc.font('Helvetica-Bold').fillColor(DARK);
    doc.text(line.value, rightColX + 80, rightBottom, { align: 'left', width: USABLE_WIDTH / 2 - 80 });
    doc.font('Helvetica');
    rightBottom += 18;
  }

  y = Math.max(leftBottom, rightBottom);
  y += 10;
  hr(doc, y);
  y += 16;

  return y;
}

function drawProItemsTable(doc, invoice, startY) {
  let y = startY;

  const colItem = MARGIN;
  const colQty = 310;
  const colPrice = 355;
  const colVat = 410;
  const colTotal = 475;
  const colEnd = PAGE_WIDTH - MARGIN;
  const rowH = 22;
  const headerH = 26;
  const padding = 6;

  // Table header
  doc.rect(MARGIN, y, USABLE_WIDTH, headerH).fill(TABLE_HEADER);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK);
  doc.text('Item Description', colItem + padding, y + padding + 3, { width: colQty - colItem - padding });
  doc.text('Qty', colQty, y + padding + 3, { width: colPrice - colQty, align: 'center' });
  doc.text('Unit Price', colPrice, y + padding + 3, { width: colVat - colPrice, align: 'right' });
  doc.text('VAT', colVat, y + padding + 3, { width: colTotal - colVat, align: 'center' });
  doc.text('Line Total', colTotal, y + padding + 3, { width: colEnd - colTotal, align: 'right' });
  y += headerH;

  // Rows
  const items = invoice.items || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (i % 2 === 1) {
      doc.rect(MARGIN, y, USABLE_WIDTH, rowH).fill(STRIPE);
    }

    doc.font('Helvetica').fontSize(9).fillColor(DARK);
    doc.text(item.name || '—', colItem + padding, y + padding + 2, {
      width: colQty - colItem - padding - 4,
      lineBreak: true,
    });

    doc.text(String(item.quantity || 1), colQty, y + padding + 2, { width: colPrice - colQty, align: 'center' });
    doc.text(euro(item.unitPrice), colPrice, y + padding + 2, { width: colVat - colPrice, align: 'right' });

    if (isMarginItem(item)) {
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(LIGHT);
    } else {
      doc.font('Helvetica').fontSize(9).fillColor(DARK);
    }
    doc.text(vatLabel(item.vatType), colVat, y + padding + 2, { width: colTotal - colVat, align: 'center' });

    doc.font('Helvetica-Bold');
    doc.text(euro(item.lineTotal), colTotal, y + padding + 2, { width: colEnd - colTotal, align: 'right' });
    doc.font('Helvetica');

    y += rowH;
  }

  hr(doc, y);
  y += 16;

  return y;
}

function drawProTotal(doc, invoice, startY) {
  let y = startY;
  const rightEdge = PAGE_WIDTH - MARGIN;

  // ─── VAT Summary (right-aligned) ────────────────────────────────
  const sw = 230;
  const sx = rightEdge - sw;

  doc.font('Helvetica').fontSize(10).fillColor(GRAY);

  doc.text('Subtotal:', sx, y, { width: 135, align: 'left' });
  doc.text(euro(invoice.subtotalExVat), sx + 135, y, { width: sw - 135, align: 'right' });

  if (invoice.standardVatTotal > 0) {
    y += 18;
    doc.text('Standard VAT @ 23%:', sx, y, { width: 135, align: 'left' });
    doc.text(euro(invoice.standardVatTotal), sx + 135, y, { width: sw - 135, align: 'right' });
  }

  if (invoice.reducedVatTotal > 0) {
    y += 18;
    doc.text('Reduced VAT @ 13.5%:', sx, y, { width: 135, align: 'left' });
    doc.text(euro(invoice.reducedVatTotal), sx + 135, y, { width: sw - 135, align: 'right' });
  }

  y += 24;

  // ─── Total box ──────────────────────────────────────────────────
  doc.rect(rightEdge - 180, y, 180, 45).fill(TABLE_HEADER);

  doc.font('Helvetica').fontSize(11).fillColor(GRAY);
  doc.text('Total Amount Due:', rightEdge - 170, y + 12, { align: 'left', width: 100 });

  doc.font('Helvetica-Bold').fontSize(18).fillColor(DARK);
  doc.text(euro(invoice.grossTotal), rightEdge - 170, y + 22, { align: 'right', width: 160 });

  y += 55;

  // ─── Margin Scheme note ─────────────────────────────────────────
  if (invoice.hasMarginItems) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(GRAY);
    doc.text(
      'Margin Scheme – Second-hand Goods',
      MARGIN, y, { align: 'left', width: USABLE_WIDTH }
    );
    y += 13;
    doc.text(
      'VAT is not separately disclosed under Irish VAT Margin Scheme legislation.',
      MARGIN, y, { align: 'left', width: USABLE_WIDTH }
    );
    y += 22;
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

  hr(doc, y);
  y += 16;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK);
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
