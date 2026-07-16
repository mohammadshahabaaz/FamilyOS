---
name: familyos-feature
description: "Use when implementing any new feature in FamilyOS. Enforces the Founder Rule, architectural invariants, and the deliver-then-verify workflow. Activate when the user asks to build or change a feature in the API, mobile app, or database schema."
---

# FamilyOS Feature Skill

## Founder Rule (apply before writing a single line)

Ask: **Does this help verify family identity, build the family hierarchy, or help the family create/store/relive a memory together?**

If NO → refuse and explain why. Do not soften or redirect to a related feature.

**Hard blockers — never implement regardless of request:**
- In-app chat
- AI assistant / AI-generated content
- Family tree open search or public discovery
- Cross-tree data visibility (TreeLink read access is UNRESOLVED — do not implement)
- Medical records, travel planner, billing UI

## Required Check Before Any Schema Change

1. Run `npm test` — all 56 tests must pass before and after your change
2. Run `npx tsc --noEmit` in both `apps/api` and `apps/mobile` — zero errors required
3. If you touch `schema.prisma` → run `/db-reset` to re-push and reseed

## Architectural Invariants (never violate)

| Invariant | Rule |
|-----------|------|
| Edge types | Only PARENT, SPOUSE, SIBLING — never store relationship labels |
| Relationship labels | Always computed at read time by BFS engine in `relationship.engine.ts` |
| treeId isolation | Every DB query must filter by `treeId` — no cross-tree reads |
| BigInt fields | `storageUsedBytes`, `storageLimitBytes`, `sizeBytes` — never include in JSON responses; use `select` not `include` |
| Prisma model names | `db.event` (not `db.familyEvent`), media type `PHOTO\|VIDEO` (not IMAGE) |
| Media fields | `r2Key` and `thumbnailR2Key` (not `url`/`key`) — derive URL as `${R2_PUBLIC_URL}/${r2Key}` |
| Comment field | `userId` (not `authorId`) |
| Auth field | `mobileNumber` (not email) |
| Route split | Phase 0 = `/api/trees/*` (no auth), Phase 1+ = `/api/v1/*` (JWT required) |
| Zod + Fastify | Never pass Zod schema to `schema: { body: ... }` — use `.parse(req.body)` inline |

## Implementation Workflow

### Phase 1 — Understand before building
1. Check what already exists: read the relevant module files
2. Confirm the feature passes the Founder Rule
3. Check if the schema needs changes
4. Identify which route file, service, and repository are affected

### Phase 2 — Backend first
1. Add/update Prisma schema if needed → run `/db-reset`
2. Implement repository method (raw Prisma, correct select fields)
3. Implement service method (business logic, auth checks)
4. Wire route in the correct routes file (use `.parse(req.body)` for validation)
5. Register route in `app.ts` if it's a new module

### Phase 3 — Tests
1. Add unit test cases for the new service logic
2. Run `npm test` — must be green before continuing
3. Smoke-test the endpoint with curl against the running API

### Phase 4 — Mobile (if UI change needed)
1. Update `src/lib/api.ts` with the new endpoint
2. Update relevant screen/component
3. Run `npx tsc --noEmit` in `apps/mobile`
4. Test in browser at `localhost:8081`

### Phase 5 — Handoff
- Report: what changed, what tests cover it, what to verify manually

## JWT / Auth Patterns

```typescript
// Protected route — always check membership before returning data
const member = await db.familyMember.findFirst({
  where: { userId: req.user.sub, treeId: params.treeId }
})
if (!member) throw Object.assign(new Error('Not a member of this family'), { statusCode: 403 })
```

## Seeded Test Accounts (for smoke tests)
- `9581469690` / `123456` — testuser, Khan Family MEMBER
- `+923001234567` / `demo1234` — tariq_khan, Khan Family ADMIN
- `+919001112233` / `demo1234` — aryan_sharma, Sharma Family
