# StoreFlow Tenant Rules — Clean Tenant DB Policy

## Rule 1: Clean Tenant DB

Every StoreFlow customer deployment starts with a **completely empty MongoDB database**.

A new tenant database must contain **zero records** in all collections until the customer or StoreFlow explicitly runs a tenant-safe bootstrap.

### What is NEVER copied from TechCross

| Collection | Copied? | Reason |
|-----------|---------|--------|
| `pricings` | NO | Website repair quote data — TechCross-specific |
| `brands` | NO | Website brand data — TechCross-specific |
| `products` | NO | POS product inventory — customer manages |
| `transactions` | NO | Real sales data |
| `cashledgers` | NO | Real financial data |
| `invoices` | NO | Real invoice data |
| `dailycloses` | NO | Real financial snapshots |
| `devices` | NO | Second-hand device lifecycle |
| `invusers` | NO | POS user accounts |

### What Mongoose auto-creates

When Mongoose connects to the customer DB, it creates **empty collections** with the correct indexes. These are empty schemas — no data is copied:

- `invusers`, `products`, `transactions`, `cashledgers`, `invoices`, `dailycloses`, `devices`, `stockmovements`, `purchaseorders`, `suppliers`, `expenses`, `systemsettings`, `posshortcuts`, `loginlogs`, `trusteddevices`, etc.

### What is allowed to bootstrap (future)

A tenant-safe bootstrap script may create:

- One `invusers` record: Lee087 (root, boss)
- Optional: one staff user

This bootstrap must:
- Connect explicitly to the customer DB via `DBCon` + `STORE_NAME`
- Never read or write to `techcross` production DB
- Be opt-in (not auto-run during deploy)

## Rule 2: StoreFlow admin DB is separate

| DB | Purpose | Connection |
|----|---------|------------|
| `techcross` | StoreFlow admin (stores, deployments, releases, signups, SaaS users) | `process.env.DBCon` + `dbName: 'techcross'` |
| `{customer_db}` | Customer POS data | Customer's MongoDB URI + `dbName: {customer_db}` |

The two databases are in the same Atlas cluster but separate databases. Never copy data between them.

## Rule 3: Deploy scripts must not seed

`scripts/deploy-tenant-store.js` and `api/saas/releases.js` deploy Cloud Run services only. They:
- Read deployment metadata from admin DB
- Call Cloud Build → Cloud Run deploy
- Inject env vars (DBCon, INV_JWT_SECRET, etc.)
- Do NOT write to the customer DB

## Rule 4: seed.js is TechCross-main-site only

`scripts/seed.js` hardcodes `dbName: 'techcross'` and writes website repair pricing data. It must never be pointed at a customer DB.

## Rule 5: bootstrap-users.js is TechCross-main-site only

`scripts/bootstrap-users.js` hardcodes `dbName: 'techcross'` and creates Lee087. A tenant-safe version must be created before customer onboarding goes live.

## Rule 6: Tenant identity

Each tenant POS service sets `STOREFLOW_STORE_ID` env var = SaaS Store `_id`.
This enables SSO store scoping without cross-DB queries.
