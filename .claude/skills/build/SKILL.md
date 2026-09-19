---
name: build
description: Multi-agent development pipeline. CTO reviews the request, Devil's Advocate challenges the approach, then specialist agents (frontend/backend/devops/performance) build it, and Monitor verifies health.
argument-hint: <feature or bug description>
disable-model-invocation: true
---

# /build — FamilyOS Development Pipeline

**Request:** $ARGUMENTS

---

You are orchestrating a full multi-agent development cycle. Follow these steps in order. Do not skip steps.

## Step 1 — CTO Intake

Activate the `cto` agent persona. Apply these gates:

**Founder Rule gate** — ask: "Does this help verify family identity, build the family hierarchy, or help the family create/store/relive a memory together?"
- If NO → stop here. Explain why and what would pass instead.
- Hard blocks (never build): in-app chat, AI assistant, open search, cross-tree data visibility, medical records, travel planner, billing UI.

**Clarity gate** — challenge any vague language:
- "Fast" → what latency target?
- "Better UX" → what specific friction?
- "Scale" → what current vs target user count?

**Approach decision** — state in one sentence: what exactly will be built, in which files, and what will NOT be built.

## Step 2 — Devil's Advocate Challenge

Activate the `devil-advocate` agent persona. Challenge the CTO's approach from at least 3 angles:

1. **Architectural risk**: Does this violate any invariant (BigInt in JSON, relationship label stored, cross-tree query, new edge type, migrate dev called)?
2. **Security risk**: New attack surface, IDOR, unauthenticated access, token leak?
3. **Scope creep**: Does this open a door to a hard-blocked feature? Is this Phase 2 work when Phase 2 is incomplete?

CTO must respond to each challenge. If the challenge holds, adapt the approach.

## Step 3 — Ticket Assignment

CTO assigns only what is needed:

```
[FRONTEND] <title> — <description of UI/RN work>
[BACKEND]  <title> — <description of API/DB work>
[DEVOPS]   <title> — <description of config/infra work>
[PERF]     <title> — <description of optimisation work>
[MONITOR]  <title> — <what to verify after ship>
```

## Step 4 — Build

Execute in this order (backend before frontend — frontend depends on API shape):

### Backend tasks (if any):
Activate `backend` agent:
- Implement route/service/schema changes in `apps/api/`
- Run `cd apps/api && npm test` — must show 116 passing
- Run `cd apps/api && npx tsc --noEmit` — zero errors
- Curl the new/changed endpoint to verify

### Frontend tasks (if any):
Activate `frontend` agent:
- Implement screen/component changes in `apps/mobile/`
- Use `C.*` tokens from `src/lib/theme.ts` — never hardcode hex colors
- Run `npx tsc --noEmit` in `apps/mobile/` — zero errors
- Confirm Expo still serves at http://localhost:8081

### DevOps tasks (if any):
Activate `devops` agent:
- Handle config, env vars, Docker, schema sync

### Performance tasks (if any):
Activate `performance` agent:
- Measure → optimise → measure again

## Step 5 — Health Check

Activate `monitor` agent. Run full health check:

```bash
docker compose ps
curl -s http://localhost:3000/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081
cd apps/api && npm test 2>&1 | tail -5
```

Report the health table. Only declare "DONE" if all checks pass.

## Step 6 — Final Report

```
## What Was Built
[file list with one-line description per file]

## Key Decisions
[what the CTO decided and why]

## Devil's Advocate Changed
[anything revised because of the challenge — or "nothing, challenges were addressed"]

## Health: HEALTHY / DEGRADED / DOWN
[monitor output]

## Test In Browser
[specific URL paths and interactions to verify the feature works]
```
