const express = require('express');
const router = express.Router();
const Transaction = require('../../models/inv/Transaction');
const Expense = require('../../models/inv/Expense');
const { jwtAuth, requireRole } = require('../../middleware/inv-auth');

// All routes require Staff+ access
router.use(jwtAuth, requireRole('admin', 'staff'));

// ─── Helper: build date range filter (UTC-based) ─────────────────────────────
function buildDateFilter(startDate, endDate) {
  const filter = {};
  if (startDate) {
    // Parse as UTC date start
    filter.$gte = new Date(startDate + 'T00:00:00.000Z');
  }
  if (endDate) {
    // Parse as UTC date end
    filter.$lte = new Date(endDate + 'T23:59:59.999Z');
  }
  return Object.keys(filter).length > 0 ? filter : null;
}

// ─── Helper: parse YYYY-MM-DD as UTC midnight ───────────────────────────────
// Changed to UTC to match how MongoDB stores dates
function parseUTCDate(dateStr) {
  return new Date(dateStr + 'T00:00:00.000Z');
}

// ─── Helper: aggregate product ranking from transactions ────────────────────
function aggregateProductRanking(transactions) {
  const productMap = {};
  for (const txn of transactions) {
    for (const item of txn.items) {
      const key = item.name;
      if (!productMap[key]) {
        productMap[key] = { name: item.name, quantitySold: 0, totalAmount: 0 };
      }
      productMap[key].quantitySold += item.quantity;
      productMap[key].totalAmount += item.subtotal;
    }
  }
  // Round amounts and sort by quantity descending
  const ranking = Object.values(productMap).map(p => ({
    name: p.name,
    quantitySold: p.quantitySold,
    totalAmount: Math.round(p.totalAmount * 100) / 100
  }));
  ranking.sort((a, b) => b.quantitySold - a.quantitySold);
  return ranking;
}

