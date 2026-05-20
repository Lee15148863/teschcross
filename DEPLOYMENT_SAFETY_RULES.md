# Deployment & Safety Rules

## CRITICAL DEPLOYMENT RULE

Claude/AI assistant is NEVER allowed to:
- Push directly to production server
- Deploy automatically
- Overwrite live production files
- Restart production services without permission

---

# Required Deployment Workflow

## BEFORE ANY LARGE CHANGE

MANDATORY:

Create backup first.

Examples:
- Git commit snapshot
- Zip backup
- Database dump
- Full project backup
- Config backup

Large changes include:
- Database schema changes
- Authentication changes
- POS flow changes
- VAT logic changes
- Financial system changes
- Deployment changes
- Major UI refactor
- Multi-file architecture changes

---

# Backup Rules

Before major modification:

```txt
1. Create backup
2. Explain planned changes
3. Wait for approval
4. Execute changes
5. Test changes
6. Ask before deployment
```

---

# Production Server Rules

## Deployment Permission Required

IMPORTANT:

Even if all work is completed successfully:

Claude/AI assistant MUST:
- Ask for confirmation first
- Explain what will be deployed
- Explain affected areas
- Wait for explicit approval

Before:
- Git push
- SCP upload
- Docker deploy
- PM2 restart
- Nginx reload
- Production database migration

---

# Forbidden Actions

NEVER:
- Auto-deploy to production
- Force overwrite production files
- Delete production database
- Run destructive migrations automatically
- Modify live financial data
- Deploy untested code

---

# Recommended Deployment Workflow

```txt
Development
→ Local testing
→ Backup
→ Approval
→ Deploy
→ Verify
→ Production confirmation
```

---

# Git Rules

Before major edits:

```bash
git add .
git commit -m "backup before major changes"
```

---

# Database Rules

Before:
- Schema changes
- Financial logic changes
- VAT changes
- Device lifecycle changes

MUST:
- Export MongoDB backup
- Preserve rollback capability

---

# AI Assistant Behavior

The AI assistant should:
- Be conservative with production
- Prioritize data safety
- Prioritize rollback capability
- Never assume deployment approval

Always ask:

```txt
The changes are complete.
Would you like me to deploy/push them now?
```

---

# TechCross Philosophy

Production safety is more important than:
- Speed
- Automation
- Convenience

Financial and customer data integrity is critical.

---

# CRITICAL TAX & INVOICE PROTECTION RULES

## ABSOLUTELY CRITICAL

The VAT system, accounting logic, invoice system, and financial workflow are considered:

```txt
NEARLY PRODUCTION COMPLETE
```

These systems are now highly sensitive.

---

# STRICT PROTECTION RULE

WITHOUT EXPLICIT PERMISSION:

Claude/AI assistant MUST NEVER:
- Modify VAT logic
- Modify invoice calculations
- Modify tax formulas
- Modify financial workflows
- Modify accounting structure
- Modify margin VAT logic
- Modify Irish VAT handling
- Modify invoice numbering logic
- Modify payment reconciliation logic
- Modify report generation logic

---

# TRIPLE CONFIRMATION RULE

If ANY change may affect:
- VAT
- invoices
- accounting
- reports
- financial calculations
- reconciliation
- supplier invoices
- tax handling

Claude MUST:

```txt
1. Warn clearly
2. Explain exact impact
3. Ask for confirmation
4. Reconfirm again
5. Confirm one final time
6. Only then proceed
```

Minimum:
```txt
THREE EXPLICIT CONFIRMATIONS REQUIRED
```

---

# Examples Of Protected Systems

Protected areas include:

## VAT Engine
- 23% VAT
- 13.5% VAT
- Margin VAT
- Input/output VAT
- VAT reports

---

## Invoice System
- Invoice numbering
- Totals
- VAT display
- Tax calculations
- Supplier invoice handling
- Receipt generation
- Refund invoice logic

---

## Financial Logic
- Daily close
- Monthly reports
- Cash reconciliation
- Device profit calculations
- Margin calculations

---

