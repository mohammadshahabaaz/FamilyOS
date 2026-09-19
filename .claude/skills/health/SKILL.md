---
name: health
description: Run a full FamilyOS system health check across all layers — Docker, PostgreSQL, Redis, MinIO, API, worker, test suite, and mobile app.
argument-hint: (no arguments needed)
disable-model-invocation: true
---

# /health — FamilyOS System Health Check

Activate the `monitor` agent and run the full health check runbook.

## Run These Checks In Order

```bash
# 1. Stack overview (infra health, API, worker, Expo)
./scripts/local-dev.sh status

# 2. Postgres
docker exec familytree-postgres-1 pg_isready -U familyos

# 3. Redis
docker exec familytree-redis-1 redis-cli ping

# 3b. MinIO (R2 stand-in)
curl -s -o /dev/null -w "MinIO: %{http_code}\n" http://localhost:9010/minio/health/live

# 4. API health
curl -s http://localhost:3000/health

# 5. API auth (expect 401)
curl -s -o /dev/null -w "Auth endpoint: %{http_code}\n" \
  -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"0000000000","password":"wrong"}'

# 6. Test suite
cd apps/api && npm test 2>&1 | tail -8

# 7. Mobile bundle
curl -s -o /dev/null -w "Mobile app: %{http_code}\n" http://localhost:8081
```

## Output the Health Report

```
## FamilyOS Health Report — [timestamp]

| Layer            | Status           | Detail          |
|------------------|------------------|-----------------|
| Postgres         | ✓ / ✗            |                 |
| Redis            | ✓ / ✗            |                 |
| MinIO            | ✓ / ✗            |                 |
| Worker           | ✓ / ✗            | pid             |
| API /health      | ✓ / ✗            | response time   |
| Auth 401 check   | ✓ / ✗            |                 |
| Test suite       | ✓ 116/116 / ✗      | failing tests   |
| Mobile :8081     | ✓ / ✗            |                 |

## Overall: HEALTHY / DEGRADED / DOWN

## Action Required
[None] OR [specific recovery steps]
```

If anything is DOWN, recover with the narrowest command:
```bash
./scripts/local-dev.sh restart infra     # postgres / redis / minio
./scripts/local-dev.sh restart api
./scripts/local-dev.sh restart worker
./scripts/local-dev.sh restart expo
./scripts/local-dev.sh logs <svc>        # diagnose before restarting blindly
```
