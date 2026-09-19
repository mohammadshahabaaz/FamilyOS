---
name: local-dev-restart
description: Restart one FamilyOS local service (api, worker, expo, infra) or the whole stack, leaving the others running.
argument-hint: <api|worker|expo|infra|all>
disable-model-invocation: true
---

Restart part of the FamilyOS local stack.

Arguments: `$ARGUMENTS` — if empty, default to `api`.

```
./scripts/local-dev.sh restart <api|worker|expo|infra|all>
```
(timeout 300000 ms for `all` / `infra`)

| Target | Effect |
|---|---|
| `api` | Kills and restarts the API, waits for /health |
| `worker` | Restarts the BullMQ worker (needed after editing `src/jobs/*` if tsx watch missed it, or after queue config changes) |
| `expo` | Restarts Metro — use after changing `app.json`, `.env` `EXPO_PUBLIC_*` vars, or installing a native dep |
| `infra` | `docker compose restart`, waits for healthy. Data is kept |
| `all` | Full `down` then `up` (volumes kept) |

Note: API and worker run under `tsx watch`, so ordinary source edits reload on their own — only restart when a reload didn't pick something up (`.env` changes, Prisma client regen after `db push`, a crashed process).

If the restart fails, the script prints the log tail — diagnose from it before reporting.
