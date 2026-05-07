# AI POS / ERP SYSTEM SPEC (ULTRA VERSION v2.1)

---

# 0. AI EXECUTION DIRECTIVE (CRITICAL)

You are developing a production-grade POS + ERP system.

You MUST:

* Follow ALL rules defined in this document
* NEVER assume missing logic
* NEVER simplify VAT or financial logic
* NEVER merge unrelated systems (inventory ≠ devices ≠ cash)

If a request conflicts with this spec:
→ REJECT the request and explain why

---

# 0.1 GIT & DEPLOYMENT RESTRICTIONS (CRITICAL)

The system is in LOCAL DEVELOPMENT mode.

STRICT RULES:

* DO NOT push any code to GitHub or any remote repository
* DO NOT create or modify git remotes
* DO NOT run git push, git commit, or git sync automatically
* DO NOT deploy to any server
* DO NOT connect to CI/CD systems

ONLY allowed if explicitly instructed by the user:

* git init
* git add
* git commit (manual, user-approved)

REQUIREMENT:

If any operation involves:

* GitHub
* remote repository
* deployment

→ You MUST ask for explicit user approval BEFORE proceeding

Violation of this rule is considered a critical error.

---

# 0.2 DATA & PRIVACY PROTECTION

* DO NOT upload any business data

* DO NOT expose:

  * pricing logic
  * VAT logic
  * device data
  * transaction data

* All data must remain LOCAL unless explicitly approved

---

# 1. SYSTEM CORE PRINCIPLES (NON-NEGOTIABLE)

1. Transactions are mutable (root only)
2. Cash ledger is IMMUTABLE (never edited or deleted)
3. Daily snapshots are IMMUTABLE (financial truth)
4. Monthly reports are IMMUTABLE (tax reporting)
5. Devices are IMMUTABLE ASSETS (never deleted)
6. Inventory is NOT a financial truth (reference only)

---

# 2. SYSTEM LAYERS (STRICT SEPARATION)

## 2.1 TRANSACTION LAYER

Handles:

* sales
* refunds
* quick sales
* services
* device sales

Mutable: YES (root only)

---

## 2.2 CASH LAYER (SOURCE OF TRUTH)

Handles ALL money movement.

Immutable: YES

---

## 2.3 INVENTORY LAYER

Operational only.

* Can be wrong
* Can be negative

---

## 2.4 DEVICE ASSET LAYER

Separate from inventory.

Tracks:

* buy price
* lifecycle
* margin VAT

Immutable chain: YES

---

## 2.5 FINANCIAL SNAPSHOT LAYER

* daily snapshot
* monthly report

Immutable: YES

---

# 3. USER ROLES

## STAFF

* sales
* quick sale
* basic refund

MUST NOT:

* delete transaction
* modify VAT
* override pricing

---

## MANAGER

* approve discount
* approve refund

MUST NOT:

* modify VAT
* delete transaction
* change historical data

---

## ROOT (OWNER)

FULL CONTROL:

* delete transactions
* modify any value
* override rules
* export data

---

# 4. TRANSACTION SYSTEM

## TYPES

* sale
* quick_sale
* service
* device_sale
* refund

---

## RULES

MUST:

* create transaction record
* include VAT calculation
* include payment breakdown

MUST NOT:

* allow manual VAT override (except root)
* skip cash ledger entry

---

## PAYMENT

Supports:

* cash
* card
* split

MUST match total

---

# 5. VAT RULES (CRITICAL)

## STANDARD

* 23% → products
* 13.5% → services

---

## DEVICE (MARGIN VAT)

margin = sellPrice - buyPrice

IF margin > 0:
VAT = margin × rate

IF margin ≤ 0:
VAT = 0

---

## RULES

MUST:

* compute automatically
* store result in transaction

MUST NOT:

* accept manual VAT input

---

# 6. INVENTORY RULES

MUST:

* record stock movement

ALLOWED:

* negative stock
* selling without stock

MUST NOT:

* block sale

---

# 7. DEVICE SYSTEM (STRICT)

## LIFECYCLE

BUY_IN → PENDING → TESTED → SOLD

---

## RULES

MUST:

* store buy price
* track status

ALLOWED:

* sell before tested (flag risk)

MUST NOT:

