# BROKEN DATA REPORT — Potential Data Integrity Issues

Analysis of code paths that could produce inconsistent, orphaned, or corrupted financial data.

---

## 1. ORPHAN AUDIT LOG ENTRIES

**Issue**: Audit logs for stock errors use `encryptedData: JSON.stringify(...)` (plaintext) instead of `encryptData()`.

**Locations**:
- `services/inv-checkout-service.js:342` — stock error audit
- `services/inv-refund-service.js:308` — stock error audit

**Risk**: LOW — These are non-financial entries, but cannot be decrypted with the standard decrypt function. If an auditor tries to decrypt all AuditLog entries, these will fail to parse.

---

## 2. INVOICE LINE TOTAL ≠ GROSS TOTAL

**Issue**: Invoice `lineTotal` is set to `item.subtotal` from the transaction item. When an order-level discount is applied, `transaction.totalAmount` includes the discount reduction, but individual `lineTotal` values still show the pre-discount subtotal.

**Location**: `api/inv/invoices.js:263`

**Scenario**:
- Item 1: subtotal = €100
- Order discount: €10
- `transaction.totalAmount` = €90
- Invoice shows: Item lineTotal = €100, GrossTotal = €90
- Sum of line items (€100) ≠ grossTotal (€90)

**Risk**: MODERATE — The invoice line items won't sum to the grand total, which may confuse customers and could be raised during a VAT audit.

**Fix**: Either apply order discount proportionally to each line item's lineTotal, or add a "Discount" line item.

---

## 3. MISSING AUDIT LOG ID FIELDS

**Issue**: `api/inv/invoices.js:317-329` — Invoice-generated audit log uses `entityType` and `entityId` fields, but the AuditLog schema uses `targetType` and `targetId`.

**Location**: `api/inv/invoices.js:317-329`

```javascript
await AuditLog.create({
  action: 'INVOICE_GENERATED',
  entityType: 'Invoice',        // ← should be targetType
  entityId: invoice._id,        // ← should be targetId
  details: { ... },
  operator: req.user ? req.user.userId : null,
  createdAt: new Date()
});
```

**Risk**: MODERATE — These audit entries have `targetType` and `targetId` as undefined. The audit system cannot link these entries to the invoice they reference. The `action` and `details` fields still capture the information, so no data is lost, but structured querying is broken.

---

## 4. LIVENESS OF `admin.js`

**Issue**: The `admin.js` file contains 10+ console.log calls identified in Phase 1 (previously reported). The file is dead code — `admin.html` immediately redirects to `admin-brands.html`. But if someone directly accesses admin.html and has JS enabled, those console.log calls expose nothing sensitive (already cleaned).

**Status**: Already fixed in Phase 1 cleanup.

---

## 5. HARDCODED CREDENTIALS IN `announcement-admin.js`

**Issue**: `username: '0876676466', password: '0870019999'` stored in cleartext with client-side-only auth via sessionStorage.

**Risk**: CRITICAL for production — but categorized as Phase 2+ fix since it requires server-side auth.

---

## SUMMARY

| # | Issue | Risk | Requires DB migration? |
|---|---|---|---|
| 1 | AuditLog encryptedData format mismatch for stock errors | Low | No (display only) |
| 2 | Invoice line items don't sum to grossTotal with order discount | **Moderate** | No (fix generation logic) |
| 3 | Invoice audit log uses wrong field names (entityType vs targetType) | **Moderate** | No (fix creation call) |
| 4 | Announcement admin hardcoded creds | Critical | Phase 2+ |
