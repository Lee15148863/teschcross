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

- gcp-admin.js still stub — no real Cloud Run / Cloud Build operations
- Node.js Secret Manager client needs ADC: `gcloud auth application-default login`
- Atlas IP whitelist needs current IP (83.71.3.40) or static Cloud Run egress
- real customer Cloud Run deploy not tested
- rollback traffic switch not tested

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
| Backend onboarding integration checks | 27/27 passed (previously, rate-limited on replay) |
| SaaS E2E | 13/13 passed (previously, rate-limited on replay) |
| Main POS smoke | PASS — no regressions |
| Full test suite | 492/545 pass, 53 skipped (3 pre-existing mongod failures) |
| Main POS files touched | NO |

## Next Recommended Steps

1. ADC setup + real Node.js Secret Manager validation
2. Real gcp-admin.js implementation (per specs/gcp-admin-replacement.md)
3. Real staging tenant deployment to Cloud Run
4. Rollback traffic switch test
5. Atlas IP whitelist configuration
