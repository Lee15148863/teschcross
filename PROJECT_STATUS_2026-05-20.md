# Project Status — 2026-05-20

## Production

| Field | Value |
|-------|-------|
| **Revision** | `teschcross-git-git-main-security-owner-portal` |
| **Traffic** | 100% |
| **Rollback** | `teschcross-git-git-receipt-80mm-sw-v2` |
| **mongo** | operational |
| **sw.js** | v5 |

## Main POS (techcross)

| Check | Status |
|-------|--------|
| Lee087 login | OK |
| /api/app-version | 200 |
| /api/inv/modules | 200 |
| inv-login.html | 200 |
| inv-pos.html | 200 |
| boss.html | 200 |
| boss-audit.html | 200 |
| saas/admin.html | 200 |
| Quick Add Product | OK |
| 80mm receipt gutter | active |

## StoreFlow Free Plan

| Feature | Value |
|---------|-------|
| Status | Production-ready |
| Users | 2 |
| Products | 100 |
| Monthly transactions | null (unlimited) |
| Storage | 50MB |
| Modules | pos, products, transactions, stock, reports |
| Shortcuts | false (manual tick by SaaS Admin only) |
| Refund | enabled |
| Transaction delete | disabled |
| Void | disabled |
| VAT export | disabled |
| Accounting export | disabled |
| Profit report | disabled |
| CashLedger report | disabled |
| Invoices | disabled |
| BYO MongoDB | by request (admin-verified activation) |
| Receipts print | enabled |
| Basic reports | enabled |

## Test Tenant

| Field | Value |
|-------|-------|
| Service | `storeflow-test-mainpos` |
| Revision | `storeflow-test-mainpos-00050-gtp` |
| Plan | free |
| Modules | pos/products/transactions/stock/reports |

## Deployed Features

- Sprint 3 Free plan / module / report policy
- SaaS Admin Manage Store entry
- Store Owner staff management (CRUD + safety guards)
- 9 security blocker fixes (register disable, IDOR, enable protect, ledger guard, slug fix, store context, settings write, UI visibility, Free limit)
- Per-store branded login portal `/s/:slug`
- Per-store login status allowlist (active/trial/trialing only)
- POS Quick Add / Repair / Used / Buy 500 fix
- 80mm receipt 4ch right gutter + font -2px
- sw.js v5 bypass admin/API/SaaS requests
- Cloud NAT static IP (104.155.83.41) permanent MongoDB fix
- VPC connector `storeflow-connector` on all services

## Infrastructure

| Resource | Name |
|----------|------|
| Static IP | 104.155.83.41 |
| VPC | storeflow-vpc |
| Cloud NAT | storeflow-nat |
| VPC Connector | storeflow-connector |
| Cloud Router | storeflow-router |

## Deploy Rules

- `gcloud builds submit --config=cloudbuild.yaml --substitutions=_TAG=<tag> .`
- No `gcloud run deploy --source`
- No `--set-env-vars` / `--update-env-vars`
- No main push auto-deploy
- Staging trigger: planned, not yet active
- Production tag trigger: not enabled
- VPC connector + egress required on all deployments
