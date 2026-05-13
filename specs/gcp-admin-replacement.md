# gcp-admin.js — Real Implementation SPEC

Replace stub at `utils/gcp-admin.js` with real GCP API calls.
Independent Cloud Run service per customer. One customer = one service.
All operations scoped to customer-specific service — never touches Main POS.

## §G Goal

Each StoreFlow customer gets an independent Cloud Run service running StoreFlow POS, connected to their own MongoDB Atlas. gcp-admin.js handles the full lifecycle: build, deploy, traffic, scale, and teardown — all scoped per customer service.

## §R Required APIs

Enable in GCP project (`techcross-saas-staging`):

| API | Purpose |
|-----|---------|
| `run.googleapis.com` | Cloud Run admin |
| `cloudbuild.googleapis.com` | Build container images |
| `artifactregistry.googleapis.com` | Store container images |
| `secretmanager.googleapis.com` | Customer MongoDB URIs |
| `iamcredentials.googleapis.com` | Service account tokens |
| `cloudresourcemanager.googleapis.com` | Project metadata |

gcloud:
```
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com iamcredentials.googleapis.com
```
(secretmanager already enabled)

## §I IAM Roles

### Deployment service account (one per customer)

Each customer Cloud Run service runs under its own service account.
Scoped to that customer's secret and Cloud Run service only.

| Role | Resource | Why |
|------|----------|-----|
| `roles/secretmanager.secretAccessor` | Customer-specific secret | Access pinned MongoDB URI version |
| `roles/run.viewer` | Customer-specific service | Read own service status |

gcloud per-customer SA:
```
gcloud iam service-accounts create "saas-{serviceName}" \
  --display-name="StoreFlow {storeName} SA"

gcloud secrets add-iam-policy-binding "storeflow-mongo-{sanitized-name}" \
  --member="serviceAccount:saas-{serviceName}@techcross-saas-staging.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud run services add-iam-policy-binding "{serviceName}" \
  --member="serviceAccount:saas-{serviceName}@techcross-saas-staging.iam.gserviceaccount.com" \
  --role="roles/run.viewer"
```

### Admin (super admin) service account

Used by StoreFlow backend (server.js) to manage all customer services.

| Role | Scope | Why |
|------|-------|-----|
| `roles/run.admin` | Project | Deploy, update, suspend all services |
| `roles/cloudbuild.builds.editor` | Project | Trigger builds |
| `roles/artifactregistry.writer` | Project | Push container images |
| `roles/iam.serviceAccountUser` | Customer SA | Deploy as customer SA |
| `roles/secretmanager.admin` | Project | Create secrets, set IAM |

gcloud:
```
gcloud iam service-accounts create "storeflow-admin" \
  --display-name="StoreFlow Admin"

gcloud projects add-iam-policy-binding techcross-saas-staging \
  --member="serviceAccount:storeflow-admin@techcross-saas-staging.iam.gserviceaccount.com" \
  --role="roles/run.admin" \
  --role="roles/cloudbuild.builds.editor" \
  --role="roles/artifactregistry.writer" \
  --role="roles/iam.serviceAccountUser" \
  --role="roles/secretmanager.admin"
```

Service account key for storeflow-admin → GOOGLE_APPLICATION_CREDENTIALS.

## §F Functions

### F1 — triggerDeployBuild(projectId, region, serviceName, storeName, mongoUri, env, gitCommit)

**Purpose**: Trigger Cloud Build to build StoreFlow POS from source and deploy to Cloud Run.

**Inputs**:
- `projectId` — GCP project
- `region` — Cloud Run region (default europe-west3)
- `serviceName` — unique per customer, used as Cloud Run service name
- `storeName` — human-readable, used in labels
- `mongoUri` — resolved MongoDB URI (from Secret Manager or plaintext)
- `env` — key-value env vars for Cloud Run
- `gitCommit` — commit SHA for reproducible builds

**Process**:
```
POST https://cloudbuild.googleapis.com/v1/projects/{projectId}/builds
```

