# INVOICE CONSISTENCY REPORT

Analysis of invoice generation, data integrity, PDF output, and delivery.

---

## INVOICE DATA ORIGIN

Invoice data comes from Transaction snapshot at generation time. The flow:

```
Transaction.items[] → Invoice.items[]
  - item.subtotal       → lineTotal
  - item.discountedPrice → unitPrice (or item.unitPrice if no discount)
  - item.vatAmount      → vatAmount (0 for margin)
  - item.marginScheme   → vatType = 'margin'
  - item.vatRate === 0.135 → vatType = 'reduced'
  - else                → vatType = 'standard'
```

---

## ISSUE 1: LINE TOTAL WITH ORDER DISCOUNT

**Location**: `api/inv/invoices.js:263`

```javascript
lineTotal: item.subtotal
```

`item.subtotal` = `unitPrice × quantity` BEFORE any order-level discount.

When an order discount is applied:
- Each item's `discountedPrice` reflects the per-unit reduction
- But `lineTotal` uses `subtotal` (pre-discount)
- `grossTotal` = `transaction.totalAmount` (POST-discount)
- **Sum of line items ≠ grossTotal**

**Example**: 
- Item: €100 Qty 1, subtotal = €100
- Order discount: -€10
- `transaction.totalAmount` = €90
- Invoice shows: lineTotal = €100, grossTotal = €90

**Impact**: Customer sees line items totaling €100 but total payable is €90. While the customer is charged correctly, this discrepancy could be confusing and might be questioned during a VAT audit.

**Severity**: MODERATE

**Fix**: Apply order discount proportionally across line items, or add a separate "Discount" line item.

---

## ISSUE 2: PDF VAT RECALCULATION

**Location**: `services/inv-invoice-pdf.js:64-70`

```javascript
function sectionCalc(items, rate) {
  var total = items.reduce(...);
  var net = Math.round(total / (1 + rate) * 100) / 100;
  var vat = Math.round((total - net) * 100) / 100;
  return { total, net, vat };
}
```

This function **recalculates** net and VAT amounts from the sum of line totals. While the invoice data has pre-computed `vatAmount` values per item, the PDF display uses its own re-derived values.

**Impact**: If rounding differs between the original calculation and this re-derivation, the PDF could show slightly different VAT amounts than what's stored in the invoice record. Display-only issue (PDF), not stored in DB.

**Severity**: LOW — same formula, same inputs, same result in practice.

---

## ISSUE 3: MISSING INVOICE NUMBER FORMAT VALIDATION

**Location**: `api/inv/invoices.js:83-85`

```javascript
function makeInvoiceNumber(receiptNumber) {
  return 'INV-' + (receiptNumber || '');
}
```

If `receiptNumber` is undefined/null, the invoice number becomes just `"INV-"`. The `receiptNumber` field comes from `transaction.receiptNumber` which is required+unique, so this shouldn't happen in practice. But the fallback `|| ''` silently produces a bad invoice number.

**Severity**: LOW — theoretical only (receiptNumber is always present).

---

## ISSUE 4: AUDIT LOG FIELD NAME MISMATCH

**Location**: `api/inv/invoices.js:317-329`

```javascript
await AuditLog.create({
  action: 'INVOICE_GENERATED',
  entityType: 'Invoice',        // ← WRONG: should be 'targetType'
  entityId: invoice._id,        // ← WRONG: should be 'targetId'
  details: { ... },
  operator: ...,
  createdAt: new Date()
});
```

The AuditLog schema uses `targetType` and `targetId`, not `entityType` and `entityId`. These fields will be stored as additional properties (Mongoose allows this) but will not be queryable by the standard audit log interface.

**Severity**: MODERATE — Data is captured in `details` and `action` fields, but structured querying is broken.

---

## ISSUE 5: INVOICE PDF REDUNDANT COMPANY HARDCODING

**Location**: `services/inv-invoice-pdf.js:12-22`

The PDF generator has company info hardcoded. The Invoice model stores `companyInfo` as a snapshot. PDF generator IGNORES the stored `companyInfo` and uses its own hardcoded values.

```javascript
const COMPANY = {
  name: 'TechCross Repair Centre',
  vatNumber: 'IE3330982OH',
  address: 'UNIT M.4, Navan Town Centre',
  ...
};
```

If the company's legal name, VAT number, or address changes:
- Future invoices would store the new companyInfo in the DB
- But the PDF generator would still print the old hardcoded values
- Old invoices would be regenerated with new (incorrect) company info

**Severity**: MODERATE — Legal compliance issue. Invoices must show the company info that was valid at the time of issue.

**Fix**: PDF generator should read `invoice.companyInfo` instead of hardcoded constants.

---

## ISSUE 6: SHARED INVOICE PDF NO AUTH (INTENTIONAL BUT RISKY)

**Location**: `api/inv/invoices.js:21-37`

Shared invoice endpoints (`/shared/:token/pdf`, `/shared/:token/meta`) require no authentication. The share token is a random 48-char hex string. This is intentional for the use case (email customer a link), but the token provides the only access control.

**Severity**: LOW — Token is cryptographically random (24 bytes = 192 bits of entropy).

---

## INVOICE IMMUTABILITY

| Operation | Guard | Status |
|---|---|---|
| New creation | Allowed | ✅ |
| Edit financial fields | ✅ Blocked by pre-save hook | `Invoice.js:115-131` |
| Edit delivery fields | ✅ Allowed (pdfPath, emailStatus, etc.) | Same hook |
| Direct query update | NOT blocked | ❌ No pre-findOneAndUpdate hook |
| Delete | NOT blocked | ❌ No pre-delete hook |

**FINDING I7**: The Invoice model has NO pre-findOneAndUpdate or pre-delete hooks. Unlike CashLedger and DailyClose (which have full sets of mutation blockers), Invoice only guards against financial field edits via `save()`. A direct `findByIdAndUpdate()` or `deleteOne()` call would bypass all immutability guarantees.

**Severity**: MODERATE — Low probability (all Invoice writes go through the API layer, not direct queries), but inconsistent with the immutability strategy used by CashLedger and DailyClose.

---

## SUMMARY

| # | Issue | Risk | Fix priority |
|---|---|---|---|
| I1 | Invoice line items don't sum to grossTotal with order discount | Moderate | High |
| I2 | PDF recalculates VAT from line totals (display only) | Low | Low |
| I3 | Missing invoice number validation | Low | Low |
| I4 | Audit log uses wrong field names (entityType vs targetType) | Moderate | High |
| I5 | PDF hardcodes company info, ignores snapshot | Moderate | **Critical** |
| I6 | Shared invoice token-based auth only | Low | By design |
| I7 | Invoice model missing findOneAndUpdate/delete hooks | Moderate | Medium |
