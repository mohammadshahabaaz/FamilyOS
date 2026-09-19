---
name: dev
description: Alias for /local-dev — bring up the full FamilyOS local stack (infra, API, worker, Expo web) and health-check it.
argument-hint: (no arguments needed)
disable-model-invocation: true
---

Alias for `/local-dev`. Run (timeout 300000 ms):
```
./scripts/local-dev.sh up
```
Then follow the reporting and failure-handling steps in `.claude/skills/local-dev/SKILL.md`.