Build config (submitted dynamically):
```yaml
steps:
- name: gcr.io/cloud-builders/docker
  args: [build, -t, {region}-docker.pkg.dev/{projectId}/storeflow/{serviceName}:{gitCommit}, .]
- name: gcr.io/cloud-builders/docker
  args: [push, {region}-docker.pkg.dev/{projectId}/storeflow/{serviceName}:{gitCommit}]
- name: gcr.io/google.com/cloudsdktool/cloud-sdk
  entrypoint: gcloud
  args:
  - run
  - deploy
  - {serviceName}
  - --image={region}-docker.pkg.dev/{projectId}/storeflow/{serviceName}:{gitCommit}
  - --region={region}
  - --platform=managed
  - --service-account=saas-{serviceName}@{projectId}.iam.gserviceaccount.com
  - --set-env-vars=MONGO_URI={mongoUri},STORE_NAME={storeName},{env}
  - --no-cpu-throttling
  - --concurrency=80
  - --timeout=300
  - --labels=app=storeflow,store={storeName},managed-by=storeflow-saas
  - --no-cpu-throttling
options:
  machineType: E2_HIGHCPU_8
timeout: 600s
```

**Output**: `{ buildId: string, imageTag: string }`

**Failure**: If Cloud Build API rejects (bad config, quota) → throw. If build submitted but later fails → handled by polling (F2).

**Notes**:
- NEVER pass --clear-env-vars (would wipe MONGO_URI).
- NEVER log mongoUri. Log only `[gcp-admin] deploy {serviceName} build {buildId}`.
- Service name = customer subdomain, already sanitized by route.
- Image tag = `{region}-docker.pkg.dev/{projectId}/storeflow/{serviceName}:{gitCommit}`.

**gcloud equivalent**:
```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME="{serviceName}",_STORE_NAME="{storeName}",_MONGO_URI="***",_GIT_COMMIT="{gitCommit}"
```

### F2 — getBuildStatus(projectId, buildId)

**Purpose**: Poll Cloud Build status after triggering.

**API**:
```
GET https://cloudbuild.googleapis.com/v1/projects/{projectId}/builds/{buildId}
```

**Output**:
```js
{
  status: 'QUEUED' | 'WORKING' | 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'CANCELLED' | 'INTERNAL_ERROR',
  failureInfo: { detail: string } | null
}
```

**Polling**: Called by pollBuildStatus loop in deployments.js (every 5s, max 60 attempts = 5 min).

**Failure**: Non-terminal statuses are ongoing. Terminal statuses SUCCESS/FAILURE/TIMEOUT etc.

**gcloud equivalent**:
```bash
gcloud builds describe {buildId} --format="json(status,failureInfo)"
```

### F3 — getServiceUrl(projectId, region, serviceName)

**Purpose**: Get Cloud Run service URL after deploy succeeds.

**API**:
```
GET https://run.googleapis.com/v1/projects/{projectId}/locations/{region}/services/{serviceName}
```

**Output**: URL string or empty string.

**Failure**: Service not found → return empty string (not throw). Other errors → throw.

**gcloud equivalent**:
```bash
gcloud run services describe {serviceName} --region={region} --format="value(status.url)"
```

### F4 — getLatestReadyRevision(projectId, region, serviceName)

**Purpose**: Get the latest ready revision name for traffic switching or rollback.

**API**:
```
GET https://run.googleapis.com/v1/projects/{projectId}/locations/{region}/services/{serviceName}
```

Parse `status.traffic` for revision with `latestReady: true` (or filter `status.traffic` entries where `percent > 0` and `revision` exists). Get the revision name.

If `status.latestReadyRevisionName` exists in newer API, use that directly.

**Output**: Revision name string (e.g., `{serviceName}-00001-abc`), or empty string if none ready.

**Failure**: Service not found → throw.

**gcloud equivalent**:
```bash
gcloud run services describe {serviceName} --region={region} \
  --format="value(status.latestReadyRevisionName)"
```

### F5 — listRevisions(projectId, region, serviceName)

**Purpose**: List all revisions for a service, used by rollback UI to show available targets.

**API**:
```
GET https://run.googleapis.com/v1/projects/{projectId}/locations/{region}/revisions?filter=metadata.annotations['serving.knative.dev/service']={serviceName}
```

