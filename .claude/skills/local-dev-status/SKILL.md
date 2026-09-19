---
name: local-dev-status
description: Read-only status table of every FamilyOS local service — postgres, redis, minio, API, worker, Expo.
argument-hint: (no arguments needed)
---

Show FamilyOS local stack status. Read-only — never starts or stops anything.

```
./scripts/local-dev.sh status
```

Relay the table as-is. If some services are down, suggest the narrowest fix:
- Everything down → `/local-dev`
- One app service down → `/local-dev-restart <api|worker|expo>`
- Infra unhealthy → `/local-dev-restart infra`
- API "port bound, /health failing" → `/local-dev-logs api`

For a deeper check (tests, auth endpoint), use `/health` instead.
