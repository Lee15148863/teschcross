const express = require('express');
const router = express.Router();
const Transaction = require('../../models/inv/Transaction');
const { jwtAuth, requireRole } = require('../../middleware/inv-auth');

// All routes require Staff+ access
router.use(jwtAuth, requireRole('admin', 'staff'));

// ─── Helper: build date range filter ────────────────────────────────────────
function buildDateFilter(startDate, endDate) {
  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.$lte = end;
  }
  return Object.keys(filter).length > 0 ? filter : null;
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
// Daily report (English output)
router.get('/daily', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;

    let dateStart, dateEnd;

    if (startDate && endDate) {
      // Date range mode
      dateStart = new Date(startDate);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else {
      // Single date mode (defaults to today)
      const targetDate = date ? new Date(date) : new Date();
      dateStart = new Date(targetDate);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(targetDate);
      dateEnd.setHours(23, 59, 59, 999);
    }

    // Validate dates
    if (isNaN(dateStart.getTime()) || isNaN(dateEnd.getTime())) {
      return res.status(400).json({ error: 'Invalid date format', code: 'VALIDATION_ERROR' });
    }

    const transactions = await Transaction.find({
      createdAt: { $gte: dateStart, $lte: dateEnd }
    }).sort({ createdAt: -1 });

    if (transactions.length === 0) {
      return res.json({ message: 'No transactions for this date', data: null });
    }

    // Aggregate totals
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

    // Product sales ranking
    const productRanking = aggregateProductRanking(transactions);

    res.json({
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
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/reports/monthly ───────────────────────────────────────────
// Monthly tax summary (English output)
router.get('/monthly', async (req, res) => {
  try {
    const { month } = req.query;

    // Parse month (defaults to current month)
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

    const startDate = new Date(year, mon - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, mon, 0, 23, 59, 59, 999); // last day of month

    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    // Build daily aggregates
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

      // Repair income: items categorized as repair (if applicable)
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

    // Round daily values
    const dailyData = Object.values(dailyMap).map(d => ({
      date: d.date,
      dailySaleTotal: Math.round(d.dailySaleTotal * 100) / 100,
      repairIncome: Math.round(d.repairIncome * 100) / 100,
      marginVatDailyTotal: Math.round(d.marginVatDailyTotal * 100) / 100
    }));

    // Sort by date ascending
    dailyData.sort((a, b) => a.date.localeCompare(b.date));

    const totalTaxPayable = Math.round((monthStandardVatTotal + monthMarginVatTotal) * 100) / 100;

    res.json({
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

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

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
        dateStart = new Date(startDate);
        dateEnd = new Date(endDate);
        dateEnd.setHours(23, 59, 59, 999);
      } else if (date) {
        dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);
      } else {
        dateStart = new Date();
        dateStart.setHours(0, 0, 0, 0);
        dateEnd = new Date();
        dateEnd.setHours(23, 59, 59, 999);
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