**Output**:
```js
{
  revisions: [
    {
      name: string,          // full resource name
      revisionName: string,  // short name only
      image: string,
      created: timestamp,
      serving: boolean,
      status: string        // 'Ready' | 'Unknown' | 'Failed'
    }
  ]
}
```

**Pagination**: Default max 100 revisions. No pagination needed for expected scale (<20 revisions per service).

**Failure**: Any API error → throw.

**gcloud equivalent**:
```bash
gcloud run revisions list --service={serviceName} --region={region} \
  --format="table(metadata.name,spec.containers[0].image,status.conditions[0].status)"
```

### F6 — switchTraffic(projectId, region, serviceName, revisionName, percent)

**Purpose**: Route traffic percentage to a specific revision. Used for rollback (100% to old revision).

**API**:
```
PATCH https://run.googleapis.com/v1/projects/{projectId}/locations/{region}/services/{serviceName}
```

Patch body:
```json
{
  "spec": {
    "traffic": [
      { "revisionName": "{revisionName}", "percent": {percent} },
      { "latestReadyRevision": true, "percent": {100 - percent} }
    ]
  }
}
```

For full rollback: `percent=100`, `latestReadyRevision: true` gets 0%.

**Output**: Updated service object (full response from API).

**Failure**:
- Revision doesn't exist → throw "Revision {name} not found"
- Invalid percent → throw "Percent must be 0-100"
- API auth error → throw

**Safety**: Must verify revision exists (from F5 or known in versions list) before switching traffic. The calling route already does this check via versions history.

**gcloud equivalent**:
```bash
gcloud run services update-traffic {serviceName} --region={region} \
  --to-revisions={revisionName}=100
```

### F7 — suspendService(projectId, region, serviceName)

**Purpose**: Scale Cloud Run service to 0 instances. Called by suspend route.

**API**:
```
PATCH https://run.googleapis.com/v1/projects/{projectId}/locations/{region}/services/{serviceName}
```

Patch body (minScale + maxScale = 0):
```json
{
  "spec": {
    "template": {
      "metadata": {
        "annotations": {
          "autoscaling.knative.dev/minScale": "0",
          "autoscaling.knative.dev/maxScale": "0"
        }
      }
    }
  }
}
```

**Output**: Updated service object.

**Failure**: Service not found or already deleted → throw.

**gcloud equivalent**:
```bash
gcloud run services update {serviceName} --region={region} --min-instances=0 --max-instances=0
```

**Note**: This replaces inline patch body construction in deployments.js:657-671.

### F8 — activateService(projectId, region, serviceName)

**Purpose**: Restore Cloud Run service scaling (min=0, max=10). Called by activate route.

**API**: Same as F7 but different annotation values.

Patch body:
```json
{
  "spec": {
    "template": {
      "metadata": {
        "annotations": {
          "autoscaling.knative.dev/minScale": "0",
          "autoscaling.knative.dev/maxScale": "10"
        }
      }
    }
  }
}
```

**Output**: Updated service object.

**Failure**: Service not found or subscription expired (checked by route before calling) → throw.

**gcloud equivalent**:
```bash
gcloud run services update {serviceName} --region={region} --min-instances=0 --max-instances=10
```

**Note**: This replaces inline patch body construction in deployments.js:704-711.

### — updateServiceEnv(projectId, region, serviceName, envVars) *(existing, keep)*

Used by freeze/unfreeze to set `STORE_FROZEN=true` or remove it.

**API**: Same PATCH as F7/F8, but modifies `spec.template.spec.containers[0].env`.

Patch for setting env var:
```json
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "{serviceName}",
          "env": [{"name": "STORE_FROZEN", "value": "true"}]
        }]
      }
    }
  }
}
```

Patch for removing env var: pass `value: null` (API treats as removal).

**Failure**: Service not found → throw.

### — getCloudRunService(projectId, region, serviceName) *(existing, keep)*

Used by refresh-status route. Returns full service object.

### — secretEnvVar handling on deploy

When `triggerDeployBuild` builds the Cloud Run deploy command, the mongoUri is passed as `--set-env-vars=MONGO_URI=...`. In production, this URI is the resolved Secret Manager value (pinned version). This is necessary because Cloud Run's env var is how the application finds MongoDB.

