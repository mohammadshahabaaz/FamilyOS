---
name: api-start
description: Restart only the FamilyOS API (infra must already be up), health-check it, and smoke-test login.
argument-hint: (no arguments needed)
disable-model-invocation: true
---

Restart the FamilyOS API only. Thin wrapper over `/local-dev-restart api`.

1. Restart (kills whatever holds :3000, starts `tsx watch`, polls /health):
   ```
   ./scripts/local-dev.sh restart api
   ```
   If it fails with a connection error in the log tail, infra is probably down → run `/local-dev` instead.

2. Smoke-test login:
   ```
   curl -s -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"mobileNumber":"9581469690","password":"123456"}'
   ```
   Report whether it returns an `accessToken` or an error.

Routes are at `/api/v1/*`. Logs: `/tmp/familyos/api.log`.
