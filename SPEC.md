# StoreFlow — SaaS POS for Repair Shops

## §G Goal

Multi-tenant SaaS POS for repair shops. Separate from TechCross POS. Each store gets independent Cloud Run service + **customer-owned** MongoDB Atlas database. StoreFlow provides software and deployment service only — never owns or controls customer data. Super admin (Lee087) manages onboarding, deployments, subscriptions.

## §C Constraints

C1. Stack: Node.js/Express/MongoDB (same as TechCross). No new infra.
C2. SaaS users in separate MongoDB collection (`SaaSUser`), not `InvUser`.
C3. SaaS routes under `/api/saas/*`, not `/api/inv/*`.
C4. Existing TechCross POS untouched — no shared financial data.
C5. Permission hierarchy: `super_admin` > `store_root` > `manager` > `staff`.
C6. Registration is approval-gated: signup → super_admin approves → store created. Store creation requires customer-provided MongoDB Atlas URI, timezone, currency, and deployment PIN (see I6).
C7. CAPTCHA required on login. Rate limiting on auth endpoints.
C8. Account lockout after 5 failed login attempts (30 min lock).
C9. All dangerous deploy actions require HHMM+PIN verification code.
C10. Subscription enforcement: expired → auto-freeze (readonly).
C11. Store settings editable by store_root + super_admin (via impersonation).
C12. Frontend L1: no business logic, no VAT calc. Pure view layer.
C13. New feature release process: StoreFlow Test Shop first → validate → deploy to Main POS (approval required) → gradual customer rollout.
C14. Each deployment target keeps own Cloud Run revision rollback. Never deploy all at once.
C15. Test store uses fake data only. No real sales, VAT, customer, or invoice data.
C16. Main POS is production-critical. StoreFlow changes must not touch /api/inv/*, models/inv/*, services/inv-*, or utils/inv-*.
C17. StoreFlow POS is a **test shell**, not production POS core. It validates functional flow only. Real customer POS will share POS core with Main POS.
C18. StoreFlow POS models must be clearly named as test-only (`SaaTest*`) to avoid confusion with future production POS models.
C19. Backend must derive storeId from JWT. Never trust client-supplied `storeId` parameter.
C20. Freeze enforcement must be backend-first (middleware). Frontend hiding buttons is UX only.
C21. Deployment lookup must use stable identifiers (storeId), not storeName. **Fix applied**: storeId field added to Deployment model. freezeGate and delete routes prefer `Deployment.findOne({ storeId })`, fallback to `storeName` for legacy records. Backfill script available: `scripts/backfill-deployment-store-id.js`.
C22. Product delete must be soft delete (active=false, deletedAt, deletedBy).

### Data Ownership & MongoDB Atlas

C23. **Customer owns their MongoDB Atlas account, cluster, and all data within.** StoreFlow does not sell, provide, own, or pay for customer MongoDB Atlas infrastructure.

C24. **StoreFlow provides software access and deployment service only.** Contract wording: "StoreFlow provides software access and deployment service. The customer remains responsible for their own MongoDB Atlas account, database ownership, billing, backups, and access credentials."

C25. **One customer = one independent Cloud Run service + one customer-owned MongoDB Atlas database.** No shared customer MongoDB. No tenantId shared POS database. No storage of multiple customer POS data in StoreFlow Admin MongoDB.

C26. **Do NOT introduce shared customer MongoDB.** Do NOT introduce tenantId shared POS database. Do NOT store multiple customer POS data in StoreFlow Admin MongoDB.

C27. **Do NOT create automatic MongoDB deletion.** Do NOT implement Atlas backup restore unless customer explicitly provides Atlas API access and this is designed as a separate managed-service feature.

C28. **Freeze / suspend / delete deployment only affects StoreFlow service access or Cloud Run service.** Must not delete customer MongoDB Atlas data, VAT records, invoice records, sales records, or customer records.

C29. **Never delete customer tax/VAT/invoice/sales data automatically.** Service deactivation (cancel subscription) must leave customer MongoDB Atlas data intact.

### StoreFlow Responsibilities

C30. StoreFlow provides the POS/store management software.
C31. StoreFlow deploys and updates the StoreFlow POS application to customer's Cloud Run service.
C32. StoreFlow connects the application to customer's provided MongoDB Atlas URI.
C33. StoreFlow validates that the MongoDB URI works before deployment (see I7).
C34. StoreFlow stores the MongoDB URI securely as deployment secret / environment configuration. Never exposed in API responses outside deploy management.
C35. StoreFlow provides service-level controls: activate, suspend, readonly freeze, rollback application revision, update application version.
C36. StoreFlow maintains its own Admin metadata and audit logs — separate from customer POS data.

### Customer Responsibilities

C37. Customer creates own MongoDB Atlas account/project/cluster.
C38. Customer provides own MongoDB Atlas connection string.
C39. Customer maintains own Atlas billing.
C40. Customer maintains own Atlas database users/passwords.
C41. Customer configures required Atlas network access / IP allowlist.
C42. Customer configures and manages Atlas backups unless separate paid managed-service agreement exists.
C43. Customer owns and controls their sales/VAT/invoice/customer data.
C44. Customer keeps their Atlas access secure.

## §I Interfaces

### I1 Frontend Pages

| Path | Page | Auth | Role |
|------|------|------|------|
| `/saas/` | Landing | none | public |
| `/saas/login.html` | Login w/ CAPTCHA | none | public |
| `/saas/register.html` | Signup form | none | public |
| `/saas/dashboard.html` | Store settings | JWT | store_root+ |
| `/saas/admin.html` | Store/signup/user mgmt | JWT | super_admin |
| `/saas/admin-deployments.html` | Deploy dashboard | JWT | super_admin |

### I2 API Routes

| Method | Path | Auth | Role | Notes |
|--------|------|------|------|-------|
| GET | `/api/saas/auth/captcha` | none | public | Returns math CAPTCHA `{question, token}` |
| POST | `/api/saas/auth/login` | none | public | CAPTCHA+rate-limited |
| POST | `/api/saas/auth/register` | none | public | One-time bootstrap super_admin |
| POST | `/api/saas/signup` | none | public | Store registration (pending). Per I6, stores must provide MongoDB URI + timezone + currency. **Current: not yet collected.** See T20. |
| GET | `/api/saas/signup` | JWT | super_admin | List signups |
| GET | `/api/saas/stores` | JWT | super_admin | List stores |
| POST | `/api/saas/stores/approve/:id` | JWT | super_admin | Approve → create store+user |
| POST | `/api/saas/stores/reject/:id` | JWT | super_admin | Reject signup |
| PUT | `/api/saas/stores/:id/suspend` | JWT | super_admin | |
| PUT | `/api/saas/stores/:id/activate` | JWT | super_admin | |
| DELETE | `/api/saas/stores/:id` | JWT | super_admin | Needs HHMM+PIN + reason + audit log |
| POST | `/api/saas/stores/impersonate/:id` | JWT | super_admin | Scoped JWT |
| GET | `/api/saas/stores/:id/settings` | JWT | store_root+ | |
| PUT | `/api/saas/stores/:id/settings` | JWT | store_root+ | |
| GET | `/api/saas/stores/:id/users` | JWT | super_admin | |
| DELETE/PUT | `/api/saas/stores/:id/users/:uid` | JWT | super_admin | CRUD users |
| PUT | `/api/saas/stores/:id/users/:uid/disable\|enable` | JWT | super_admin | |
| POST | `/api/saas/stores/:id/password` | JWT | store_root+ | Change own pw |
| POST | `/api/saas/stores/:id/users/:uid/reset-password` | JWT | super_admin | |
| POST | `/api/saas/stores/:id/users/:uid/email-credentials` | JWT | super_admin | |
| CRUD | `/api/saas/deployments/*` | JWT | super_admin | Full deployment mgmt |
| POST | `/api/saas/deployments/check-subscriptions` | JWT | super_admin | |
| POST | `/api/saas/deployments/check-all-health` | JWT | super_admin | |

### I3 Env Vars

| Var | Required | Notes |
|-----|----------|-------|
| `SAAS_JWT_SECRET` | yes | JWT signing key |
| `CAPTCHA_SECRET` | no | Defaults to SAAS_JWT_SECRET+_captcha |
| `SMTP_*` | for email | email-credentials feature |
| `GOOGLE_CLOUD_PROJECT` | for deploy | GCP project ID. Staging: `techcross-saas-staging`. Set in .env. |
| `GCP_REGION` | no | Default europe-west3 |
| `SECRET_MANAGER_DRY_RUN` | no | If 'true' (or `DRY_RUN`), Secret Manager ops return mock references. No GCP calls. |
| `DRY_RUN` | no | Alias for SECRET_MANAGER_DRY_RUN. |
| `ALLOW_LEGACY_SIGNUP` | no | If 'true', signups without mongoUri are accepted (dev/test mode). Default/false rejects legacy signups. Production must set to false or unset. |

### I4 DB Collections — StoreFlow Admin Database

StoreFlow Admin MongoDB stores **metadata only** — never customer POS data.

| Collection | Contents | Customer Data? |
|-----------|----------|----------------|
| `saasusers` | StoreFlow admin users, store owners, staff accounts | No — StoreFlow auth only |
| `storesignups` | Pending/approved/rejected signups | Signup metadata only |
| `saastores` | Store name, owner, contact, settings | Store profile only |
| `saadeployments` | Deployment records, config, secrets (encrypted), audit | MongoDB URI (secret), no POS data |
| `saadeploymentaudits` | Audit log entries | No |

Customer POS data (sales, VAT, invoices, inventory, customers) lives in **customer-owned MongoDB Atlas** — never in StoreFlow Admin DB.

Deployment model fields:
- `status` enum: `pending`, `deploying`, `running` (=active), `suspended`, `failed`, `readonly_frozen`
- `subscriptionStatus` enum: `trial`, `active`, `expired`, `readonly_frozen`, `suspended`, `deleted`
- Note: code uses `running` for operational status, conceptually = `active`. `deleted` only in subscriptionStatus, never in status.

### I5 Key Utils

| File | Status | Notes |
|------|--------|-------|
| `utils/captcha.js` | active | HMAC-signed math CAPTCHA, 5-min TTL |
| `utils/gcp-admin.js` | **STUB** | 8 placeholder functions. Real GCP ops require `google-auth-library` + GCP service account credentials. NO auto-deploy without explicit approval. |
| `utils/deployment-security.js` | active | `verifyActionCode`, `recordAudit`, timezone utilities |
| `utils/gcp-secret-manager.js` | active (dry-run) | T21c — wraps Google Cloud Secret Manager. Dry-run via `SECRET_MANAGER_DRY_RUN=true`. Production requires `@google-cloud/secret-manager` package (NOT in package.json — see L8). |

### I6 Store Creation Flow — Required Fields

Store signup and approval must collect:

| Field | Source | Required | Stored In |
|-------|--------|----------|-----------|
| Store name | Customer | yes | StoreSignup → SaaStore |
| Owner name | Customer | yes | StoreSignup → SaaStore |
| Owner email | Customer | yes | StoreSignup → SaaStore |
| Phone | Customer | yes | StoreSignup → SaaStore |
| Country | Customer | yes | StoreSignup → SaaStore |
| Timezone | Customer | yes | SaaDeployment |
| Currency | Customer | yes | SaaDeployment |
| Business type | Customer | yes | StoreSignup → SaaStore |
| MongoDB Atlas URI | Customer | yes | SaaDeployment (secret) |
| Deployment PIN | Customer | yes | SaaDeployment.pinHash (bcrypt) |
| Subscription plan | StoreFlow Admin | yes | SaaDeployment |
| Expiry date / trial length | StoreFlow Admin | yes | SaaDeployment |

Current signup model (StoreSignup) and store creation flow do NOT yet collect timezone, currency, MongoDB URI, or deployment PIN. These must be added in future work (see T20).

### I7 MongoDB URI Validation Rules

Before deployment, StoreFlow must validate customer-provided MongoDB Atlas URI:

1. URI format matches MongoDB / MongoDB Atlas connection string pattern.
2. Can connect (serverSelectionTimeoutMS ≤ 5000).
3. Can read and write to selected database.
4. Does NOT point to Main POS database (`techcross` or configured `STORE_NAME`).
5. Does NOT point to StoreFlow Admin database (`saas_*` or configured `SAAS_DB_NAME`).
6. Does NOT use localhost / 127.0.0.1 / 0.0.0.0 for customer deployment.
7. Database name is present in URI or safely assigned default.
8. Connection failure blocks deployment — never deploy with unverified URI.

Validation must happen during store approval and each deployment update.

### I8 Data Safety Rules

Freeze, suspend, or delete deployment actions affect **StoreFlow service access only**:

| Action | Service (Cloud Run) | Customer MongoDB |
|--------|---------------------|------------------|
| Freeze (readonly_frozen) | Writes disabled, reads OK | Untouched |
| Suspend (scale to 0) | Service stopped | Untouched |
| Delete deployment | Service destroyed | Untouched |
| Cancel subscription | Marked in StoreFlow Admin | Untouched |
| Destroy (full removal) | Service destroyed, metadata removed | Untouched |

No StoreFlow action deletes, modifies, or accesses customer MongoDB Atlas data for purposes beyond running the POS application.

## §V Invariants

V1. SaaSUser collection never mixed with InvUser. Separate Mongoose model, separate collection.
V2. `super_admin` role immune to disable/delete (Lee087 always active).
V3. CAPTCHA mandatory on login — no bypass.
V4. Login rate-limited: 10 attempts/hour/IP. Lockout after 5 failures.
V5. Signup email dedup: pending signup same email → idempotent 200 (not 409).
V6. Store delete requires store timezone HHMM + deployment PIN + reason + audit log. Requires linked Deployment with pinHash. No PIN → delete blocked.
V7. Subscription expiry + grace period → auto-freeze to `readonly_frozen`. Freeze only affects StoreFlow service access (writes blocked). Customer MongoDB Atlas data untouched.
V8. All deploy dangerous actions (suspend/activate/freeze/rollback/destroy) require HHMM+PIN + reason + audit log.
V9. Impersonation token scoped: role=super_admin, storeId set, 24h expiry.
V10. No password returned in API responses (except reset/email-credentials).
V11. `Store` model `.select()` excludes `mongoUri` from non-deploy responses.
V12. Customer MongoDB Atlas data is never deleted by StoreFlow actions. Freeze/suspend/delete affects only StoreFlow service layer.
V13. StoreFlow Admin DB never stores customer POS data (sales, VAT, invoices, customers, inventory). Only metadata (store name, deployment config, audit logs).
V14. MongoDB URI validation required before every deployment. Invalid/unreachable/forbidden URI blocks deployment.
V15. One customer deployment = one Cloud Run service + one customer MongoDB database. No shared database architecture.
V16. Secret version pinning: production must never use "latest" version. Every production Secret Manager retrieval must use a pinned numeric version ID. Dry-run mode uses "dry-run-N" format. Code path must reject or warn on "latest" (see gcp-secret-manager.js:111).
V17. Production gate: ALLOW_LEGACY_SIGNUP must be 'true' to accept signups without mongoUri. Default (unset or 'false') rejects legacy signups, enforcing customer-owned Atlas requirement.

## §T Tasks

| id | status | task | cites |
|----|--------|------|-------|
| T1 | x | Create models/saas/ (5 models) | V1 |
| T2 | x | Create utils/captcha.js | V3 |
| T3 | x | Create utils/gcp-admin.js (STUB — no real GCP credentials) | I3 |
| T4 | x | Create bootstrap-saas.js | V2 |
| T5 | x | Create SaaS login page HTML | I1 |
| T6 | x | Create SaaS register page HTML | I1 |
| T7 | x | Create SaaS dashboard page HTML | I1 |
| T8 | x | Create SaaS admin page HTML | I1 |
| T9 | x | Create SaaS deploy admin page HTML | I1 |
| T10 | x | Create auth API route | V3,V4 |
| T11 | x | Create signup API route | V5 |
| T12 | x | Create stores API route | V6,V9,V10 |
| T13 | x | Create deployments API route | V7,V8,V11 |
| T14 | x | Write lang.js i18n keys | I1 |
| T15 | x | Wire routes in server.js | I2 |
| T16 | x | Run E2E test | all |
| T17 | x | Create saas-e2e-test.js | T16 |
| T18 | x | Create test store StoreFlow Test Shop | all |
| T19 | ~ | Create StoreFlow POS pages (pos, products, transactions, close) | I1 |
| T19a | x | Slice 1: POS test shell single page (products CRUD, transactions, summary, freeze) | C17-C22 |
| T19b | . | Slice 2: Products management page | I1 |
| T19c | . | Slice 3: Transactions + Daily Close pages | I1 |
| T20 | x | Add customer MongoDB Atlas URI + timezone + currency + deployment PIN to signup flow | C23-C44, I6 |
| T21 | x | Implement MongoDB URI validation before deployment (see I7) | C33, I7, V14 |
| T21a | x | Build MongoDB URI validator (utils/mongo-uri-validator.js) | I7 |
| T21b | x | Wire URI validation into approve and deploy routes | V14 |
| T21c | x | Secret Manager integration for MongoDB URI storage | C34, V16 |
| T21d | x | Add Deployment.storeId for stable store lookup | C21, L6 |
| T21e | x | Production gate: ALLOW_LEGACY_SIGNUP flag rejects legacy signups without mongoUri | C23-C44 |

## §L Limitations

| # | Area | Limitation | Impact |
|---|------|-----------|--------|
| L1 | GCP deploy | `utils/gcp-admin.js` is a STUB. No real Cloud Run deployment, build triggering, traffic switching, or env variable updates. | `POST /api/saas/deployments/:id/deploy` and related routes create DB records but do NOT actually deploy. Deployment functionality is test-only until real GCP credentials are configured. |
| L2 | Status vocab | Model status uses `running` not `active`. These are semantically equivalent. No migration planned unless needed. | Cosmetic inconsistency between code and docs. No functional impact. |
| L3 | Test robustness | E2E test prints full body (not first 200 chars) on JSON parse failure. Body can be very large for HTML. | Minor — no impact on pass/fail correctness. |
| L4 | Subscription | Auto-freeze cron for expired subscriptions not implemented. Requires external scheduler (cron job / Cloud Scheduler). | Subscriptions expire per deployment records but no auto-freeze trigger exists. Manual enforcement only. |
| L5 | Staff test | POS staff role gate (writeRoleGate) tested at middleware code level only. No end-to-end test: staff user provisioning endpoint does not exist yet. | Staff write-blocked status not verified via E2E. |
| L6 | Deploy lookup | Legacy deployments may lack `storeId`. freezeGate and `delete` routes prefer `storeId` lookup, fallback to `storeName` | Run `scripts/backfill-deployment-store-id.js --apply` to populate storeId on legacy records. After backfill, all deployments have stable storeId link.
| L7 | Signup flow | Current signup/approve flow does NOT collect timezone, currency, MongoDB Atlas URI, or deployment PIN. StoreSignup model lacks these fields. | Store creation requires manual enrichment after approval. T20 tracks this gap.
| L8 | Secret Manager dependency | Production Secret Manager requires `@google-cloud/secret-manager` package. **Now installed.** ADC (`gcloud auth application-default login`) required for Node.js client to work. | Set `GOOGLE_CLOUD_PROJECT=techcross-saas-staging` in .env. Run `gcloud auth application-default login` for local dev ADC. |

## §R Readiness

T19 (StoreFlow POS pages) is **safe to start**. Foundation verified:

- All E2E tests pass (13/13)
- No Main POS files touched
- CAPTCHA login works correctly
- V6 store delete uses HHMM+PIN+reason+audit (same standard as deployment actions)
- Deployment dangerous actions use verifyActionCode (HHMM+PIN+reason+audit)
- gcp-admin.js status documented (STUB)
- Status vocabulary documented
- Known limitations documented in §L

### T21c acceptance gate (2026-05-13): 9-point report below. T21c is CONDITIONALLY ACCEPTED with one blocker.

**51/51 checks passed — gate passed.**

| Check | Result | Detail |
|-------|--------|--------|
| Files changed | 5 created, 1 modified | No Main POS files |
| Import isolation | CLEAN | No models/inv, services/inv, utils/inv in POS route |
| storeId isolation | PASS | Fake storeId in body ignored. JWT storeId used. Verified by JWT decode. |
| readonly_frozen real test | PASS | Deployment set to readonly_frozen → reads 200, writes 403. Restored → writes 201. |
| POS page route | PASS | /saas/pos.html 200, /saas/pos.js 200, uses saas_token only |
| SaaS E2E | PASS | 13/13 passed |
| POS smoke | PASS | 14 sub-checks: CRUD, soft delete, validation, summary |
| Main POS smoke | PASS | 6 checks: landing, /api/inv, brands, pricing, health |
| Staff E2E limitation | NOT TESTED | No staff provisioning endpoint. writeRoleGate verified at code level. |
| Deployment.storeId TODO | DOCUMENTED | C21 updated with workaround description. L6 added. |

### Real Secret Manager Validation — staging (2026-05-13)

Validated against `techcross-saas-staging` via gcloud CLI. All 8 phases pass.

| Phase | Operation | Result |
|-------|-----------|--------|
| 1 | Create secret with labels | PASS |
| 2 | Add version 1 (test URI) | PASS |
| 3 | Retrieve version 1, verify content match | PASS |
| 4 | Add version 2 (updated test URI) | PASS |
| 5 | Retrieve version 2, verify content match | PASS |
| 6 | Old version (v1) still accessible | PASS |
| 7 | "latest" pointer moves to newest | PASS |
| 8 | Version pinning — v1 unchanged after v2 added | PASS |

ADC setup required for Node.js client library:
```
gcloud auth application-default login
```

Test script: `scripts/test-secret-manager-real.js` (requires ADC)
Service account permissions: `roles/secretmanager.secretAccessor` per customer secret

### T21d Deployment.storeId Migration (2026-05-13)

| Check | Result |
|-------|--------|
| Model field storeId added | PASS — ObjectId ref SaaStore, indexed, optional |
| stores.js approve sets storeId on new deployments | PASS — `storeId: store._id` in depFields |
| stores.js delete prefers storeId lookup | PASS — `$or: [{storeId}, {storeName}]` |
| deployments.js POST accepts optional storeId | PASS — `storeId: storeId \|\| undefined` |
| pos.js freezeGate prefers storeId | PASS — tries `storeId` first, falls back `storeName` |
| pos.js /status prefers storeId | PASS — same pattern |
| Backfill script exists | PASS — scripts/backfill-deployment-store-id.js, dry-run by default |
| Unit tests pass | 3/3 — schema field, optionality, storeName still required |
| Pre-existing test delta | 488 pass, 53 skip (same pre-existing 3 integration failures) |
| Main POS touched | NO |
| L6 updated | PASS — now documents legacy fallback + backfill script |

| id | date | cause | fix |
| B1 | 2026-05-13 | @google-cloud/secret-manager missing from package.json | npm install @google-cloud/secret-manager before production Secret Manager enable |
| B2 | 2026-05-13 | Deployment.storeId migration — stable store lookup | storeId field added to model; approve flow sets storeId; freezeGate/delete prefer storeId, fallback to storeName. Backfill script: scripts/backfill-deployment-store-id.js. |
