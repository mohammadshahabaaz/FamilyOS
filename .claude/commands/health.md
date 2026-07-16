---
description: Run a full FamilyOS system health check across all layers — Docker, PostgreSQL, Redis, API, test suite, and mobile app.
argument-hint: (no arguments needed)
---

# /health — FamilyOS System Health Check

Activate the `monitor` agent and run the full health check runbook.

## Run These Checks In Order

```bash
# 1. Docker containers
docker compose ps

# 2. Postgres
docker exec familytree-postgres-1 pg_isready -U postgres

# 3. Redis
docker exec familytree-redis-1 redis-cli ping

# 4. API health
curl -s http://localhost:3000/health

# 5. API auth (expect 401)
curl -s -o /dev/null -w "Auth endpoint: %{http_code}\n" \
  -X POST http://localhost:3000/api/auth/login \
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
| API /health      | ✓ / ✗            | response time   |
| Auth 401 check   | ✓ / ✗            |                 |
| Test suite       | ✓ 56/56 / ✗      | failing tests   |
| Mobile :8081     | ✓ / ✗            |                 |

## Overall: HEALTHY / DEGRADED / DOWN

## Action Required
[None] OR [specific recovery steps]
```

If anything is DOWN, run recovery:
```bash
# Restart infra
docker compose restart

# Restart API
pkill -f "tsx.*src/index" 2>/dev/null
cd apps/api && npx tsx --env-file=.env src/index.ts > /tmp/api.log 2>&1 &
sleep 3 && curl -s http://localhost:3000/health

# Restart Expo
lsof -ti:8081 | xargs kill -9 2>/dev/null
cd apps/mobile && npx expo start --web --port 8081 > /tmp/expo.log 2>&1 &
```