# REQUIRED AI RESPONSE

Before touching protected systems:

Claude MUST say something similar to:

```txt
WARNING:
This change affects protected financial/tax systems.

The current VAT/invoice/accounting logic is considered production-stable.

This modification may impact:
- VAT reporting
- invoice totals
- accounting consistency
- financial reports

Triple confirmation is required before proceeding.
```

---

# SAFE DEVELOPMENT RULE

Preferred workflow:

```txt
Create backup
→ Explain impact
→ Triple confirmation
→ Apply changes
→ Re-test calculations
→ Verify reports
→ Ask before deployment
```

---

# PRIORITY ORDER

Priority is:

```txt
Financial correctness
> Tax compliance
> Data safety
> Stability
> Features
> UI improvements
```

---

# IMPORTANT PHILOSOPHY

This is NOT a toy POS system.

This is a REAL Irish retail financial system.

Incorrect VAT or invoice behavior can:
- break accounting
- break compliance
- create Revenue issues
- create customer disputes
- corrupt reports

Therefore:

```txt
Financial systems must be treated as HIGH RISK infrastructure.
```

---

# Cloud Run Env Safety

See [CLOUD_RUN_ENV_SAFETY_RULES.md](CLOUD_RUN_ENV_SAFETY_RULES.md) for:
- 2026-05-16 Main POS login 500 incident report (missing INV_JWT_SECRET)
- Required env keys checklist for Main POS and tenant services
- Post-deploy login smoke test requirements
- Rollback protocol for login failures

---

# VPC / Cloud NAT / MongoDB Atlas Connectivity (2026-05-20)

## Permanent Fix Applied

Cloud Run dynamic outbound IPs caused intermittent MongoDB Atlas connection failures.
Permanent infrastructure fix deployed:

| Resource | Name | Detail |
|----------|------|--------|
| Static IP | storeflow-nat-ip | 104.155.83.41 |
| VPC | storeflow-vpc | custom mode |
| Cloud Router | storeflow-router | europe-west1 |
| Cloud NAT | storeflow-nat | ALL_SUBNETWORKS_ALL_IP_RANGES |
| VPC Connector | storeflow-connector | europe-west1, 10.8.0.0/28 |

## Required Deploy Flags

All Cloud Run deployments MUST include:
```
--vpc-connector=storeflow-connector
--vpc-egress=all-traffic
```

cloudbuild.yaml and gcp-admin.js already configured.

## Atlas Network Access

Static IP `104.155.83.41/32` added to MongoDB Atlas project. No dynamic IP dependency.

---

# Hotfix Protocol

1. Hotfix branch must be created from current production base commit
2. Only cherry-pick approved fixes
3. Verify `git diff base --name-only` only contains expected files
4. Deploy with cloudbuild.yaml (preserves VPC config)
5. Verify traffic switches to new revision
6. Rollback: `gcloud run services update-traffic --to-revisions=<prev>`

---

# Post-Deploy Verification Checklist

**Main:**
- [ ] mongo operational
- [ ] Lee087 login OK
- [ ] /api/app-version 200
- [ ] /api/inv/modules 200
- [ ] inv-login.html 200
- [ ] inv-pos.html 200
- [ ] boss.html 200
- [ ] boss-audit.html 200
- [ ] saas/admin.html 200

**StoreFlow Test Tenant:**
- [ ] mongo operational
- [ ] plan=free
- [ ] modules: pos/products/transactions/stock/reports
- [ ] shortcuts=false
- [ ] users=2, products=100, monthlyTransactions=null
- [ ] transactionsDelete=false, vatExport=false

---

# Auto-Deploy Triggers (2026-05-20)

| Trigger | Status |
|---------|--------|
| Main push → production | NOT configured (permanently disabled) |
| Staging push → test tenant | Planned (cloudbuild-staging.yaml ready) |
| Release tag → production | NOT configured (deferred) |

Two legacy git-triggered Cloud Build triggers deleted on 2026-05-20.
All production deploys are manual via `gcloud builds submit`.
- Known good/broken revision tracking
