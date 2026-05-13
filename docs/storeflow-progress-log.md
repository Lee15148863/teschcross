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
