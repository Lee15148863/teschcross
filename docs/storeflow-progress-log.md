# StoreFlow SaaS Onboarding + Secret Foundation

Checkpoint date: 2026-05-13

## Completed

- StoreFlow Test Shop created
- T19 Slice 1 POS Test Shell accepted
- readonly_frozen backend enforcement tested
- storeId JWT isolation tested
- customer-owned MongoDB Atlas rule recorded
- MongoDB URI validator completed
- signup / approve / deployment backend integrated with URI validation
- onboarding UI completed (register, admin, admin-deployments, dashboard)
- Secret Manager dry-run wrapper completed
- Deployment.storeId migration completed
- real gcloud Secret Manager CLI validation completed
- legacy signup production gate completed (ALLOW_LEGACY_SIGNUP flag)

## Current Blockers

- separate customer Cloud Run deploy not tested
- Atlas IP whitelist needs current IP (83.71.3.40) or static Cloud Run egress
- gcp-admin.js Slice 1 implemented but real customer deploy not validated
- rollback traffic switch not tested

## Tonight: Main Website Test Module Release (2026-05-13)

## Security Rules

- StoreFlow only provides software service. Customer owns MongoDB Atlas account, database, billing, backups.
- StoreFlow never deletes customer MongoDB data. Freeze/suspend/destroy affects only StoreFlow service layer.
- Full MongoDB URI never returned in API responses, UI, or logs. Masked URI only.
- Deployment PIN never stored plaintext. bcrypt hash in pinHash field.
- All dangerous actions (deploy/suspend/activate/freeze/rollback/destroy) require HHMM + PIN + reason + audit log.
- Main POS files must remain untouched. All changes confined to saas/ models/api/utils/tests.

## Known Limitations

| # | Limitation |
|---|-----------|
| L1 | Secret Manager real Node.js client not yet validated — ADC required |
| L2 | gcp-admin.js is a STUB — real GCP operations not built |
| L3 | Cloud Run static egress not configured |
| L4 | Real Atlas validation blocked by IP whitelist on this network |
| L5 | Legacy signup allowed only when ALLOW_LEGACY_SIGNUP=true |
| L6 | gcp-admin replacement SPEC exists (specs/gcp-admin-replacement.md) but not implemented |

## Test Evidence

| Suite | Result |
|-------|--------|
| URI validator unit tests | 44/44 passed |
| Secret Manager unit tests | 16/16 passed |
| Deployment storeId unit tests | 3/3 passed |
| Production gate unit tests | 4/4 passed |
| Backend onboarding integration checks | 29/29 passed |
| SaaS E2E | 13/13 passed (previously, rate-limited on replay) |
| Main POS unit tests | 164/164 passed |
| Main POS HTTP smoke | 6/6 passed (landing, auth 401, brands, pricing, captcha) |
| Full test suite | 492/492 pass (20 files), 53 skipped, 3 pre-existing EFTYPE |
| SaaS full onboarding check | 29/29 passed |
| gcp-admin.js dry-run test | 7/7 passed |
| Main POS files touched | NO |

## Next Recommended Steps

1. Pull repo on new computer
2. Run `npm install`, start server with .env
3. Verify StoreFlow Test Shop login + dashboard locally
4. Eventually: real customer Cloud Run deploy (separate services)
5. Rollback traffic switch test
6. Atlas IP whitelist configuration

---

## Tonight: Main Website Test Module Release (2026-05-13)

### What is going live
- StoreFlow SaaS test module runs **inside the existing main website/service**
- NOT a separate customer Cloud Run deployment
- Test module accessible at `/saas/*` routes on the existing main domain

### Test module access
- Super admin: Lee087 (same as Main POS boss account)
- Test shop owner: `test_owner` / `testpass123`
- Test shop name: StoreFlow Test Shop
- Login: `/saas/login.html`
- Dashboard: `/saas/dashboard.html`
- Admin panel: `/saas/admin.html`
- Deployments: `/saas/admin-deployments.html`
- POS test: `/saas/pos.html`
- Recreate test store: `node scripts/create-test-store.js` (idempotent, safe)

### What remains disabled / future
- Real customer Cloud Run deployment — NOT active, gcp-admin.js stays in dry-run
- Real Secret Manager usage — SECRET_MANAGER_DRY_RUN=true
- Atlas IP whitelist — not configured
- Rollback traffic switching — not tested
- gcp-admin.js stubs: updateCloudRunService, updateServiceEnv

