---
name: local-dev-down
description: Stop the FamilyOS local stack — API, worker, Expo, and Docker infra. Data volumes are kept unless --purge is passed.
argument-hint: [--purge]
disable-model-invocation: true
---

Stop the FamilyOS local development stack.

Arguments: `$ARGUMENTS`

**Default (no args)** — stops app processes and runs `docker compose stop`. Postgres/Redis/MinIO data is preserved.
```
./scripts/local-dev.sh down
```

**`--purge`** — also runs `docker compose down -v`, which **permanently deletes** the Postgres database, Redis data, and all MinIO media. Before running it, ask the user to confirm explicitly in this turn, even though they passed the flag. Only after a clear yes:
```
./scripts/local-dev.sh down --purge
```
Tell them the next `/local-dev` will detect the empty DB and re-push + re-seed automatically.

After either path, run `./scripts/local-dev.sh status` and confirm every row is `down`. If anything is still up (e.g. an API started outside the script on :3000), report it with the pid from `lsof -ti tcp:<port>` rather than force-killing unknown processes.
