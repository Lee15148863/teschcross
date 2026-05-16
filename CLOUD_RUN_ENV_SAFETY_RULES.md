# Cloud Run Env Safety Rules

> Created: 2026-05-16
> Applies to: teschcross-git (Main POS) and all StoreFlow tenant services
> Reference: DEPLOYMENT_SAFETY_RULES.md

---

## Incident Summary

| Field | Detail |
|-------|--------|
| Date | 2026-05-16 |
| Service | teschcross-git (Main POS) |
| Broken revision | teschcross-git-00348-rmx |
| Recovery revision | teschcross-git-fixjwt |
| Symptom | Main POS login returned "服务器错误" / HTTP 500 for correct credentials |
| Bad credentials | Returned 401 — smoke test did NOT catch the bug |
| Root cause | `INV_JWT_SECRET` and `SAAS_JWT_SECRET` missing from active revision env vars |
| Error | `secretOrPrivateKey must have a value` (thrown by `jwt.sign`) |
| Impact | All valid users unable to log in to Main POS |
| Recovery | Restored missing JWT secrets from known-good revision; deployed fixjwt; switched traffic |

---

## Why Bad Credentials Test Was Not Enough

The login flow follows this order:

1. Rate limiter check
2. Username/password validation (empty check)
3. User lookup in MongoDB
4. **bcrypt.compare(password, hash)** — fails here for wrong password → 401
5. **jwt.sign(payload, process.env.INV_JWT_SECRET)** — reached only if bcrypt passes

If `INV_JWT_SECRET` is `undefined`, step 5 throws `secretOrPrivateKey must have a value` → **500 Server Error**.

A bad-credential smoke test stops at step 4 and returns 401 — it never reaches step 5. Therefore:

> **A bad-credential-only login test is insufficient to verify login health.**

---

## Hard Rules

### Rule 1: Never use `--set-env-vars` on production Cloud Run

`--set-env-vars` replaces ALL env vars. If the replacement list is incomplete, required keys are dropped silently. Use `--update-env-vars` for single-key changes, and verify all required keys remain afterward.

### Rule 2: Treat `--update-env-vars` as high risk

Even `--update-env-vars` has been observed to drop unrelated env vars in this project. Always check env keys before and after.

### Rule 3: Never update secrets via casual gcloud command

`DBCon`, `INV_JWT_SECRET`, `SAAS_JWT_SECRET`, `INV_AUDIT_KEY`, and any other secret must never be updated via ad-hoc `gcloud run services update --update-env-vars`. Use the existing Cloud Build / gcp-admin.js deployment path if possible.

### Rule 4: Never print secrets

Never print Mongo URI, JWT, secret values, or passwords in logs, commit messages, diffs, or terminal output.

### Rule 5: Always check required env keys before and after deploy

After any Cloud Run deploy or env update, verify all required keys are SET (not MISSING). See the checklist below.

### Rule 6: Update only the intended key

If an env var update is unavoidable, update exactly one key and verify all other required keys remain SET.

### Rule 7: Prefer Cloud Build / gcp-admin.js path

The `scripts/deploy-tenant-store.js` → `gcp-admin.js` → Cloud Build API path has been more reliable at preserving env vars than direct `gcloud` CLI commands.

### Rule 8: Protect mongodb+srv URI

The `+` character in `mongodb+srv://` is destroyed by gcloud CLI sanitization (`+` → `_`). Never pass MongoDB URI through gcloud env var flags. Use Cloud Build API deploy which preserves the URI correctly.

### Rule 9: Login regression test required

Any deployment touching `server.js`, `api/inv/auth.js`, middleware, Cloud Run env, or deployment scripts requires full login regression testing (see Post-Deploy Smoke Test below).

### Rule 10: Production recovery — rollback first

If Main POS login returns 500 after any change:
1. Stop all new development immediately
2. Check active revision and env keys
3. Check Cloud Run logs for auth errors
4. Shift traffic back to last verified revision
5. Do NOT debug by modifying VAT, checkout, CashLedger, reports, or DB data

---

## Required Env Keys Checklist

### Main POS (teschcross-git)

| Key | Required | Notes |
|-----|----------|-------|
| DBCon | YES | MongoDB URI — must contain `mongodb+srv://` (not `mongodb_srv://`) |
| STORE_NAME | YES | Database name, typically `techcross` |
| INV_JWT_SECRET | YES | POS login JWT signing secret |
| SAAS_JWT_SECRET | YES | SaaS SSO token verification secret |
| INV_AUDIT_KEY | YES | Audit log signing key |
| STOREFLOW_STORE_ID | **NO** | Must be MISSING — only for tenant services |
| STOREFLOW_TENANT_STATUS | **NO** | Must be MISSING — only for tenant services |
| DOMAIN | Optional | Defaults to techcross.ie |
| COMPANY_NAME | Optional | Store display name |

### StoreFlow Tenant Services