**SECURITY**: The deploy command logs are visible in Cloud Build console. Never put the full URI in a publicly accessible location. Cloud Build logs are project-scoped.

**FUTURE**: Consider using `--set-secrets` (Cloud Run Secrets volumes) instead of env var. Not implemented in this slice because it requires rewriting how server.js reads MONGO_URI.

### Dry-run mode

When `GCP_ADMIN_DRY_RUN=true`:
- All functions skip API calls
- triggerDeployBuild returns `{ buildId: 'dry-run-{Date.now()}', imageTag: '{serviceName}:dry-run' }`
- getBuildStatus returns `{ status: 'SUCCESS' }`
- getServiceUrl returns `'https://{serviceName}-dry-run.a.run.app'`
- getLatestReadyRevision returns `'{serviceName}-dry-run-revision'`
- listRevisions returns `{ revisions: [{ name: '{serviceName}/dry-run-revision', ... }] }`
- switchTraffic / suspendService / activateService / updateServiceEnv / getCloudRunService return mock objects
- All operations log `[gcp-admin][DRY-RUN] {functionName}({args})` to console

## §V Version Pinning

**Critical rule**: Cloud Run deploy must reference a pinned secret version, not "latest".

Implementation: Before calling triggerDeployBuild, the deploy route resolves URI via Secret Manager with explicit version:
```js
var resolved = await sm.retrieveMongoUri(secretName, pinnedVersion, projectId);
```
The `pinnedVersion` comes from `dep.mongoUriSecretVersion` (stored when secret was created/updated).

If the secret version changes (URI update), a new deploy must be triggered. The deploy creates a new Cloud Run revision with the new MONGO_URI. Old revisions still reference old MONGO_URI -> rollback to old revision restores old URI.

This means: **rollback = traffic switch only** (no rebuild needed). The old revision still has the old MONGO_URI in its env.

## §E Error Handling

| Scenario | Behavior |
|----------|----------|
| Cloud Build quota exceeded | throw → deploy route marks deployment failed, audit log |
| Cloud Run API 403 | throw → likely IAM misconfiguration, log full error for admin |
| Secret Manager API 403 | handled by retrieveMongoUri in deploy route before gcp-admin called |
| Service not found (suspend/activate) | throw → route returns 404 |
| Revision not found (switchTraffic) | throw → route returns error, audit log |
| Network transient | Let axios/node-fetch retry. Throw if all retries fail. |
| Build submitted but poll times out | pollBuildStatus loop exits (60×5s = 5min). Deployment stays in 'deploying' state. Next deploy attempt triggers stuck-deploy recovery. |

### Retry policy

- Cloud Build triggers: no retry (at-most-once, duplicates are expensive)
- Get/List operations: 2 retries with exponential backoff (1s, 3s)
- Mutating operations (suspend/activate/traffic): no retry (idempotent but caller should decide)

## §L Rollback

Rollback flow (deployments.js:796-878):
1. Admin selects target version from versions history
2. verifyDangerousAction (HHMM+PIN)
3. gcp.switchTraffic(projectId, region, serviceName, targetRevisionName, 100)
4. Audit log records fromRevision, toRevision

**Key constraint**: Rollback switches traffic only — no rebuild. The old revision still has old MONGO_URI in env, which is correct (it matches the original secret version).

**No rollback across URI changes**: If the customer changed their MongoDB URI since the target revision was deployed, rolling back would restore the old URI. This is by design — the customer changed their database, not their URI. (Actually, if they changed their database, rolling back the app without updating the URI is dangerous. Document this as a known limitation for the next iteration.)

## §A Audit Logging

All dangerous operations (deploy, suspend, activate, freeze, rollback) are audited by the calling route via `recordAudit()`. gcp-admin.js itself should not call audit.

gcp-admin.js functions should log operational info at DEBUG level:
```
[gcp-admin] deploy {serviceName} build {buildId}
[gcp-admin] build {buildId} status {status}
[gcp-admin] traffic-switch {serviceName} {revisionName}={percent}%
[gcp-admin] suspend {serviceName}
[gcp-admin] activate {serviceName}
```

