/**
 * inv-invoice-pdf.js — Production Invoice PDF Generator
 *
 * Generates A4 portrait PDF invoices using PDFKit.
 * Layout is designed for Ireland VAT compliance with Margin Scheme support.
 *
 * Usage:
 *   const generator = require('./services/inv-invoice-pdf');
 *   const pdfBuffer = await generator.generate(invoice);
 */

const PDFDocument = require('pdfkit');
const path = require('path');

// ─── Layout constants (A4: 595 x 842 pt, 72 DPI) ────────────────────────
const MARGIN = 50;
// A4 dimensions at 72 DPI
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const USABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN; // 495
const CENTER_X = PAGE_WIDTH / 2;

// Colors
const GREEN = '#1E7F5C';
const DARK = '#1D1D1F';
const GRAY = '#6E6E73';
const LIGHT_BG = '#F5F5F7';
const BORDER = '#D2D2D7';
const WHITE = '#FFFFFF';

// Font sizes
const FONT = {
  businessName: 22,
  invoiceNo: 19,
  sectionTitle: 15,
  subtitle: 13,
  body: 10,
  small: 9,
  footer: 8,
};

// Table columns (x positions)
const TBL = {
  start: MARGIN,
  itemStart: MARGIN,
  itemEnd: 275,
  qty: 295,
  price: 343,
  vat: 425,
  total: 488,
  end: 545,
};
const TBL_ROW_H = 20;
const TBL_HEADER_H = 22;
const TBL_PADDING = 4;

// ─── Logo path ──────────────────────────────────────────────────────────
const LOGO_PATH = path.join(__dirname, '..', 'logo.png');
const LOGO_MAX_W = 100;
const LOGO_MAX_H = 60;

// ─── Euro formatter ─────────────────────────────────────────────────────
function euro(n) {
  return '€' + (n || 0).toFixed(2);
}

// ─── Draw helpers ───────────────────────────────────────────────────────

/**
 * Draw a horizontal rule across the page.
 */
function hr(doc, y, color, width) {
  doc.lineWidth(width || 1);
  doc.strokeColor(color || GREEN);
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
  doc.lineWidth(1); // reset
}

/**
 * Draw a text label and value pair on the same line, right-aligned.
 */
function labeledValue(doc, label, value, x, y, opts) {
  opts = opts || {};
  const labelSize = opts.labelSize || FONT.body;
  const valueSize = opts.valueSize || FONT.body;
  doc.fontSize(labelSize).font('Helvetica').fillColor(GRAY);
  doc.text(label, x, y, { continued: true });
  doc.fontSize(valueSize).font(opts.valueBold ? 'Helvetica-Bold' : 'Helvetica').fillColor(DARK);
  doc.text(value, { align: 'right' });
}

/**
 * Draw centered text block at given y.
 */