### Recent changes committed
- `utils/gcp-admin.js` — Slice 1 real implementation (5 functions, dry-run default)
- `.gitignore` — added `*-key.json` pattern
- `.env.example` — added dry-run vars, ALLOW_LEGACY_SIGNUP=false default

### Known risks
1. StoreFlow uses dry-run mode for all GCP operations — no real Cloud Run impact
2. ALLOW_LEGACY_SIGNUP=false means legacy signups rejected in production (expected)
3. gcp-admin.js has `assertNotMainPos()` safety blocking Main POS service names
4. service account key `storeflow-local-dev-key.json` exists in repo root but is gitignored
5. CRLF warnings on Windows — cosmetic only

### Rollback instruction
- `git revert HEAD` and redeploy to undo this commit
- Does NOT affect MongoDB data or customer/store data
- Previous known-good revision: `9c2262b`

## Local Mac Verification — StoreFlow Test Shop (2026-05-14)

Date: 2026-05-14

Environment:
- macOS VS Code
- repo: Lee15148863/teschcross.git
- branch: main
- latest commit: a27b49e StoreFlow test module main-site readiness
- server: http://localhost:8080
- MongoDB connected

Pull result:
- fast-forward bb585aa..a27b49e
- no conflicts
- StoreFlow files now present

Verification results:
- Super admin login Lee087: PASS
- StoreFlow Test Shop visible: PASS
- no MongoDB URI leak: PASS
- test_owner login: PASS
- role: store_root
- correct storeId: PASS
- /saas/pos.html opens: PASS
- fake product created: Test Cable, €10, accessory
- fake transaction created: 2 × Test Cable = €20, cash
- summary updated: transactionCount 1, totalSales 20, cashTotal 20, cardTotal 0

Main POS smoke:
- / 200
- /inv-login.html 200
- /api/brands 200
- /api/pricing 200
- /api/health 200

Safety check:
- real transactions unchanged
- cashledgers unchanged
- invoices unchanged
- dailycloses unchanged
- only saatestproducts and saatesttransactions received new test records
- Main POS/VAT/invoice/CashLedger untouched

Local stash:
- stash@{0}: local inv-system-audit.test.js fix
- patch saved to ~/Desktop/inv-system-audit-local-change.patch
- do not apply yet

Next step:
- Decide whether to keep or drop the local stash after reviewing it
- Then continue with either production live check or next StoreFlow task

## Live Main Website Deployment — StoreFlow Test Module Online (2026-05-14)

Date: 2026-05-14 20:00 UTC

Project: project-0bb407e6-67ba-4d3e-8da
Service: teschcross-git
Region: europe-west1
Previous revision: teschcross-git-00239-zmv
New revision: teschcross-git-00245-42q
Traffic: 100% to teschcross-git-00245-42q

Rollback command:
```
gcloud run services update-traffic teschcross-git \
  --region=europe-west1 \
  --to-revisions teschcross-git-00239-zmv=100
```

Smoke test:
- / 200
- /inv-login.html 200
- /api/brands 200
- /api/pricing 200
- /api/health 200 revision 00245-42q
- /saas/login.html 200
- /saas/admin.html 200
- /saas/dashboard.html 200
- /saas/pos.html 200 real page (not catch-all)
- /saas/pos.js 200 real JS (not catch-all)
- /api/saas/pos/products unauthenticated returns 401 JSON

Live test:
- 1 fake product created (Live Test Cable, €15)
- 1 fake transaction created (1 × Live Test Cable, €15, cash)
- data went only to SaaTest* collections

Safety:
- Real transactions unchanged (27)
- CashLedger unchanged (44)
- Invoices unchanged (11)
- DailyClose untouched (0)
- Main POS intact
- Rollback not needed

## StoreFlow Main POS Clone Deployment — Test Service Online (2026-05-14)

Architecture: StoreFlow = existing Main POS cloned to independent tenant services.
Not a new POS. Not SaaTest POS. Each tenant gets its own Cloud Run + MongoDB Atlas.

Test clone:
- serviceName: storeflow-test-mainpos
- service URL: https://storeflow-test-mainpos-jsd5o6n4la-ew.a.run.app
- deploymentId: 6a05f031d0a5ae65b64a00bb
- database: storeflow_test_mainpos
- validation: PASS
- previous revision: none
- new revision: storeflow-test-mainpos-00001-rnx
- rollback: none (first revision)

Smoke:
- /api/health 200
- / 200
- /inv-login.html 200
- /api/brands 200
- /api/pricing 200
- /api/inv/products unauthenticated 401 JSON

