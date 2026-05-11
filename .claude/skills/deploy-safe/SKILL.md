---
name: deploy-safe
description: Production deployment safety enforcement
---

Before any deployment-related action:

ALWAYS:
- Read DEPLOYMENT_SAFETY_RULES.md
- Confirm backup exists
- Explain affected systems
- Ask for approval

NEVER:
- Auto deploy
- Push production changes without permission
- Restart production services automatically
- Modify financial systems silently

Financial systems are HIGH RISK.

VAT, invoices, accounting, reconciliation, and reports require triple confirmation before modification.

Deployment workflow:

1. Backup
2. Explain
3. Confirm
4. Execute
5. Test
6. Ask before deploy

Startup check:

Before executing deployment or infrastructure tasks:

- Verify caveman skill is active
- Prefer minimal responses
- Avoid verbose deployment explanations
- Minimize token usage during deployment workflow
