# CASH RECONCILIATION REPORT

Analysis of cash handling across Transaction → CashLedger → DailyClose → MonthlyReport.

---

## DATA FLOW

```
Transaction.checkout()
  → CashLedger.create({ entryType: 'sale', direction: 'in', amount, paymentMethod, cashReceived, changeGiven, cardAmount })
  → DailyClose.closeDay() reads both collections and reconciles
  → MonthlyReport aggregates DailyClose snapshots
```

---

## CASH RECONCILIATION IN DAILYCLOSE

### Transaction side (`validateTransactionLedgerMatch` lines 42-52)
```javascript
if (txn.paymentMethod === 'cash') {
  cashFromTxns += txn.totalAmount;
} else if (txn.paymentMethod === 'split') {
  cashFromTxns += txn.totalAmount - (txn.cardAmount || 0);
}
```

### Ledger side (`validateTransactionLedgerMatch` lines 62-76)
```javascript
if (entry.paymentMethod === 'cash' || entry.paymentMethod === 'split') {
  cashPortion = (entry.cashReceived ?? entry.amount) - (entry.changeGiven || 0);
}
```

### Split payment divergence
The two formulas differ fundamentally:
- **Transaction side**: `totalAmount - cardAmount` (computes cash as residual)
- **Ledger side**: `cashReceived - changeGiven` (computes cash from actual cash drawer)

These are semantically different. Consider:
- Sale: totalAmount = €100, cardAmount = €40, cashReceived = €70, changeGiven = €10
- Transaction cash: €100 - €40 = **€60**
- Ledger cash: €70 - €10 = **€60** (match, correct)

But if cashReceived was mis-entered (€80 instead of €70):
- Transaction cash: €100 - €40 = **€60**
- Ledger cash: €80 - €10 = **€70** (mismatch — flagged as reconciliation error)

This is actually a GOOD thing — the two-sided formula catches data entry errors.

**Risk**: LOW — The dual-formula approach is a valid reconciliation technique.

---

## CASH TOTAL AGGREGATION

### `aggregateTransactions` (query-service.js lines 231-237)
```
Cash total     = all 'cash' txn totals + split cash portions
Card total     = all 'card' txn totals + split card portions
Split cash     = txn total - cardAmount
Split card     = cardAmount
```

### `closeDay` (daily-close-service.js lines 171-178)
```
cashTotal      = agg.payment.cash
cardTotal      = agg.payment.card
splitCardTotal = agg.payment.split.card
splitCashTotal = agg.payment.split.cash
```

✅ Consistent — DailyClose reads directly from aggregateTransactions output.

---

## REFUND CASH HANDLING

### Refund service (inv-refund-service.js lines 210-225)
- Cash refund: `cashReceived = totalRefund` (positive!), `changeGiven = 0`
- Card refund: `cardAmount = totalRefund` (positive!), `cashReceived = null`

### Ledger entry for refunds
- `entryType: 'refund'`
- `direction: 'out'`
- `amount: totalRefund` (positive amount, direction: out)

### DailyClose refund handling
- `validateTransactionLedgerMatch` lines 70-74: For refund entries (direction === 'out'), the ledger subtracts: `ledgerNet -= entry.amount` and `cashFromLedger -= entry.amount`

✅ Consistent — refunds correctly reduce cash totals.

---

## EXPENSE + CASH HANDLING

`closeDay` computes:
```
netCash = agg.payment.cash - expenseCash
```

This only subtracts CASH expenses from CASH sales. Card expenses are not deducted from netCash. ✅ Correct.

---

## NET CASH FORMULA

```
netCash = cashTotal + splitCashTotal - expenseCash
```

Where `cashTotal` already includes split cash portions from `aggregateTransactions`. Since split payments contribute to `splitCashTotal` AND `cashTotal` includes split cash... wait, let me check.

Looking at `aggregateTransactions` more carefully:
- `cashTotal += txn.totalAmount` for cash payments
- `splitCash += txn.totalAmount - cardAmount` for split payments

Then `agg.payment.cash = R(cashTotal + splitCash)` — so `cashTotal` already INCLUDES split cash.

And in `closeDay`, `cashTotal = agg.payment.cash` — so `cashTotal` is the combined cash from pure-cash + split-cash.

Then `netCash = R(agg.payment.cash - expenseCash)` — which is (cash-from-all-cash-txns + cash-from-split-txns) - cash expenses.

✅ Correct — no double-counting.

---

## MONTHLY REPORT CASH INTEGRATION

MonthlyReport aggregates from DailyClose snapshots (closed only). It reads directly from stored `cashTotal`, `cardTotal`, `netCash` fields. No recalculation.

✅ Clean.

---

## ISSUES FOUND

| # | Issue | Risk | Details |
|---|---|---|---|
| C1 | No audit trail for cash drawer discrepancies | Low | When reconciliation detects a cash mismatch, it's stored in `validation` but no AuditLog is created |
| C2 | `changeGiven` on card transactions is stored as null | Low | The schema defaults to null, but checkout sets it to null for card. No issue. |
| C3 | Split payment in DailyClose stored twice | Low | `cashTotal` includes split cash, and `splitCashTotal` also stores it. Both used for display — no double-counting in net cash. |

**Overall assessment**: Cash reconciliation logic is sound. The dual-formula approach for split payments provides a practical cross-check.
