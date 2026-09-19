---
name: familyos-review
description: "Use when performing a code review on any FamilyOS file or recent changes. Returns a structured assessment against the Founder Rule, architectural invariants, security rules, and design system. Activate for /review command."
---

# FamilyOS Code Review Skill

## Review Protocol

Always review in this order. Stop at Critical issues before assessing lower severity.

## Layer 1 — Founder Rule (block everything else if this fails)

- Does the code implement a banned feature (chat, AI, open search, cross-tree read, medical, travel, billing)?
- Does the code inch toward a banned feature in a way the user might not notice?

## Layer 2 — Architectural Invariants

Run through this checklist. Each item is a CRITICAL issue if violated:

```
[ ] Relationship label stored in DB?
    (labels must be computed by BFS engine — never stored)

[ ] New edge type beyond PARENT / SPOUSE / SIBLING?
    (all derived labels come from these 3)

[ ] BigInt field in a JSON response?
    (storageUsedBytes, storageLimitBytes, sizeBytes — use select)

[ ] FamilyTree queried with `include` instead of `select`?
    (include pulls BigInt fields → serialisation error)

[ ] `db.familyEvent` used instead of `db.event`?
    (model is named Event, not FamilyEvent)

[ ] `authorId` used on Comment instead of `userId`?

[ ] Media type `IMAGE` used instead of `PHOTO`?

[ ] R2 full URL stored in DB instead of `r2Key`?

[ ] `prisma migrate dev` called instead of `prisma db push`?

[ ] Cross-tree data read without TreeLink guard?
    (always filter by treeId)
```

## Layer 3 — Security

```
[ ] API route missing `preHandler: [fastify.authenticate]`?

[ ] Route accepts `treeId` from params but doesn't verify membership?
    (IDOR risk — user can access another tree's data)

[ ] Auth credentials (tokens, passwords, secrets) logged?

[ ] JWT secret hardcoded instead of from env?

[ ] R2 bytes proxied through API instead of presigned URL?
    (performance AND cost risk)

[ ] New unauthenticated endpoint returns sensitive data?
```

## Layer 4 — Performance

```
[ ] N+1 query: per-item DB call inside a loop?
    Fix: use findMany with include/select, or Promise.all outside loop

[ ] BFS adjacency list rebuilt inside a per-person call?
    Fix: build once per computeAllRelationships call

[ ] Full Person/Event object returned when subset needed?
    Fix: explicit select clause

[ ] BigInt arithmetic using float math?
    Fix: BigInt(Math.round(val)) * 1024n — never BigInt(float * 1024)

[ ] Redis cache invalidation missing after write?
    Fix: await redis.del(`rel:${treeId}:*`) after edge changes
```

## Layer 5 — Frontend (if reviewing mobile code)

```
[ ] Hardcoded hex color instead of theme token?
    Fix: import { C } from '../lib/theme' and use C.*

[ ] stickyHeaderIndices used?
    Fix: move element outside ScrollView

[ ] overflow: 'auto' added to a wrapper View?
    Fix: remove — it creates competing scroll containers

[ ] New bottom tab added beyond the 3-tab limit?
    Fix: access new screen from existing screen or TopBar

[ ] CSS property applied without @ts-ignore?
    (boxShadow, cursor, objectPosition, background gradient, fontFamily, textTransform)

[ ] Non-theme background or border color?
    Fix: use C.border, C.borderSoft, C.surface, C.bg
```

## Layer 6 — TypeScript

```
[ ] `any` type used where proper type exists?
[ ] Non-null assertion (`!`) on something that could actually be null?
[ ] `@ts-ignore` used outside the approved web-CSS patterns?
[ ] Missing await on async call?
[ ] Error type not narrowed before accessing `.message`?
```

## Severity Definitions

| Level | Meaning | Ship? |
|-------|---------|-------|
| CRITICAL | Invariant violation, security hole, data loss risk | Block |
| MAJOR | Wrong behaviour, crashes, bad UX | Fix before ship |
| WARNING | Suboptimal, technical debt, style violation | Fix soon |
| NOTE | Cosmetic, opinion, minor improvement | Optional |

## Output Format

```
## Code Review — [file or subject]
**Reviewer**: CTO Agent
**Date**: [today]

### Critical Issues
1. [issue] at [file:line] — [specific risk] — [exact fix]

### Major Issues
1. [issue] at [file:line] — [impact] — [fix]

### Warnings
1. [issue] at [file:line] — [suggestion]

### Notes
1. [observation]

### Verdict: APPROVE / APPROVE WITH FIXES / REWORK REQUIRED

**Rationale**: [one sentence explaining the verdict]
```
