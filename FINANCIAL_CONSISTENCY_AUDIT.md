# FINANCIAL CONSISTENCY AUDIT

Audit date: 2026-05-11
Scope: Transaction, CashLedger, DailyClose, Invoice, MonthlyReport, Device lifecycle, Stock
Method: Static code analysis — cross-referenced model pre-save hooks, service atomicity, and API endpoints.

---

## ATOMICITY VERIFICATION

### Transaction + CashLedger
| Path | Atomic? | Session used? | Retry? | Risk |
|---|---|---|---|---|
| `services/inv-checkout-service.js` | ✅ Yes | `startSession()` + `commitTransaction()` | No retry (single attempt) | **Low** — failure throws, abort aborts |
| `services/inv-refund-service.js` | ✅ Yes | `startSession()` + `commitTransaction()` | ✅ 3 attempts (write conflict) | **Low** |
| Any other code path creating Transactions? | ✅ No — integrity layer blocks direct creation (SOURCES.CHECKOUT / SOURCES.REFUND only) | | | **Safe** |

**FINDING A1**: Checkout has NO retry logic for transient transaction errors (write conflicts). Refund has 3-attempt retry. If two concurrent checkouts hit a write conflict (e.g., same serial number Device update), one will fail with `ATOMIC_FAILURE`. Recommend adding the same retry pattern to checkout.

### Device Lifecycle + Transaction
| Path | Atomic? |
|---|---|
| Checkout: Device.create/update for margin items | ✅ Inside same session |
| Refund: Device status reset | ✅ Inside same session |
| Standalone Device creation (buy-in) | Not part of financial session — uses `authorize()` with `ROOT_EDIT` |

**FINDING A2**: Device buy-ins (inventory purchases) are not wrapped in a financial transaction. This is acceptable per SYSTEM_SPEC since Device is an asset tracking layer, not a financial core record.

### Stock Movements (Best-Effort)
Stock updates happen OUTSIDE the atomic session per SYSTEM_SPEC §2.3. Documented and intentional.

---

## TRANSACTION ↔ CASHLEDGER CONSISTENCY

### Cross-reference check
- Every sale: ✅ One Transaction + one CashLedger entry (created atomically)
- Every refund: ✅ One Transaction + one CashLedger entry (created atomically)
- No code path creates Transaction without CashLedger or vice versa
- CashLedger immutability: ✅ Full set of pre-save/pre-update/pre-delete hooks (6 hooks)
- Transaction immutability: ✅ Only prevents direct creation, root edits allowed (intentional)

**FINDING A3**: Transaction model does NOT prevent direct updates by root. The schema only blocks direct creation (line 63-68). Root can modify any field including `totalAmount`, `standardVatTotal`, etc. This is intentional per RUNBOOK but means root actions bypass all financial safeguards.

---

## DAILY CLOSE CONSISTENCY

### State machine: `open → pending → closed`
| Transition | Guard | Source |
|---|---|---|
| open → pending | First `closeDay()` call — creates snapshot | `inv-daily-close-service.js:196-204` |
| pending → closed | `confirmDay()` — re-validates before confirming | `inv-daily-close-service.js:215-235` |
| Any edit after closed | ✅ Blocked — pre-save hook checks existing status | `DailyClose.js:87-93` |

**FINDING A4**: The `closeDay` function at line 196-200 overwrites an existing `pending` snapshot with `Object.assign()`. If the server crashes between the `Object.assign` and `save()`, the snapshot is lost (in-memory only). Since the existing doc still exists in DB with its previous state, the next call would re-generate. **Low risk.**

### Split Payment Reconciliation
In `validateTransactionLedgerMatch()`:
- **Transactions**: `cashPortion = totalAmount - cardAmount`
- **Ledger**: `cashPortion = cashReceived - changeGiven`
- These formulas SHOULD produce identical results, but they access different source fields. If `cashReceived` in the ledger differs from `totalAmount - cardAmount` (due to data entry or migration issues), reconciliation silently uses the ledger's computation.

**FINDING A5**: Two different formulas for split cash calculation could diverge on inconsistent data. The system would still report `cashReconciliation: true` if both sides use the same (possibly wrong) ledger value. **Moderate risk.**

---

## REFUND INTEGRITY

### Duplicate refund prevention
| Mechanism | Status |
|---|---|
| `originalReceipt` unique partial index | ✅ `Transaction.js:53-55` — prevents two refunds with same originalReceipt |
| Pre-creation check `findOne({ originalReceipt, totalAmount: { $lt: 0 } })` | ✅ `inv-refund-service.js:177-186` — catches before DB write |
| Retry loop re-checks on write conflict | ✅ 3 attempts |

### Refund VAT reversal
The refund service computes VAT reversal directly (lines 129-158) rather than using `inv-vat-calculator.js`. The formula:
- Standard: `vatAmt = unitPrice * rate / (1 + rate) * quantity` (with rounding per-unit)
- Margin: `marginAmt = max(0, unitPrice - costPrice) * rate / (1 + rate) * quantity`

**FINDING A6**: Refund VAT calculation uses `unitPrice` (which is `discountedPrice || unitPrice` from line 96), NOT `discountedPrice` if the original had both `unitPrice` and `discountedPrice`. For partial refunds where `discountedPrice ≠ unitPrice`, the refund correctly uses the discounted price. **Low risk** — but this is a third independent VAT calculation implementation (besides `inv-vat-calculator.js` and `inv-discount-calculator.js`).

---

## DEVICE LIFECYCLE INTEGRITY

### Status flow: BUY_IN → PENDING → TESTED → SOLD
| Transition | Guard | Source |
|---|---|---|
| Forward only | ✅ `Device.js:56-63` — blocks backward moves |
| Refund unwind (SOLD → TESTED) | ✅ Authorized via SOURCES.REFUND |
| sellPrice/sellTransaction clearance | ✅ Requires SOURCES.REFUND |
| buyPrice edit | ✅ Requires SOURCES.ROOT_EDIT |

**FINDING A7**: The checkout service creates Device records for margin-scheme items that don't already have a Device record (line 286-293). The `serialNumber` falls back to `LEGACY-{product}-{timestamp}`. This means multiple sales of the same product without serial numbers create synthetic Device records with non-reusable serial numbers. **Low risk** — intentional for legacy migration.

---

## OVERALL RISK SUMMARY

| # | Finding | Risk | Status |
|---|---|---|---|
| A1 | Checkout lacks retry logic for transient transaction errors | Low | Unchanged |
| A2 | Device buy-ins not wrapped in financial transaction | Low | By design |
| A3 | Root can bypass Transaction immutability | Moderate | By design (RUNBOOK) |
| A4 | DailyClose pending snapshot overwrite not atomic | Low | Unchanged |
| A5 | Split payment reconciliation uses two different formulas | Moderate | Unchanged |
| A6 | Refund VAT is third calculation implementation | Low | Unchanged |
| A7 | Legacy Device serial fallback creates synthetic records | Low | By design |
