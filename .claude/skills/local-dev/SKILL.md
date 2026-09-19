---
name: local-dev
description: Bring up the full FamilyOS local stack — Docker infra (postgres, redis, minio), API, BullMQ worker, and Expo web — and verify every service is healthy.
argument-hint: (no arguments needed)
disable-model-invocation: true
---

Bring up the full FamilyOS local development stack.

All logic lives in `scripts/local-dev.sh` — do not re-implement its steps by hand.

1. Run (timeout 300000 ms — first run may launch Docker Desktop and pull images):
   ```
   ./scripts/local-dev.sh up
   ```
   The script: launches Docker Desktop if the daemon is down → `docker compose up -d` → waits for postgres/redis/minio to be healthy → pushes schema + seeds **only if the DB has zero tables** → starts API (`tsx watch`, :3000), worker, and Expo web (:8081), polling each until ready.

2. On success, relay the status table and the test login it prints. Add the URLs:
   - API: http://localhost:3000/health
   - App: http://localhost:8081
   - MinIO console: http://localhost:9011 (familyos / familyos123)

3. On failure the script prints the failing service's log tail and exits non-zero. Diagnose from that output (common causes: missing `apps/api/.env`, port already held by a non-FamilyOS process, schema drift → suggest `/db-reset`). Do not report "up" unless every row in the status table is `up`.

Logs: `/tmp/familyos/{api,worker,expo}.log` — use `/local-dev-logs <svc>`.