* delete device
* merge with inventory

---

## COST CHANGE

ONLY ROOT allowed
NO reason required

---

# 8. CASH LEDGER (STRICTEST)

## PURPOSE

ONLY source of financial truth

---

## ENTRY TYPES

* sale
* refund
* supplier
* expense
* device_buy
* bank_in
* bank_out

---

## RULES

MUST:

* create entry for EVERY money movement

MUST NOT:

* edit
* delete

---

# 9. REFUND SYSTEM

## NORMAL

* manual input allowed

---

## DEVICE

* MUST use original transaction

---

## RULES

MUST:

* create negative transaction
* create negative cash entry

---

# 10. DAILY CLOSE

## STATES

OPEN → PENDING → CLOSED

---

## RULES

CLOSED:

* immutable
* required for reporting

PENDING:

* blocks monthly report

---

# 11. DAILY SNAPSHOT

MUST include:

* total sales
* VAT output
* VAT input
* cash
* card

---

## RULES

MUST:

* be immutable

MUST NOT:

* be affected by transaction deletion

---

# 12. MONTHLY REPORT

MUST:

* aggregate daily snapshots

---

## RULES

MUST:

* lock after generation

---

# 13. TRANSACTION DELETION

ONLY ROOT

---

## RULES

MUST:

* remove transaction

MUST NOT:

* affect:

  * cash ledger
  * snapshots
  * reports

---

# 14. APPROVAL SYSTEM

## TYPES

* discount
* refund
* device

---

## FLOW

pending → approved/rejected

---

# 15. AUDIT LOG

MUST log:

* delete
* refund
* price change
* cost change

---

# 16. PRINT SYSTEM

## CHANNELS

* Print Agent (localhost:9100)
* Browser fallback

---

## RULES

MUST:

* not affect transaction
* log print result

---

# 17. ERROR HANDLING

System MUST detect:

* cash mismatch
* VAT mismatch
* unclosed days
* orphan transactions
* invalid device states

---

# 18. EDGE CASES (REAL BUSINESS)

MUST HANDLE:

* selling without stock
* selling untested device
* refund without receipt
* negative margin device sale
* manual quick sale

---

# 19. OWNER MOBILE PANEL

## PURPOSE

Remote monitoring

---

## FEATURES

* daily sales
* cash overview
* VAT summary
* pending approvals
* device status

---

## RULE

Read-only + approval only

---

# 20. AI DEVELOPMENT RULES

When generating code:

MUST:

* follow this spec strictly
* separate layers clearly
* ensure financial correctness

MUST NOT:

* simplify VAT logic
* merge systems
* ignore constraints

---

# 21. BACKUP & DATA EXPORT POLICY (HARD RULES)

## 21.1 NO AUTOMATIC BACKUP

The system does NOT provide automatic backup or restore functionality under any circumstances.

## 21.2 BACKUP IS MANUAL

Backup is handled manually by ROOT admin via export functions only.

## 21.3 EXPORT SCOPE

ROOT can export the following datasets at any time:

* transactions
* cash ledger entries
* audit log entries
* daily close reports

Each export supports:

* JSON format (full fidelity, includes all fields)
* CSV format (flat structure, suitable for spreadsheet import)

## 21.4 ADMIN RESPONSIBILITY

ROOT admin is solely responsible for:

* reviewing exported data for correctness before archiving
* deleting incorrect records directly in the system (ROOT only)
* archiving exported data to external storage (e.g. cloud storage, NAS, S3, local backup)
* maintaining external data retention in compliance with local tax laws

## 21.5 SYSTEM DISCLAIMER

The system:

* provides raw data as stored — no transformation, no aggregation
* does NOT guarantee external data retention
* is NOT responsible for data once exported
* does NOT encrypt export files (admin must secure them externally)
* does NOT provide scheduled or automated exports

## 21.6 EXPORT FORMAT RULES

JSON export MUST:

* include ALL fields from the source collection
* wrap in `{ "exportType": "...", "exportedAt": "...", "count": N, "data": [...] }`
* use ISO 8601 date strings

CSV export MUST:

* flatten nested objects to dot-notation columns (e.g. `items.name`)
* include a header row
* quote all string fields
* use comma as delimiter

---

# END OF SPEC
