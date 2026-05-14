# StoreFlow Rollout SPEC — Main POS Clone Deployment

## Architecture

StoreFlow does NOT build a new POS. It clones the existing Main POS system for each tenant store.

Each tenant gets:
- Separate Cloud Run service: `storeflow-{slug}`
- Separate MongoDB Atlas database (customer-owned)
- Separate env vars / secrets
- Independent revisions + rollback
- No shared data with TechCross production DB

## Deployment Flow

```
Store owner submits signup
    → Super admin validates MongoDB URI
    → Store metadata created in StoreFlow admin DB
    → URI stored in Secret Manager (pinned version)
    → Deployment record created (status: pending)
    → POST /api/saas/stores/:id/deploy-mainpos-clone
        → verify HHMM+PIN + reason
        → record previous revision
        → triggerDeployBuild (Cloud Build → Cloud Run)
        → poll build status
        → health check (/api/health)
        → update deployment record
    → Store live (status: running)
```

## States

| Status | Meaning |
|--------|---------|
| `pending` | Created but not yet deployed |
| `deploying` | Cloud Build / deploy in progress |
| `running` | Healthy and serving traffic |
| `deployed_unhealthy` | Deployed but health check failed |
| `suspended` | Suspended by super admin |
| `readonly_frozen` | Read-only mode (subscription or admin) |
| `failed` | Deploy/build errored |

## Rollback

Each store has independent rollback:

```bash
gcloud run services update-traffic storeflow-{slug} \
  --region=europe-west1 \
  --to-revisions {previous-revision}=100
```

Deployment record stores `previousRevision` + `rollbackCommand` per deploy.

## Rollout All Stores (Design — NOT IMPLEMENTED)

After test store verified, rollout all follows:

1. Iterate over all active deployments (status: running)
2. For each store:
   - Record current revision
   - Deploy new code
   - Health check
   - Record new revision
   - Generate rollback command
3. On failure: log error, continue to next store
4. Never delete customer data
5. No automatic schema / data migration
6. Each store promoted independently

To implement later:
```
POST /api/saas/admin/rollout-all  (super_admin only, HHMM+PIN+reason)
```

## Safety Rules

- Service names starting with `teschcross`, `main-pos`, `techcross-` are BLOCKED
- Main POS files must never be modified:
  - `/api/inv/*`  `models/inv/*`  `services/inv-*`  `utils/inv-*`
  - `inv-*.html`  `admin*.html`  `boss*.html`  `server.js`
- Full MongoDB URI never returned in API responses (masked only)
- Secret Manager pinned versions only — never "latest" in production
- StoreFlow admin actions never delete customer MongoDB data
