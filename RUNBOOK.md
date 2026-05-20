# RUNBOOK — POS + ERP + VAT Financial System

This file is NOT documentation.
It is a **STRICT EXECUTION PROTOCOL** for any AI working on this project.

---

## 1. SYSTEM LEVEL CLASSIFICATION

This system has 3 execution layers:

**L1 — UI Layer (Frontend Only)**
- Rendering only
- No business logic
- No calculations
- No VAT logic
- No pricing logic

**L2 — Service Layer (Business Logic Layer)**
- All VAT calculations
- Transaction creation
- Refund logic
- Device lifecycle logic
- Cash ledger writes
- MUST be the ONLY place where business logic exists

**L3 — Financial Core Layer (HIGHEST SECURITY)**
- Transaction integrity rules
- CashLedger immutability enforcement
- Device financial integrity
- DailyClose locking rules
- Audit logging enforcement

ONLY L2 + L3 may touch financial data.

---

## 2. PERMISSION HIERARCHY

**STAFF:**
- POS usage only
- No access to reports
- No refunds beyond simple allowed cases

**MANAGER:**
- Reports access (read-only)
- View transactions
- No system modifications
- No user management

**ROOT (BOSS):**
- FULL SYSTEM CONTROL
- User management
- Transaction deletion
- Price modification
- Refund override
- Daily close override
- System emergency controls

IMPORTANT: All ROOT actions MUST still pass L3 integrity checks.

---

## 3. EXECUTION RULES (MANDATORY)

**Rule A — No frontend logic:**
Frontend must NEVER:
- calculate VAT
- calculate totals
- determine pricing
- validate financial rules

**Rule B — Single source of truth:**
All financial truth comes from:
- Transaction collection
- CashLedger collection
- Device collection
- DailyClose snapshot

**Rule C — No duplicate logic:**
If logic exists in Service Layer, it MUST NOT exist elsewhere.

**Rule D — Atomicity:**
All financial operations must be:
- atomic (MongoDB session)
- rollback-safe
- consistent across Transaction + Ledger + Device

**Rule E — Audit requirement:**
Every ROOT or MANAGER action must:
- generate AuditLog entry
- include user, action, timestamp, target

---

## 4. SYSTEM SAFETY RULES

- CashLedger is IMMUTABLE (append-only)
- DailyClose is IMMUTABLE after CLOSED state
- Device financial fields require explicit permission source
- Transactions cannot be silently modified after creation
- Refunds must reference original transaction

---

## 5. AI DEVELOPMENT PROTOCOL

When modifying this system, AI MUST:

1. **Read SYSTEM_SPEC.md first**
2. **Read RUNBOOK.md**
3. **Identify layer** (L1 / L2 / L3)
4. **Never mix layers**
5. **Output ONLY minimal necessary code changes**
6. **Always preserve financial integrity rules**

---

## 6. FORBIDDEN ACTIONS

AI MUST NEVER:
- Recalculate VAT in frontend
- Modify CashLedger directly outside service layer
- Bypass integrity checks
- Create duplicate financial logic
- Skip audit logging for ROOT actions
- Modify closed DailyClose records

---

## 7. SYSTEM DESIGN PRINCIPLE

This system is:

> **"A financial-grade POS + ERP system with immutable accounting rules"**

Not a web app.
Not a dashboard.
It is a financial system.

---

---

## 7. SAAS STOREFLOW LAYER (L4)

The SaaS layer manages tenant stores on top of the POS/ERP system.

**L4 — SaaS Management Layer**
- Store registration, approval, deployment
- Tenant isolation (separate Cloud Run + MongoDB per store)
- Super admin platform management
- Per-store login portal `/s/:slug`
- Module/plan entitlement enforcement

### Permission Hierarchy

```
SaaS Super Admin (Lee087)
  └─ Store Owner (store_root)
       └─ Manager
            └─ Staff
```

### Store Owner Permissions

| Action | Allowed |
|--------|---------|
| Manage own store staff/manager | Yes |
| Create staff/manager | Yes |
| Reset staff password | Yes |
| Disable/delete own staff/manager | Yes |
| Create store_root | NO |
| Create super_admin | NO |
| Promote to store_root | NO |
| Manage other stores | NO |
| Delete self | NO |
| Delete last active store_root | NO |
| Change plan/modules/database/deployment | NO |
| Write store settings | Yes (own store) |
| Access SaaS Admin panel | NO |

### Staff/Manager Defaults

**Manager:** POS, products view/edit, transactions view, basic reports. No staff mgmt, no settings write, no txn delete, no VAT export, no SaaS admin.

**Staff:** POS, products read, transactions view. No staff mgmt, no settings write, no txn delete, no invoice, no SaaS admin.

### Free Plan Policy (Production)

| Field | Value |
|-------|-------|
| Users | 2 |
| Products | 100 |
| Monthly transactions | null (unlimited) |
| Storage | 50MB |
| Modules | pos, products, transactions, stock, reports |
| Shortcuts | false (manual tick by SaaS Admin only) |
| Refund | enabled |
| Reports basic | enabled |
| VAT export | disabled |
| Accounting export | disabled |
| Transaction delete | disabled |
| Invoices | disabled |
| BYO MongoDB | disabled |

### Per-Store Login

- `/s/:slug` — branded store login portal
- Only active/trial/trialing stores may log in (allowlist, fail closed)
- Super admin bypass for troubleshooting
- Main `/inv-login.html` NOT affected

---

**END OF RUNBOOK**
