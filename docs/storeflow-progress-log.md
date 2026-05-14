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

## StoreFlow Release Rollout-All Backend — Complete (2026-05-14)

- Release / StoreUpgrade backend implemented
- rollout-all sequential deployment + PIN verification + health check per store
- test rollout completed: 1 store → healthy, rev storeflow-test-mainpos-00002-f7w
- Release status: completed
- StoreUpgrade: healthy
- Main POS touched: NO
- customer DB touched: NO
- Tests: Round 1 model/route/safety PASS, Round 2 rollout PIN/deploy/health PASS
- Next: single-store rollback backend