Never log mongoUri, secret content, or customer data.

## §T Tests

### Unit tests (vitest, dry-run mode)

| # | Test | Expected |
|---|------|----------|
| 1 | triggerDeployBuild dry-run returns mock buildId | starts with 'dry-run-' |
| 2 | getBuildStatus dry-run returns SUCCESS | true |
| 3 | getServiceUrl dry-run returns mock URL | contains serviceName |
| 4 | getLatestReadyRevision dry-run | contains 'dry-run' |
| 5 | listRevisions dry-run returns array | revisions.length > 0 |
| 6 | switchTraffic dry-run no-op | returns object |
| 7 | suspendService dry-run no-op | returns object |
| 8 | activateService dry-run no-op | returns object |
| 9 | DRY_RUN env var respected | all functions skip API |
| 10 | google-auth-library missing = throw | triggerDeployBuild throws |

### Staging validation

| # | Test | Method |
|---|------|--------|
| 1 | Build triggers | Run triggerDeployBuild on test service, verify buildId returned |
| 2 | Poll succeeds | Verify getBuildStatus transitions from QUEUED → WORKING → SUCCESS |
| 3 | Service URL | Verify getServiceUrl returns real Cloud Run URL |
| 4 | Revision list | Verify listRevisions returns ≥1 revision |
| 5 | Traffic switch | Create 2 revisions, switch 100% traffic, verify |
| 6 | Suspend/Activate | Scale to 0, scale back, verify status |
| 7 | Environment update | Set STORE_FROZEN=true, verify env var on service |
| 8 | Rollback | Switch traffic to old revision, verify app behaves as old version |
| 9 | Secret Manager integration | Deploy with pinned secret version, verify MONGO_URI matches |
| 10 | Dry-run mode | Set GCP_ADMIN_DRY_RUN=true, verify no API calls made |

### Main POS isolation

All tests run against `techcross-saas-staging` project only. Never against production `techcross` project. Test service name must start with `test-` prefix.

## §S Staging validation plan

Pre-requisites:
- `google-auth-library` in package.json (required by @google-cloud/secret-manager dependency chain but verify explicitly)
- Service account key for storeflow-admin in env or ADC configured
- Artifact Registry repo `storeflow` exists in europe-west3

```
gcloud artifacts repositories create storeflow \
  --repository-format=docker \
  --location=europe-west3 \
  --description="StoreFlow Docker images"
```

Steps (after code implementation):

1. Set `GCP_ADMIN_DRY_RUN=true`, run existing deployment route tests — verify all pass without API calls
2. Set `GCP_ADMIN_DRY_RUN=false`, run `node scripts/test-gcp-admin-staging.js` — verify each function end-to-end against real API
3. Create test Cloud Run service: `test-gcp-admin-validate` with minimal image
4. Test traffic switch with two dummy revisions
5. Test suspend → activate cycle
6. Test environment variable update
7. Clean up test service
8. Run full unit test suite — 0 regressions

## §W Security rules

1. **Never log mongoUri, customer data, or secret payloads** in gcp-admin.js. Log only service names and build IDs.
2. **One service account per customer**. StoreFlow admin uses `serviceAccountUser` to deploy as customer SA.
3. **Pinned secret versions only**. `triggerDeployBuild` receives already-resolved URI (deploy route resolves via Secret Manager with pinned version).
4. **No cross-customer access**. Each customer's Cloud Run service only has IAM for its own secret.
5. **No Main POS access**. gcp-admin.js only operates on services in the configured project. Never accept a projectId parameter that points to Main POS production.

## §X Implementation notes

- Use `google-auth-library` for OAuth2 tokens (already lazy-required in stub).
- Use `axios` or native `https` module for REST calls.
- Cloud Run API v1 endpoint: `https://run.googleapis.com/v1/`
- Cloud Build API v1 endpoint: `https://cloudbuild.googleapis.com/v1/`
- All callers already pass projectId, region, serviceName — no additional route changes needed.
- Existing routes in deployments.js call the stub functions with the correct signatures. Implementation swap should be transparent.
- `suspendService` and `activateService` replace inline patch construction in route handlers. Update routes to call these instead of constructing patches inline.