function centerText(doc, text, y, size, font, color) {
  doc.fontSize(size || FONT.body);
  doc.font(font || 'Helvetica');
  doc.fillColor(color || DARK);
  doc.text(text, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  return doc.y;
}

/**
 * Draw a table row with column positions.
 */
function drawTblRow(doc, cols, y, opts) {
  opts = opts || {};
  const isHeader = opts.isHeader || false;
  const bgColor = opts.bgColor || null;

  if (bgColor) {
    doc.rect(TBL.start, y, USABLE_WIDTH, TBL_ROW_H).fill(bgColor);
  }

  const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';
  const size = isHeader ? FONT.small : FONT.body;
  const color = isHeader ? WHITE : DARK;

  doc.font(font).fontSize(size).fillColor(color);

  // Item name (left aligned, may wrap)
  doc.text(cols.item || '', TBL.itemStart + TBL_PADDING, y + TBL_PADDING, {
    width: TBL.itemEnd - TBL.itemStart - TBL_PADDING - 4,
    lineBreak: true,
  });

  // Qty (center)
  if (cols.qty !== undefined) {
    const qtyW = TBL.price - TBL.qty;
    doc.text(String(cols.qty), TBL.qty, y + TBL_PADDING, {
      width: qtyW, align: 'center',
    });
  }

  // Unit Price (right)
  if (cols.price !== undefined) {
    const priceW = TBL.vat - TBL.price;
    doc.text(cols.price, TBL.price, y + TBL_PADDING, {
      width: priceW, align: 'right',
    });
  }

  // VAT type (center)
  if (cols.vat !== undefined) {
    const vatW = TBL.total - TBL.vat;
    doc.text(cols.vat, TBL.vat, y + TBL_PADDING, {
      width: vatW, align: 'center',
    });
  }

  // Line Total (right)
  if (cols.total !== undefined) {
    const totalW = TBL.end - TBL.total;
    doc.text(cols.total, TBL.total, y + TBL_PADDING, {
      width: totalW, align: 'right',
    });
  }

  doc.fillColor(DARK); // reset
}

/**
 * Draw table header background and text.
 */
function drawTblHeader(doc, y) {
  // Header background
  doc.rect(TBL.start, y, USABLE_WIDTH, TBL_HEADER_H).fill(GREEN);

  doc.font('Helvetica-Bold').fontSize(FONT.small).fillColor(WHITE);
  doc.text('Item', TBL.itemStart + TBL_PADDING, y + TBL_PADDING + 1, { width: TBL.itemEnd - TBL.itemStart - TBL_PADDING });
  doc.text('Qty', TBL.qty, y + TBL_PADDING + 1, { width: TBL.price - TBL.qty, align: 'center' });
  doc.text('Unit Price', TBL.price, y + TBL_PADDING + 1, { width: TBL.vat - TBL.price, align: 'right' });
  doc.text('VAT', TBL.vat, y + TBL_PADDING + 1, { width: TBL.total - TBL.vat, align: 'center' });
  doc.text('Total', TBL.total, y + TBL_PADDING + 1, { width: TBL.end - TBL.total, align: 'right' });
  doc.fillColor(DARK);

  return y + TBL_HEADER_H;
}

/**
 * Check if we need a page break. If so, add footer on current page,
 * start a new page, draw continuation header and table header.
 */
function checkPageBreak(doc, needed, y, invoice, pageNum) {
  if (y + needed < PAGE_HEIGHT - 120) return { y: y, page: pageNum };

  // Footer on current page
  drawFooter(doc, invoice, true);

  // New page
  doc.addPage();
  y = MARGIN + 10;
  pageNum++;

  // Repeat header on continuation
  doc.font('Helvetica-Bold').fontSize(FONT.subtitle).fillColor(GREEN);
  doc.text('VAT INVOICE (continued)', MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 25;
  hr(doc, y, BORDER, 0.5);
  y += 10;

  doc.fontSize(FONT.small).fillColor(GRAY);
  doc.text('Invoice: ' + invoice.invoiceNumber + '  |  Page ' + pageNum, MARGIN, y);
  y += 20;

  y = drawTblHeader(doc, y);
  return { y: y, page: pageNum };
}

// ─── Main draw sections ─────────────────────────────────────────────────

function drawHeader(doc, invoice) {
  let y = MARGIN + 10;

  // Logo
  try {
    doc.image(LOGO_PATH, CENTER_X - LOGO_MAX_W / 2, y, {
      width: LOGO_MAX_W,
      height: LOGO_MAX_H,
    });
    y += LOGO_MAX_H + 12;
  } catch (e) {
    // Logo file missing — skip
    y = MARGIN + 10;
  }

  // Business name
  const bizName = (invoice.companyInfo && invoice.companyInfo.businessName) || 'TechCross Repair Centre';
  doc.font('Helvetica-Bold').fontSize(FONT.businessName).fillColor(DARK);
  doc.text(bizName, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 28;

  // VAT number
  const vatNum = (invoice.companyInfo && invoice.companyInfo.vatNumber) || '';
  if (vatNum) {
    doc.font('Helvetica').fontSize(FONT.body).fillColor(DARK);
    doc.text('VAT Number: ' + vatNum, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
    y += 16;
  }

  // Address
  const addr = (invoice.companyInfo && invoice.companyInfo.address) || '';
  if (addr) {
    doc.fontSize(FONT.small).fillColor(GRAY);
    doc.text(addr, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
    y += 14;
  }

  // Phone / Email
  const phone = (invoice.companyInfo && invoice.companyInfo.phone) || '';
  const email = (invoice.companyInfo && invoice.companyInfo.email) || '';
  if (phone || email) {
    doc.fontSize(FONT.small).fillColor(GRAY);
    const contactLine = [phone, email].filter(Boolean).join('  |  ');
    doc.text(contactLine, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
    y += 14;
  }

  y += 6;
  hr(doc, y, GREEN, 1.5);
  y += 16;

  return y;
}

function drawInvoiceTitle(doc, invoice, startY) {
  let y = startY;

  // "VAT INVOICE" label
  doc.font('Helvetica-Bold').fontSize(FONT.sectionTitle).fillColor(GREEN);
  doc.text('VAT INVOICE', MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 24;

  // Invoice number (dominant)
  doc.font('Helvetica-Bold').fontSize(FONT.invoiceNo).fillColor(DARK);
  doc.text(invoice.invoiceNumber, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
  y += 24;

  // Receipt number and date
  doc.font('Helvetica').fontSize(FONT.small).fillColor(GRAY);
  const dateStr = invoice.transactionDate
    ? new Date(invoice.transactionDate).toLocaleDateString('en-GB')
    : new Date(invoice.createdAt).toLocaleDateString('en-GB');
  doc.text('Receipt: ' + (invoice.receiptNumber || '—') + '    |    Date: ' + dateStr, MARGIN, y, {
    align: 'center', width: USABLE_WIDTH,
  });
  y += 18;

  hr(doc, y, GREEN, 1);
  y += 14;

  return y;
}

function drawCustomerSection(doc, invoice, startY) {
  let y = startY;

  // Left column — Customer
  doc.font('Helvetica-Bold').fontSize(FONT.body).fillColor(GREEN);
  doc.text('CUSTOMER', MARGIN, y);
  y += 16;

  doc.font('Helvetica').fontSize(FONT.body).fillColor(DARK);
  if (invoice.customerName) {
    doc.text('Name: ' + invoice.customerName, MARGIN, y);
    y += 15;
  }
  if (invoice.customerContact) {
    doc.text('Contact: ' + invoice.customerContact, MARGIN, y);
    y += 15;
  }
  if (!invoice.customerName && !invoice.customerContact) {
    doc.text('Walk-in Customer', MARGIN, y);
    y += 15;
  }

  // Right column — Payment & Cashier
  const rightX = 310;
  let ry = startY;

  doc.font('Helvetica-Bold').fontSize(FONT.body).fillColor(GREEN);
  doc.text('PAYMENT', rightX, ry);
  ry += 16;

  doc.font('Helvetica').fontSize(FONT.body).fillColor(DARK);
  const paymentLabels = { cash: 'Cash', card: 'Card', split: 'Split (Cash + Card)' };
  doc.text('Method: ' + (paymentLabels[invoice.paymentMethod] || invoice.paymentMethod), rightX, ry);
  ry += 15;

  if (invoice.operatorName) {
    doc.text('Cashier: ' + invoice.operatorName, rightX, ry);
    ry += 15;
  }

  y = Math.max(y, ry);
  y += 10;
  hr(doc, y, BORDER, 0.5);
  y += 14;

  return y;
}

function drawItemsTable(doc, invoice, startY) {
  let y = startY;

  // Section title
  doc.font('Helvetica-Bold').fontSize(FONT.body).fillColor(GREEN);
  doc.text('ITEMS', MARGIN, y);
  y += 18;

  // Table header
  y = drawTblHeader(doc, y);

  // Table rows
  const items = invoice.items || [];
  let rowIndex = 0;
  let pageNum = 1;

  for (const item of items) {
    const result = checkPageBreak(doc, TBL_ROW_H, y, invoice, pageNum);
    y = result.y;
    pageNum = result.page;

    const bgColor = rowIndex % 2 === 0 ? null : LIGHT_BG;

    const vatDisplay = item.vatType === 'margin'
      ? 'Margin'
      : item.vatType === 'reduced'
        ? '13.5%'
        : '23%';

    drawTblRow(doc, {
      item: item.name,
      qty: item.quantity,
      price: euro(item.unitPrice),
      vat: vatDisplay,
      total: euro(item.lineTotal),
    }, y, { bgColor });

    y += TBL_ROW_H;
    rowIndex++;
  }

  // Bottom border
  hr(doc, y, BORDER, 0.5);
  y += 10;

  return y;
}

function drawFinancialSummary(doc, invoice, startY) {
  let y = startY;

  doc.font('Helvetica-Bold').fontSize(FONT.body).fillColor(GREEN);
  doc.text('FINANCIAL SUMMARY', MARGIN, y);
  y += 18;

  // ─── Subtotal ────────────────────────────────────────
  const summaryX = 300;
  const labelX = summaryX;
  const valueX = 460;
  const colW = USABLE_WIDTH - (valueX - MARGIN);

  doc.font('Helvetica').fontSize(FONT.body).fillColor(DARK);
  doc.text('Subtotal (ex VAT):', labelX, y);
  doc.text(euro(invoice.subtotalExVat), valueX, y, { align: 'right', width: colW });
  y += 18;

  // ─── VAT Breakdown ───────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(FONT.small).fillColor(GRAY);
  doc.text('VAT Breakdown', labelX, y);
  y += 15;

  if ((invoice.standardVatTotal || 0) > 0) {
    doc.font('Helvetica').fontSize(FONT.body).fillColor(DARK);
    doc.text('Standard VAT (23%):', labelX, y);
    doc.text(euro(invoice.standardVatTotal), valueX, y, { align: 'right', width: colW });
    y += 17;
  }

  if ((invoice.reducedVatTotal || 0) > 0) {
    doc.font('Helvetica').fontSize(FONT.body).fillColor(DARK);
    doc.text('Reduced VAT (13.5%):', labelX, y);
    doc.text(euro(invoice.reducedVatTotal), valueX, y, { align: 'right', width: colW });
    y += 17;
  }

  // ─── Margin Scheme note ──────────────────────────────
  if (invoice.hasMarginItems) {
    doc.font('Helvetica-Oblique').fontSize(FONT.small).fillColor(GRAY);
    doc.text('Margin Scheme:', labelX, y);
    const marginNote = 'Included under margin scheme rules\n(not itemised)';
    doc.text(marginNote, valueX, y, { align: 'right', width: 120 });
    // Calculate actual height of wrapped text
    const noteH = doc.heightOfString(marginNote, { width: 120 });
    y += Math.max(noteH + 4, 18);

    // Additional margin scheme explanation below
    y += 2;
    doc.font('Helvetica-Oblique').fontSize(FONT.footer).fillColor(GRAY);
    doc.text('Margin scheme applied to used/second-hand goods.', valueX - 120, y, {
      width: USABLE_WIDTH - (valueX - MARGIN - 120), align: 'right',
    });
    y += 14;
  }

  // ─── Divider ─────────────────────────────────────────
  y += 4;
  hr(doc, y, DARK, 1.5);
  y += 8;

  // ─── TOTAL ───────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(FONT.subtitle).fillColor(DARK);
  doc.text('TOTAL:', labelX, y);
  doc.text(euro(invoice.grossTotal), valueX, y, { align: 'right', width: colW });
  y += 22;

  hr(doc, y, DARK, 1.5);
  y += 12;

  // ─── Payment Breakdown ───────────────────────────────
  doc.font('Helvetica-Bold').fontSize(FONT.small).fillColor(GRAY);
  doc.text('Payment Breakdown', MARGIN, y);
  y += 15;

  doc.font('Helvetica').fontSize(FONT.body).fillColor(DARK);
  const pmt = invoice.paymentMethod;
  if (pmt === 'cash') {
    doc.text('Cash: ' + euro(invoice.cashAmount || invoice.grossTotal), MARGIN, y);
    if (invoice.changeGiven > 0) {
      y += 16;
      doc.text('Change: ' + euro(invoice.changeGiven), MARGIN, y);
    }
  } else if (pmt === 'card') {
    doc.text('Card: ' + euro(invoice.cardAmount || invoice.grossTotal), MARGIN, y);
  } else if (pmt === 'split') {
    doc.text('Cash: ' + euro(invoice.cashAmount || 0), MARGIN, y);
    doc.text('Card: ' + euro(invoice.cardAmount || 0), valueX - 80, y, { align: 'right', width: 180 });
    y += 16;
    if (invoice.changeGiven > 0) {
      doc.text('Change: ' + euro(invoice.changeGiven), MARGIN, y);
    }
  }
  y += 20;

  return y;
}

function drawFooter(doc, invoice, isContinued) {
  const pageH = doc.page.height;
  let y = pageH - MARGIN - 140;

  // Only draw footer if there's room, otherwise skip
  if (y < doc.y + 10 && !isContinued) {
    // Content too close — add a new page if not already a continuation footer
    return;
  }

  // Adjust y if we're already past the footer position
  if (doc.y > y) {
    if (!isContinued) {
      doc.addPage();
      y = MARGIN + 10;
      // Repeat minimal header
      doc.font('Helvetica-Bold').fontSize(FONT.sectionTitle).fillColor(GREEN);
      doc.text('VAT INVOICE (continued)', MARGIN, y, { align: 'center', width: USABLE_WIDTH });
      y += 20;
    } else {
      return; // Already on a continuation page, footer will be drawn there
    }
  }

  hr(doc, y, GRAY, 0.5);
  y += 10;

  doc.font('Helvetica').fontSize(FONT.footer).fillColor(GRAY);

  const footerLines = [
    'This invoice is generated from a verified POS transaction system.',
  ];

  if (invoice.hasMarginItems) {
    footerLines.push(
      'Margin Scheme goods are subject to Irish VAT legislation under second-hand goods margin scheme.'
    );
  }

  footerLines.push('VAT Number: ' + ((invoice.companyInfo && invoice.companyInfo.vatNumber) || '—'));

  const ts = invoice.generatedAt || invoice.createdAt;
  const dateStr = new Date(ts).toISOString();
  footerLines.push('Generated: ' + dateStr);

  if (invoice.auditRef) {
    footerLines.push('Audit Reference: ' + invoice.auditRef);
  }

  for (const line of footerLines) {
    doc.text(line, MARGIN, y, { align: 'center', width: USABLE_WIDTH });
    y += 12;
  }
}

// ─── Main generate function ─────────────────────────────────────────────

/**
 * Generate a full A4 invoice PDF from invoice data.
 *
 * @param {Object} invoice - Fully populated invoice document (from DB or object)
 * @returns {Promise<Buffer>} PDF as buffer
 */
async function generate(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      info: {
        Title: 'VAT Invoice - ' + (invoice.invoiceNumber || ''),
        Author: 'TechCross Repair Centre',
        Subject: 'VAT Invoice',
        Keywords: 'invoice, vat, techcross',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ─── Build PDF page by page ────────────────────────
    try {
      let y = drawHeader(doc, invoice);
      y = drawInvoiceTitle(doc, invoice, y);
      y = drawCustomerSection(doc, invoice, y);
      y = drawItemsTable(doc, invoice, y);
      y = drawFinancialSummary(doc, invoice, y);
      drawFooter(doc, invoice, false);
    } catch (err) {
      reject(err);
      return;
    }

    doc.end();
  });
}

module.exports = { generate };