| Key | Required | Notes |
|-----|----------|-------|
| DBCon | YES | Customer MongoDB URI |
| STORE_NAME | YES | Must match MongoDB database name (from URI, not serviceName) |
| INV_JWT_SECRET | YES | Per-tenant JWT secret (generated at deploy) |
| SAAS_JWT_SECRET | YES | For SSO token verification |
| INV_AUDIT_KEY | YES | Per-tenant audit key |
| STOREFLOW_STORE_ID | YES | SaaS Store._id for SSO store scoping |
| STOREFLOW_TENANT_STATUS | Optional | `active` / `suspended` / `frozen` (once implemented) |
| STORE_FROZEN | Optional | `true` / `false` — read-only mode |
| DOMAIN | Optional | |
| COMPANY_NAME | Optional | |

---

## Required Post-Deploy Smoke Test

### Main POS (every deploy)

1. `GET /api/health` → `mongo:1`
2. `GET /inv-login.html` → HTTP 200
3. `POST /api/inv/auth/login` with bad credentials → HTTP **401** (NOT 500, NOT 403, NOT HTML)
4. **User manually confirms correct login succeeds** (or automated test with known test account)
5. Login failure must not contain `secretOrPrivateKey must have a value`
6. `GET /inv-pos.html` → HTTP 200 (after login)
7. `GET /api/inv/products` with valid auth → HTTP 200
8. No secrets leaked in logs, diffs, or responses

### Tenant Store (every deploy)

1. `GET /api/health` → `mongo:1`
2. Staff login works (correct credentials → token)
3. SSO fresh token (≤120s) → auto-login success
4. Expired SSO token (>120s) → rejected
5. `GET /api/inv/products` with valid auth → HTTP 200
6. Clean tenant counts remain 0 (no data copied from techcross)
7. No secrets leaked

---

## Rollback Protocol

### If Main POS login returns 500 after deploy:

```
1. STOP — do not push more code, do not modify DB
2. Identify active revision:
   gcloud run services describe teschcross-git --region=europe-west1
3. Check env keys:
   gcloud run revisions describe <rev> --region=europe-west1 | check SET/MISSING
4. Check Cloud Run logs for auth error:
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=teschcross-git AND severity>=ERROR"
5. If env keys missing → restore from known-good revision and redeploy
6. If revision regression → shift traffic to last verified revision:
   gcloud run services update-traffic teschcross-git --region=europe-west1 --to-revisions <good-revision>=100
7. Verify smoke test items 1-5
8. Never debug by touching VAT, checkout, CashLedger, reports, or DB data
```

### If tenant service login returns 500:

1. Same protocol as Main POS
2. Additionally verify STOREFLOW_STORE_ID is set
3. Verify STOREFLOW_TENANT_STATUS is not suspended/frozen unless intended
4. Check clean tenant counts

---

## Known Revisions

### Main POS (teschcross-git)

| Revision | Status | Env | Mongo | Notes |
|----------|--------|-----|-------|-------|
| **teschcross-git-fixjwt** | **ACTIVE** | INV_JWT_SECRET: SET, DBCon: SET | 1 | Current recovery revision, has buyin-receipt code |
| teschcross-git-00348-rmx | BROKEN | INV_JWT_SECRET: MISSING, SAAS_JWT_SECRET: MISSING | 1 (was) | Created by faulty `--update-env-vars` |
| teschcross-git-buyin-v2 | OLD | All env: SET | 0 (was) | Has buyin-receipt code, mongo intermittent |
| teschcross-git-00335-pjx | ROLLBACK | All env: SET | 0 (during rollback) | Pre-buyin-receipt, Atlas IP issue during rollback |

### Test Tenant (storeflow-test-mainpos)

| Revision | Status | Notes |
|----------|--------|-------|
| **storeflow-test-mainpos-reconnect2** | ACTIVE | mongo:1, buyin-receipt code |
| storeflow-test-mainpos-00026-9rz | ROLLBACK | Pre-transaction-records addition |

---

## Optional Safety Scripts (Suggested, Not Implemented)

These scripts could be added to prevent future env-related incidents:

### scripts/check-cloudrun-env-keys.js

Reads all env keys from a Cloud Run revision and reports SET/MISSING against the required checklist. Does not print values.

Usage:
```
node scripts/check-cloudrun-env-keys.js teschcross-git europe-west1
node scripts/check-cloudrun-env-keys.js storeflow-test-mainpos europe-west1
```

### scripts/smoke-main-pos-login.js

Performs a complete login smoke test against Main POS:
- Bad credentials → expect 401
- If a test account is configured, correct credentials → expect token
- Checks that login errors do not contain `secretOrPrivateKey`
- Reports pass/fail without printing any secrets

Usage:
```
node scripts/smoke-main-pos-login.js
```

### scripts/smoke-tenant-pos.js

Performs the tenant-specific smoke test:
- Health check → mongo:1
- Staff login works
- SSO token exchange works
- SSO token expiry enforced
- Clean tenant counts verified

Usage:
```
node scripts/smoke-tenant-pos.js <service-url>
```

**Do NOT implement these scripts unless explicitly approved.**