// ─── GET /api/inv/reports/daily ─────────────────────────────────────────────
// Daily report (English output) — broken down by VAT category
router.get('/daily', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;

    let dateStart, dateEnd;
    if (startDate && endDate) {
      // Use UTC-based date parsing
      dateStart = parseUTCDate(startDate);
      dateEnd = new Date(endDate + 'T23:59:59.999Z');
    } else {
      // Get today's date in UTC
      const todayUTC = date || new Date().toISOString().split('T')[0];
      dateStart = parseUTCDate(todayUTC);
      dateEnd = new Date(todayUTC + 'T23:59:59.999Z');
    }

    if (isNaN(dateStart.getTime()) || isNaN(dateEnd.getTime())) {
      return res.status(400).json({ error: 'Invalid date format', code: 'VALIDATION_ERROR' });
    }

    const transactions = await Transaction.find({
      createdAt: { $gte: dateStart, $lte: dateEnd }
    }).sort({ createdAt: -1 });

    if (transactions.length === 0) {
      return res.json({ message: 'No transactions for this date', data: null });
    }

    // Round helper — must be defined before the loop that uses it
    const r = v => Math.round(v * 100) / 100;

    // Aggregate by VAT category
    let totalSales = 0, cashTotal = 0, cardTotal = 0, splitCardTotal = 0, splitCashTotal = 0;
    let stdRate23Sales = 0, stdRate23Vat = 0;
    let marginSales = 0, marginVat = 0;
    let reducedRate135Sales = 0, reducedRate135Vat = 0;
    let lycaSales = 0, lycaProfit = 0, lycaVat = 0, lycaCount = 0;
    const marginItems = [];
    const lycaItems = [];

    for (const txn of transactions) {
      totalSales += txn.totalAmount;
      if (txn.paymentMethod === 'cash') cashTotal += txn.totalAmount;
      else if (txn.paymentMethod === 'card') cardTotal += txn.totalAmount;
      else if (txn.paymentMethod === 'split') {
        splitCardTotal += txn.cardAmount || 0;
        splitCashTotal += (txn.totalAmount - (txn.cardAmount || 0));
      }

      for (const item of txn.items) {
        const rate = item.vatRate || 0.23;
        const isLyca = (item.sku || '').toUpperCase().startsWith('LYCA-') || (item.name || '').toLowerCase().startsWith('lyca');

        if (isLyca) {
          // Lyca Credit: separate section
          const qty = item.quantity || 1;
          lycaSales += item.subtotal;
          lycaProfit += (item.marginVat > 0 ? ((item.discountedPrice || item.unitPrice || 0) - (item.costPrice || 0)) * qty : 0);
          lycaVat += item.marginVat || 0;
          lycaCount += qty;
          lycaItems.push({
            receiptNumber: txn.receiptNumber,
            name: item.name, sku: item.sku || '',
            faceValue: item.unitPrice || 0,
            costPrice: item.costPrice || 0,
            profit: r((item.unitPrice || 0) - (item.costPrice || 0)),
            vatPayable: r((item.marginVat || 0) / (item.quantity || 1)),
            quantity: qty,
            totalVat: item.marginVat || 0
          });
        } else if (item.marginScheme || item.isSecondHand) {
          marginSales += item.subtotal;
          marginVat += item.marginVat || 0;
          const isPurchasedFromCustomer = item.purchasedFromCustomer || item.source === 'customer';
          marginItems.push({
            receiptNumber: txn.receiptNumber,
            name: item.name, sku: item.sku || '',
            source: item.source || '',
            costPrice: item.costPrice || 0,
            sellingPrice: item.unitPrice || 0,
            discountedPrice: item.discountedPrice || item.unitPrice || 0,
            margin: r((item.discountedPrice || item.unitPrice || 0) - (item.costPrice || 0)),
            vatPayable: item.marginVat || 0,
            quantity: item.quantity || 1,
            purchasedFromCustomer: isPurchasedFromCustomer
          });
        } else if (Math.abs(rate - 0.135) < 0.01) {
          reducedRate135Sales += item.subtotal;
          reducedRate135Vat += item.vatAmount || 0;
        } else {
          stdRate23Sales += item.subtotal;
          stdRate23Vat += item.vatAmount || 0;
        }
      }
    }

    // Query actual expenses from Expense table
    const expenses = await Expense.find({ date: { $gte: dateStart, $lte: dateEnd } });
    let expenseCashTotal = 0, expenseCardTotal = 0;
    const expenseByCategory = {};
    for (const e of expenses) {
      if (e.paymentMethod === 'cash') expenseCashTotal += e.amount;
      else expenseCardTotal += e.amount;
      if (!expenseByCategory[e.category]) expenseByCategory[e.category] = 0;
      expenseByCategory[e.category] += e.amount;
    }

    const dailyNetCash = r((cashTotal + splitCashTotal) - expenseCashTotal);

    res.json({
      data: {
        date: startDate && endDate ? { startDate, endDate } : (date || new Date().toISOString().split('T')[0]),
        totalTransactions: transactions.length,
        totalSales: r(totalSales),
        payment: {
          cash: r(cashTotal + splitCashTotal),
          card: r(cardTotal + splitCardTotal)
        },
        vatBreakdown: {
          standard23: { sales: r(stdRate23Sales), vatPayable: r(stdRate23Vat) },
          margin: { sales: r(marginSales), vatPayable: r(marginVat), items: marginItems },
          reduced135: { sales: r(reducedRate135Sales), vatPayable: r(reducedRate135Vat) },
          lycaCredit: { sales: r(lycaSales), profit: r(lycaProfit), vatPayable: r(lycaVat), count: lycaCount, items: lycaItems }
        },
        totalVatPayable: r(stdRate23Vat + marginVat + reducedRate135Vat + lycaVat),
        expenses: {
          total: r(expenseCashTotal + expenseCardTotal),
          cash: r(expenseCashTotal),
          card: r(expenseCardTotal),
          byCategory: Object.fromEntries(Object.entries(expenseByCategory).map(([k, v]) => [k, r(v)])),
          count: expenses.length
        },
        netCash: dailyNetCash,
        cashWarning: dailyNetCash < 0 ? 'Bank withdrawal needed' : null
      }
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/reports/monthly ───────────────────────────────────────────
// Monthly tax summary (English output) — daily totals with VAT breakdown
router.get('/monthly', async (req, res) => {
  try {
    const { month } = req.query;

    let year, mon;
    if (month) {
      const parts = month.split('-');
      year = parseInt(parts[0]);
      mon = parseInt(parts[1]);
      if (isNaN(year) || isNaN(mon) || mon < 1 || mon > 12) {
        return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM', code: 'VALIDATION_ERROR' });
      }
    } else {
      const now = new Date();
      year = now.getUTCFullYear();
      mon = now.getUTCMonth() + 1;
    }

    // Use UTC dates for consistency with stored transaction dates
    const startDate = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));

    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    const dailyMap = {};
    let monthCash = 0, monthCard = 0;
    let monthStd23Vat = 0, monthMarginVat = 0, monthReduced135Vat = 0;
    let monthLycaVat = 0;

    for (const txn of transactions) {
      const dayKey = txn.createdAt.toISOString().split('T')[0];

      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = {
          date: dayKey, totalSales: 0, cash: 0, card: 0,
          std23Sales: 0, std23Vat: 0,
          marginSales: 0, marginVat: 0, marginItems: [],
          reduced135Sales: 0, reduced135Vat: 0,
          lycaSales: 0, lycaProfit: 0, lycaVat: 0, lycaCount: 0, lycaItems: []
        };
      }
      const d = dailyMap[dayKey];
      d.totalSales += txn.totalAmount;

      if (txn.paymentMethod === 'cash') { d.cash += txn.totalAmount; monthCash += txn.totalAmount; }
      else if (txn.paymentMethod === 'card') { d.card += txn.totalAmount; monthCard += txn.totalAmount; }
      else if (txn.paymentMethod === 'split') {
        const cardPart = txn.cardAmount || 0;
        const cashPart = txn.totalAmount - cardPart;
        d.card += cardPart; d.cash += cashPart;
        monthCard += cardPart; monthCash += cashPart;
      }

      for (const item of txn.items) {
        const rate = item.vatRate || 0.23;
        const isLyca = (item.sku || '').toUpperCase().startsWith('LYCA-') || (item.name || '').toLowerCase().startsWith('lyca');

        if (isLyca) {
          const qty = item.quantity || 1;
          d.lycaSales += item.subtotal;
          d.lycaProfit += ((item.discountedPrice || item.unitPrice || 0) - (item.costPrice || 0)) * qty;
          d.lycaVat += item.marginVat || 0;
          d.lycaCount += qty;
          d.lycaItems.push({
            receiptNumber: txn.receiptNumber, name: item.name, sku: item.sku || '',
            faceValue: item.unitPrice || 0, costPrice: item.costPrice || 0,
            profit: r((item.unitPrice || 0) - (item.costPrice || 0)),
            quantity: qty, totalVat: item.marginVat || 0
          });
          monthLycaVat += item.marginVat || 0;
        } else if (item.marginScheme || item.isSecondHand) {
          d.marginSales += item.subtotal;
          d.marginVat += item.marginVat || 0;
          const isPFC = item.purchasedFromCustomer || item.source === 'customer';
          d.marginItems.push({
            receiptNumber: txn.receiptNumber, name: item.name, sku: item.sku || '',
            source: item.source || '', costPrice: item.costPrice || 0,
            sellingPrice: item.unitPrice || 0,
            discountedPrice: item.discountedPrice || item.unitPrice || 0,
            margin: r((item.discountedPrice || item.unitPrice || 0) - (item.costPrice || 0)),
            vatPayable: item.marginVat || 0, quantity: item.quantity || 1,
            purchasedFromCustomer: isPFC
          });
          monthMarginVat += item.marginVat || 0;
        } else if (Math.abs(rate - 0.135) < 0.01) {
          d.reduced135Sales += item.subtotal;
          d.reduced135Vat += item.vatAmount || 0;
          monthReduced135Vat += item.vatAmount || 0;
        } else {
          d.std23Sales += item.subtotal;
          d.std23Vat += item.vatAmount || 0;
          monthStd23Vat += item.vatAmount || 0;
        }
      }
    }

    const r = v => Math.round(v * 100) / 100;

    // Query actual expenses
    const expenses = await Expense.find({ date: { $gte: startDate, $lte: endDate } });
    let monthExpCash = 0, monthExpCard = 0;
    const expByCategory = {};
    const expByDate = {};
    for (const e of expenses) {
      if (e.paymentMethod === 'cash') monthExpCash += e.amount;
      else monthExpCard += e.amount;
      if (!expByCategory[e.category]) expByCategory[e.category] = 0;
      expByCategory[e.category] += e.amount;
      const dk = e.date.toISOString().split('T')[0];
      if (!expByDate[dk]) expByDate[dk] = 0;
      expByDate[dk] += e.amount;
    }

    const netCash = r(monthCash - monthExpCash);

    const dailyData = Object.values(dailyMap).map(d => {
      const dayExpense = expByDate[d.date] || 0;
      const dayCashNet = r(d.cash - dayExpense);
      return {
        date: d.date,
        totalSales: r(d.totalSales), cash: r(d.cash), card: r(d.card),
        standard23: { sales: r(d.std23Sales), vatPayable: r(d.std23Vat) },
        margin: { sales: r(d.marginSales), vatPayable: r(d.marginVat), items: d.marginItems },
        reduced135: { sales: r(d.reduced135Sales), vatPayable: r(d.reduced135Vat) },
        lycaCredit: { sales: r(d.lycaSales), profit: r(d.lycaProfit), vatPayable: r(d.lycaVat), count: d.lycaCount, items: d.lycaItems },
        dailyVatPayable: r(d.std23Vat + d.marginVat + d.reduced135Vat + d.lycaVat),
        expenses: r(dayExpense),
        netCash: dayCashNet,
        cashWarning: dayCashNet < 0 ? 'Bank withdrawal needed' : null
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      data: {
        month: `${year}-${String(mon).padStart(2, '0')}`,
        dailyData,
        summary: {
          totalCash: r(monthCash),
          totalCard: r(monthCard),
          totalSales: r(monthCash + monthCard),
          standard23VatTotal: r(monthStd23Vat),
          marginVatTotal: r(monthMarginVat),
          reduced135VatTotal: r(monthReduced135Vat),
          lycaCreditVatTotal: r(monthLycaVat),
          totalVatPayable: r(monthStd23Vat + monthMarginVat + monthReduced135Vat + monthLycaVat),
          expenses: { total: r(monthExpCash + monthExpCard), cash: r(monthExpCash), card: r(monthExpCard), byCategory: Object.fromEntries(Object.entries(expByCategory).map(([k, v]) => [k, r(v)])) },
          netCash: netCash,
          cashWarning: netCash < 0 ? 'Bank withdrawal needed' : null
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/reports/weekly ────────────────────────────────────────────
// Weekly report (English output) — same VAT breakdown as daily/monthly
// Query: ?week=2026-W18 or ?startDate=2026-04-28 (Monday of the week)
router.get('/weekly', async (req, res) => {
  try {
    const { week, startDate: qStart } = req.query;
    let weekStart, weekEnd;

    if (week) {
      // Parse ISO week: YYYY-Www
      const match = week.match(/^(\d{4})-W(\d{1,2})$/);
      if (!match) return res.status(400).json({ error: 'Invalid week format. Use YYYY-Www (e.g. 2026-W18)', code: 'VALIDATION_ERROR' });
      const y = parseInt(match[1]), w = parseInt(match[2]);
      // ISO week 1 = week containing Jan 4
      const jan4 = new Date(y, 0, 4);
      const dayOfWeek = jan4.getDay() || 7; // Mon=1..Sun=7
      weekStart = new Date(jan4);
      weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (w - 1) * 7);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
    } else if (qStart) {
      // Use UTC-based date parsing
      weekStart = parseUTCDate(qStart);
      weekEnd = new Date(qStart + 'T23:59:59.999Z');
      weekEnd.setDate(weekStart.getDate() + 6);
    } else {
      // Default: current week (Monday to Sunday) in UTC
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const today = new Date(todayStr + 'T00:00:00.000Z');
      const day = today.getUTCDay() || 7;
      weekStart = new Date(today);
      weekStart.setUTCDate(today.getUTCDate() - day + 1);
      weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
      weekEnd.setUTCHours(23, 59, 59, 999);
    }

    if (isNaN(weekStart.getTime()) || isNaN(weekEnd.getTime())) {
      return res.status(400).json({ error: 'Invalid date', code: 'VALIDATION_ERROR' });
    }

    const transactions = await Transaction.find({
      createdAt: { $gte: weekStart, $lte: weekEnd }
    }).sort({ createdAt: 1 });

    const r = v => Math.round(v * 100) / 100;

    const dailyMap = {};
    let weekCash = 0, weekCard = 0;
    let weekStd23Vat = 0, weekMarginVat = 0, weekReduced135Vat = 0;
    let weekLycaVat = 0;

    for (const txn of transactions) {
      const dayKey = txn.createdAt.toISOString().split('T')[0];
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = {
          date: dayKey, totalSales: 0, cash: 0, card: 0,
          std23Sales: 0, std23Vat: 0,
          marginSales: 0, marginVat: 0, marginItems: [],
          reduced135Sales: 0, reduced135Vat: 0,
          lycaSales: 0, lycaProfit: 0, lycaVat: 0, lycaCount: 0, lycaItems: []
        };
      }
      const d = dailyMap[dayKey];
      d.totalSales += txn.totalAmount;

      if (txn.paymentMethod === 'cash') { d.cash += txn.totalAmount; weekCash += txn.totalAmount; }
      else if (txn.paymentMethod === 'card') { d.card += txn.totalAmount; weekCard += txn.totalAmount; }
      else if (txn.paymentMethod === 'split') {
        const cardPart = txn.cardAmount || 0;
        const cashPart = txn.totalAmount - cardPart;
        d.card += cardPart; d.cash += cashPart;
        weekCard += cardPart; weekCash += cashPart;
      }

      for (const item of txn.items) {
        const rate = item.vatRate || 0.23;
        const isLyca = (item.sku || '').toUpperCase().startsWith('LYCA-') || (item.name || '').toLowerCase().startsWith('lyca');

        if (isLyca) {
          const qty = item.quantity || 1;
          d.lycaSales += item.subtotal;
          d.lycaProfit += ((item.discountedPrice || item.unitPrice || 0) - (item.costPrice || 0)) * qty;
          d.lycaVat += item.marginVat || 0;
          d.lycaCount += qty;
          d.lycaItems.push({
            receiptNumber: txn.receiptNumber, name: item.name, sku: item.sku || '',
            faceValue: item.unitPrice || 0, costPrice: item.costPrice || 0,
            profit: r((item.unitPrice || 0) - (item.costPrice || 0)),
            quantity: qty, totalVat: item.marginVat || 0
          });
          weekLycaVat += item.marginVat || 0;
        } else if (item.marginScheme || item.isSecondHand) {
          d.marginSales += item.subtotal;
          d.marginVat += item.marginVat || 0;
          const isPFC = item.purchasedFromCustomer || item.source === 'customer';
          d.marginItems.push({
            receiptNumber: txn.receiptNumber, name: item.name, sku: item.sku || '',
            source: item.source || '', costPrice: item.costPrice || 0,
            sellingPrice: item.unitPrice || 0,
            discountedPrice: item.discountedPrice || item.unitPrice || 0,
            margin: r((item.discountedPrice || item.unitPrice || 0) - (item.costPrice || 0)),
            vatPayable: item.marginVat || 0, quantity: item.quantity || 1,
            purchasedFromCustomer: isPFC
          });
          weekMarginVat += item.marginVat || 0;
        } else if (Math.abs(rate - 0.135) < 0.01) {
          d.reduced135Sales += item.subtotal;
          d.reduced135Vat += item.vatAmount || 0;
          weekReduced135Vat += item.vatAmount || 0;
        } else {
          d.std23Sales += item.subtotal;
          d.std23Vat += item.vatAmount || 0;
          weekStd23Vat += item.vatAmount || 0;
        }
      }
    }

    // Query actual expenses
    const expenses = await Expense.find({ date: { $gte: weekStart, $lte: weekEnd } });
    let weekExpCash = 0, weekExpCard = 0;
    const expByCategory = {};
    const expByDate = {};
    for (const e of expenses) {
      if (e.paymentMethod === 'cash') weekExpCash += e.amount;
      else weekExpCard += e.amount;
      if (!expByCategory[e.category]) expByCategory[e.category] = 0;
      expByCategory[e.category] += e.amount;
      const dk = e.date.toISOString().split('T')[0];
      if (!expByDate[dk]) expByDate[dk] = 0;
      expByDate[dk] += e.amount;
    }

    const netCash = r(weekCash - weekExpCash);

    const dailyData = Object.values(dailyMap).map(d => {
      const dayExpense = expByDate[d.date] || 0;
      const dayCashNet = r(d.cash - dayExpense);
      return {
        date: d.date,
        totalSales: r(d.totalSales), cash: r(d.cash), card: r(d.card),
        standard23: { sales: r(d.std23Sales), vatPayable: r(d.std23Vat) },
        margin: { sales: r(d.marginSales), vatPayable: r(d.marginVat), items: d.marginItems },
        reduced135: { sales: r(d.reduced135Sales), vatPayable: r(d.reduced135Vat) },
        lycaCredit: { sales: r(d.lycaSales), profit: r(d.lycaProfit), vatPayable: r(d.lycaVat), count: d.lycaCount, items: d.lycaItems },
        dailyVatPayable: r(d.std23Vat + d.marginVat + d.reduced135Vat + d.lycaVat),
        expenses: r(dayExpense),
        netCash: dayCashNet,
        cashWarning: dayCashNet < 0 ? 'Bank withdrawal needed' : null
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      data: {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        dailyData,
        summary: {
          totalCash: r(weekCash),
          totalCard: r(weekCard),
          totalSales: r(weekCash + weekCard),
          standard23VatTotal: r(weekStd23Vat),
          marginVatTotal: r(weekMarginVat),
          reduced135VatTotal: r(weekReduced135Vat),
          lycaCreditVatTotal: r(weekLycaVat),
          totalVatPayable: r(weekStd23Vat + weekMarginVat + weekReduced135Vat + weekLycaVat),
          expenses: { total: r(weekExpCash + weekExpCard), cash: r(weekExpCash), card: r(weekExpCard), byCategory: Object.fromEntries(Object.entries(expByCategory).map(([k, v]) => [k, r(v)])) },
          netCash: netCash,
          cashWarning: netCash < 0 ? 'Bank withdrawal needed' : null
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/reports/product-ranking ───────────────────────────────────
// Product sales ranking
router.get('/product-ranking', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const start = parseUTCDate(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format', code: 'VALIDATION_ERROR' });
    }

    const transactions = await Transaction.find({
      createdAt: { $gte: start, $lte: end }
    });

    const ranking = aggregateProductRanking(transactions);

    res.json({ data: ranking });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/reports/export ────────────────────────────────────────────
// Export report (print-friendly format)
router.get('/export', async (req, res) => {
  try {
    const { type, date, month, startDate, endDate } = req.query;

    if (!type || !['daily', 'monthly'].includes(type)) {
      return res.status(400).json({
        error: 'type parameter is required and must be "daily" or "monthly"',
        code: 'VALIDATION_ERROR'
      });
    }

    if (type === 'daily') {
      let dateStart, dateEnd;

      if (startDate && endDate) {
        dateStart = parseUTCDate(startDate);
        dateEnd = new Date(endDate + 'T23:59:59.999Z');
      } else if (date) {
        dateStart = parseUTCDate(date);
        dateEnd = new Date(date + 'T23:59:59.999Z');
      } else {
        const today = new Date().toISOString().split('T')[0];
        dateStart = parseUTCDate(today);
        dateEnd = new Date(today + 'T23:59:59.999Z');
      }

      if (isNaN(dateStart.getTime()) || isNaN(dateEnd.getTime())) {
        return res.status(400).json({ error: 'Invalid date format', code: 'VALIDATION_ERROR' });
      }

      const transactions = await Transaction.find({
        createdAt: { $gte: dateStart, $lte: dateEnd }
      }).sort({ createdAt: -1 });

      if (transactions.length === 0) {
        return res.json({
          type: 'daily',
          printFriendly: true,
          message: 'No transactions for this date',
          data: null
        });
      }

      let totalSales = 0;
      let cashTotal = 0;
      let cardTotal = 0;
      let standardVatTotal = 0;
      let marginVatTotal = 0;

      for (const txn of transactions) {
        totalSales += txn.totalAmount;
        if (txn.paymentMethod === 'cash') {
          cashTotal += txn.totalAmount;
        } else {
          cardTotal += txn.totalAmount;
        }
        standardVatTotal += txn.standardVatTotal || 0;
        marginVatTotal += txn.marginVatTotal || 0;
      }

      const productRanking = aggregateProductRanking(transactions);

      return res.json({
        type: 'daily',
        printFriendly: true,
        data: {
          date: startDate && endDate
            ? { startDate, endDate }
            : (date || new Date().toISOString().split('T')[0]),
          totalTransactions: transactions.length,
          totalSales: Math.round(totalSales * 100) / 100,
          cashTotal: Math.round(cashTotal * 100) / 100,
          cardTotal: Math.round(cardTotal * 100) / 100,
          standardVatTotal: Math.round(standardVatTotal * 100) / 100,
          marginVatTotal: Math.round(marginVatTotal * 100) / 100,
          productRanking
        }
      });
    }

    if (type === 'monthly') {
      let year, mon;
      if (month) {
        const parts = month.split('-');
        year = parseInt(parts[0]);
        mon = parseInt(parts[1]);
        if (isNaN(year) || isNaN(mon) || mon < 1 || mon > 12) {
          return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM', code: 'VALIDATION_ERROR' });
        }
      } else {
        const now = new Date();
        year = now.getFullYear();
        mon = now.getMonth() + 1;
      }

      const monthStart = new Date(year, mon - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(year, mon, 0, 23, 59, 59, 999);

      const transactions = await Transaction.find({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      }).sort({ createdAt: 1 });

      const dailyMap = {};
      let monthCashTotal = 0;
      let monthCardTotal = 0;
      let monthStandardVatTotal = 0;
      let monthMarginVatTotal = 0;

      for (const txn of transactions) {
        const dayKey = txn.createdAt.toISOString().split('T')[0];

        if (!dailyMap[dayKey]) {
          dailyMap[dayKey] = {
            date: dayKey,
            dailySaleTotal: 0,
            repairIncome: 0,
            marginVatDailyTotal: 0
          };
        }

        dailyMap[dayKey].dailySaleTotal += txn.totalAmount;
        dailyMap[dayKey].marginVatDailyTotal += txn.marginVatTotal || 0;

        for (const item of txn.items) {
          if (item.name && item.name.toLowerCase().includes('repair')) {
            dailyMap[dayKey].repairIncome += item.subtotal;
          }
        }

        if (txn.paymentMethod === 'cash') {
          monthCashTotal += txn.totalAmount;
        } else {
          monthCardTotal += txn.totalAmount;
        }
        monthStandardVatTotal += txn.standardVatTotal || 0;
        monthMarginVatTotal += txn.marginVatTotal || 0;
      }

      const dailyData = Object.values(dailyMap).map(d => ({
        date: d.date,
        dailySaleTotal: Math.round(d.dailySaleTotal * 100) / 100,
        repairIncome: Math.round(d.repairIncome * 100) / 100,
        marginVatDailyTotal: Math.round(d.marginVatDailyTotal * 100) / 100
      }));

      dailyData.sort((a, b) => a.date.localeCompare(b.date));

      const totalTaxPayable = Math.round((monthStandardVatTotal + monthMarginVatTotal) * 100) / 100;

      return res.json({
        type: 'monthly',
        printFriendly: true,
        data: {
          month: `${year}-${String(mon).padStart(2, '0')}`,
          dailyData,
          summary: {
            totalCash: Math.round(monthCashTotal * 100) / 100,
            totalCard: Math.round(monthCardTotal * 100) / 100,
            standardVatTotal: Math.round(monthStandardVatTotal * 100) / 100,
            marginVatTotal: Math.round(monthMarginVatTotal * 100) / 100,
            totalTaxPayable
          }
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
