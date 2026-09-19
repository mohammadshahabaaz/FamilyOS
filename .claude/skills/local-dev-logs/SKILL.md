---
name: local-dev-logs
description: Tail logs for one FamilyOS local service — api, worker, expo, postgres, redis, or minio.
argument-hint: <api|worker|expo|postgres|redis|minio> [lines]
---

Show recent logs for a FamilyOS local service.

Arguments: `$ARGUMENTS` (service, optional line count — default 50). If no service is given, default to `api`.

```
./scripts/local-dev.sh logs <service> [lines]
```

- `api` / `worker` / `expo` read `/tmp/familyos/<svc>.log` (only exists if started via `/local-dev` or `/local-dev-restart`).
- `postgres` / `redis` / `minio` read `docker compose logs`.

Output is pino JSON with ANSI colours for the API — when summarising, pull out errors with their `traceId`, `module`, and `errorCode` rather than pasting the whole tail. If you spot a clear root cause, state it and the fix; don't just echo the log.
