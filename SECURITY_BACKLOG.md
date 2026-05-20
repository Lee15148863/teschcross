# Security Backlog

Items deferred from Codex review. Do NOT fix in passing — each needs a dedicated plan.

## 1. Secret Rotation

**What:** `gcloud run services describe --format=yaml` once printed DBCon, INV_JWT_SECRET, SAAS_JWT_SECRET, INV_AUDIT_KEY to stdout.

**Risk:** Secrets exposed in session transcript.

**Status:** Needs planned rotation. Must ensure Cloud Run / tenant / JWT session continuity. Do NOT rotate ad-hoc.

## 2. Tenant Deploy Secrets via --set-env-vars

**File:** `utils/gcp-admin.js`

**What:** `triggerDeployBuild()` passes MongoDB URI via `--set-env-vars` in Cloud Build inline steps.

**Fix:** Migrate to Secret Manager / `--set-secrets` / safer deploy API.

**Status:** Deferred. Current production tenant uses manual deploy, not affected.

## 3. updateServiceEnv Helper Risk

**What:** `utils/gcp-admin.js` updateServiceEnv may wipe env vars or have unsafe command construction.

**Fix:** Audit argument escaping, add dry-run, restrict to non-production.

**Status:** Deferred.

## 4. Pricing Page Stored XSS

**File:** `pricing.html`

**What:** Uses `innerHTML` to render brand/model/issue data without escaping.

**Fix:** Add `textContent` or HTML entity encoding.

**Status:** Deferred. Do NOT modify pricing data or display values.

## 5. Transaction Export Granular Permission

**File:** `api/inv/transactions.js`

**What:** `/transactions/export` needs explicit permission check.

**Status:** Deferred.

## 6. Transaction Delete Audit

**What:** Transaction deletion needs audit trail logging.

**Status:** Deferred. Do NOT change financial calculation or CashLedger.

## 7. Edit-Items Financial Correction Risk

**What:** `edit-items` can recalculate transaction totals/VAT.

**Fix:** Add permission guard, audit log, daily-close lock check.

**Status:** Deferred. High risk — do NOT touch without explicit plan.

## 8. Production Trigger Strategy

**Current:**
- Main push: NO deploy trigger
- Staging trigger: cloudbuild-staging.yaml ready, GitHub connection needed
- Production tag trigger: NOT enabled

**Status:** Staging trigger can be activated. Production tag trigger deferred until further review.

## 9. 58/60mm Receipt Support

**What:** Only 80mm thermal receipt printing optimized. 58/60mm auto-adapt deferred.

**Fix:** Future: printer width profiles, auto-detect, multi-width CSS.

**Status:** Deferred. 80mm with 4ch gutter is current production standard.

## 10. BYO MongoDB Secure Activation

**What:** Raw MongoDB URI is stored in `StoreSignup.mongoUri` (select:false). Full BYO activation flow not implemented.

**Fix:** Migrate to Secret Manager for raw URI storage. Validate URI connectivity and permissions. Store only secret reference in Store/Deployment. Build admin verification flow for BYO requests. Migration path for any existing raw URIs.

**Current state (2026-05-20):** Signup allows BYO request with databasePreference='byo'. Raw URI stored in StoreSignup with select:false (not returned in API). Approval creates Store as managed by default. BYO activation requires admin verification. Managed DB remains default for all stores.

**Status:** Deferred. Managed DB is production default. BYO full activation pending.