Safety:
- TechCross production DB touched: NO
- Main POS code touched: NO
- real transactions/cashledgers/invoices/dailycloses touched: NO
- Conclusion: existing Main POS can now be cloned to an independent Cloud Run service with independent Atlas DB

Deploy flow implemented:
- `scripts/deploy-tenant-store.js` — orchestration script
- `api/saas/stores.js` — POST /:id/deploy-mainpos-clone endpoint (super_admin + PIN)
- `utils/gcp-admin.js` — triggerDeployBuild via `gcloud run deploy --source .` + updateServiceEnv
- `models/saas/Deployment.js` — region, previousRevision, latestRevision, rollbackCommand
- `specs/storeflow-rollout-spec.md` — rollout architecture + rollout-all design (not yet implemented)

Dead code cleaned:
- Removed `listRevisions()` (0 callers)
- Removed `POLL_INTERVAL_MS`, `MAX_POLL_ATTEMPTS` (synchronous deploy)

## StoreFlow Rollout-All + Single Store Rollback Backend — Complete (2026-05-14)

- Release model: version, gitCommit, status (draft→testing→test_passed→rolling_out→completed/failed/rolled_back)
- StoreUpgrade model: per-store upgrade tracking with previousRevision, newRevision, rollbackCommand
- api/saas/releases.js: create, mark-test-passed, rollout-all, list, detail, rollback
- rollout-all: sequential Cloud Run deploy with PIN verification, health check, StoreUpgrade records
- test rollout: storeflow-test-mainpos → rev storeflow-test-mainpos-00002-f7w, release completed, StoreUpgrade healthy
- single-store rollback: POST /api/saas/releases/:id/stores/:storeId/rollback
- rollback rules: super_admin + reason + HHMM+PIN, double-rollback blocked, Main POS guard (includeMainPos)
- switchTraffic + updateServiceEnv refactored to gcloud CLI
- Main POS touched: NO
- customer DB touched: NO
- Tests: Round 1 backend PASS, Round 2 rollout deploy/health PASS, rollback refusal PASS

## StoreFlow Release Management UI — Complete (2026-05-14)

- Page: /saas/admin-releases.html
- Release list with status badges
- Create Release button
- Mark Test Passed button (enabled only for draft/testing)
- Rollout All button (enabled only for test_passed, requires HHMM+PIN + reason)
- StoreUpgrade table with per-store status + revisions
- Per-store Rollback button (requires HHMM+PIN + reason, blocks double-rollback)
- Link from saas/admin.html tabs
- No /api/inv calls, no secrets exposed
- Main POS touched: NO, customer DB touched: NO

## StoreFlow MongoDB Atlas Legal Authorisation & Evidence Chain (2026-05-15)

- Legal notice page: /saas/mongodb-atlas-notice.html (EN/ZH v1.0)
- 4 explicit checkboxes replace single checkbox on register:
  1. Atlas ownership + backup responsibility
  2. Free tier limitation warning + StoreFlow no recovery guarantee
  3. StoreFlow connection authorisation
  4. Terms / Privacy / Atlas Notice acceptance
- Backend requires all 4 when mongoUri provided
- StoreSignup model: noticeVersionAccepted, acceptedAt, acceptedIp, acceptedUserAgent, email, username
- Auto-set privacyNoticeAccepted + dpaNoticeAccepted when legalTermsAccepted
- mongoUri always select: false — never returned in API responses
- Admin display: combined acceptance badge with notice version/accepted timestamp
- R1 test: missing checkbox rejected, all accepted stores evidence, no URI leak

## Fix: STORE_NAME from MongoDB URI dbName, not serviceName (2026-05-15)

Root cause: deploy-tenant-store.js + releases.js derived STORE_NAME from serviceName, producing e.g. `storeflow-test-mainpos` (hyphens). MongoDB database name is `storeflow_test_mainpos` (underscores). Mongoose `dbName` option overrode URI database, causing connection failure (mongo:0).

Fix:
- scripts/deploy-tenant-store.js: STORE_NAME = parseMongoDbName(mongoUri) — from actual DB name
- api/saas/releases.js: same fix in deployStoresAsync()
- Guard: if dbName cannot be extracted from URI, abort with clear error
- Rule: Cloud Run serviceName uses hyphens. STORE_NAME (MongoDB dbName) uses URI dbName. Never derive one from the other.
- Main POS touched: NO
- Next: solicitor review of Terms/Privacy/DPA before commercial launch
- Test: page 200, JS loads, safety grep clean
