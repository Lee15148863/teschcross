# VAT INTEGRITY REPORT

Analysis of VAT calculation, storage, and reporting consistency across all layers.

---

## VAT CALCULATION IMPLEMENTATIONS

There are **3 independent VAT calculation implementations** in the codebase:

### 1. `utils/inv-vat-calculator.js` — Core calculator
```
Standard VAT: sellingPrice × rate / (1 + rate)
Margin VAT:   max(0, sellingPrice - costPrice) × rate / (1 + rate)
```
Used by: nothing directly (provides functions). The discount-calculator also uses its own version.

### 2. `utils/inv-discount-calculator.js` — Discount & VAT per cart item
Contains its own VAT calculation logic embedded in `calculateDiscountedCart()`.
Called by: `inv-checkout-service.js:140`

### 3. `services/inv-refund-service.js` — Refund VAT reversal
```
Standard: unitPrice × rate / (1 + rate) × qty (per-unit rounding)
Margin:   max(0, unitPrice - costPrice) × rate / (1 + rate) × qty
```
Contains inline VAT calculation, does NOT use `inv-vat-calculator.js`.

**FINDING V1**: Three implementations of the same VAT formulas. While the math is identical (`price * rate / (1 + rate)`), rounding strategies could differ:
- Discount calculator: rounds per-item
- Refund service: rounds per-unit-first, then multiplies by quantity
- VAT calculator: rounds final result

---

## VAT STORAGE & PROPAGATION

### Transaction model stores:
- Per-item: `vatRate`, `vatAmount`, `marginVat` (computed at checkout)
- Transaction-level: `standardVatTotal`, `marginVatTotal` (sum of per-item values)

### Invoice model stores:
- Per-item: `vatRate`, `vatAmount`, `vatType` ('standard' | 'reduced' | 'margin')
- Invoice-level: `standardVatTotal`, `reducedVatTotal`, `marginVatTotal`
- `subtotalExVat = grossTotal - totalVat` (computed at generation)

### DailyClose stores (via aggregateTransactions):
- `standard23Sales`, `standard23Vat` — from items with vatRate ≈ 0.23
- `reduced135Sales`, `reduced135Vat` — from items with vatRate ≈ 0.135
- `marginSales`, `marginVat` — from items with marginScheme
- `totalVat` — sum of all vat

### MonthlyReport aggregates DailyClose:
- Reads stored DailyClose values — no recalculation

---

## VAT RATE CATEGORIZATION

### Rate detection thresholds in codebase:

| File | Threshold check | Notes |
|---|---|---|
| `inv-query-service.js:137` | `Math.abs(vatRate - 0.23) < 0.01` | Determines standard 23% |
| `inv-query-service.js:139` | `Math.abs(vatRate - 0.135) < 0.01` | Determines reduced 13.5% |
| `inv-query-service.js:117` | Same thresholds for service filtering | |
| `inv-invoice-pdf.js:57` | `vatType === 'margin'` string match | |
| `api/inv/invoices.js:250` | `item.vatRate === 0.135` strict equality | ⚠️ Strict equality vs ≈ in query-service |

**FINDING V2**: `api/inv/invoices.js:250` uses strict equality `item.vatRate === 0.135` to categorize items as "reduced" VAT. `inv-query-service.js:139` uses approximate comparison `Math.abs(i.vatRate - 0.135) < 0.01`. If a transaction stores vatRate as `0.1350000001` (floating point artifact), the invoice would categorize it as `standard` (since it falls through to the else branch at line 253), while the DailyClose/MonthlyReport would correctly categorize it as `reduced`.

**Risk**: LOW — MongoDB stores numbers as IEEE 754 doubles. The value written as `0.135` in checkout is stored as exactly `0.135` in most cases. But arithmetic on this value before storage could produce floating-point artifacts.

---

## MARGIN VAT CONSISTENCY

### Calculation flow:
1. Checkout: `discount-calculator.js` computes `marginVat` per item using margin scheme formula
2. Stored in Transaction item as `marginVat`
3. Invoicing: `transaction.marginVatTotal` used directly
4. DailyClose: `item.marginVat` aggregated per item
5. PDF: Shows "Margin Scheme" with total only (no VAT breakdown per IE law)

✅ Consistent across all paths — margin VAT is stored and passed through, never recalculated.

---

## INVOICE VAT CALCULATION ISSUE

### `api/inv/invoices.js:273-274`
```javascript
const totalVat = standardVatSum + reducedVatSum + marginVatSum;
const subtotalExVat = Math.round((transaction.totalAmount - totalVat) * 100) / 100;
```

**FINDING V3**: `subtotalExVat` is computed as `grossTotal - totalVat`, but:
- `standardVatSum` and `reducedVatSum` are per-item sums (from line 251-253)
- `marginVatSum` uses `transaction.marginVatTotal` (line 241)
- This mixes two sources of VAT totals

If `item.vatAmount` values don't exactly sum to `transaction.standardVatTotal` (due to floating point), the `subtotalExVat` won't equal `grossTotal - verifiableVat`.

**Risk**: LOW — small rounding differences (< €0.01) possible.

---

## VAT Audit Summary

| # | Finding | Risk | Status |
|---|---|---|---|
| V1 | Three VAT calculation implementations exist | Low | Duplication, same formula |
| V2 | `invoices.js` uses strict equality for vatRate, query-service uses ≈ | Low | Could mis-categorize edge cases |
| V3 | `subtotalExVat` mixes per-item vatAmount with txn-level marginVatTotal | Low | Rounding diff risk |
| V4 | No VAT recalculation in DailyClose/MonthlyReport (reads stored values) | ✅ Good | |
| V5 | Invoice vatType is assigned from item flags, not recalculated | ✅ Good | |
| V6 | DailyClose validates VAT per-item breakdown from stored values | ✅ Good | |
