---
name: familyos-test
description: "Use when writing or running tests in FamilyOS. Covers Vitest unit tests for the relationship engine, auth, event, story, tree-link, notification, push-token, and BullMQ job services. Ensures 116-test baseline is maintained."
---

# FamilyOS Testing Skill

## Test Baseline

**116 tests must pass at all times.** Never ship with a failing test.

```bash
cd apps/api && npm test
# Expected output: "116 passed"
```

## Test Files

| File | Tests | What it covers |
|------|-------|----------------|
| `src/modules/relationship/relationship.engine.test.ts` | 31 | BFS engine — all family roles |
| `src/modules/auth/auth.service.test.ts` | 14 | Signup, login, refresh, logout, getMe |
| `src/modules/tree-link/tree-link.service.test.ts` | 16 | Invite codes, request/approve/reject, admin guards |
| `src/modules/story/story.service.test.ts` | 12 | Upload quota, confirm, fan-out enqueue, view tracking |
| `src/modules/event/event.service.test.ts` | 11 | Event CRUD + like toggle |
| `src/modules/notification/notification.service.test.ts` | 8 | Create, pagination, markAllRead, push token filtering |
| `src/jobs/story-expiry.job.test.ts` | 6 | R2 cleanup, quota reclaim, graceful degradation |
| `src/jobs/notification-fanout.job.test.ts` | 6 | Recipient resolution, event/story type routing |
| `src/jobs/memory-recall.job.test.ts` | 4 | UTC date matching, yearsAgo calculation |
| `src/modules/push-token/push-token.service.test.ts` | 1 | Register (upsert) |

## Relationship Engine Test Pattern

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { RelationshipEngine } from './relationship.engine'
import type { RelationshipEdge, Person } from '@prisma/client'

describe('RelationshipEngine', () => {
  // Build a minimal tree for testing
  const persons: Person[] = [
    { id: 'p1', firstName: 'Tariq', lastName: 'Khan', gender: 'MALE', ... },
    { id: 'p2', firstName: 'Zara', lastName: 'Khan', gender: 'FEMALE', ... },
    { id: 'p3', firstName: 'Ahmed', lastName: 'Khan', gender: 'MALE', ... },
  ]
  const edges: RelationshipEdge[] = [
    { id: 'e1', personAId: 'p1', personBId: 'p2', type: 'SPOUSE', treeId: 't1' },
    { id: 'e2', personAId: 'p1', personBId: 'p3', type: 'PARENT', treeId: 't1' },
  ]

  it('computes spouse relationship', () => {
    const engine = new RelationshipEngine(persons, edges)
    const rel = engine.computeRelationship('p1', 'p2')
    expect(rel).toBe('Spouse')
  })

  it('computes parent-child relationship', () => {
    const engine = new RelationshipEngine(persons, edges)
    expect(engine.computeRelationship('p1', 'p3')).toBe('Father')
    expect(engine.computeRelationship('p3', 'p1')).toBe('Son')
  })
})
```

## Auth Service Test Pattern

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from './auth.service'

// Mock Prisma and Redis
vi.mock('../../lib/db', () => ({
  db: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    }
  }
}))

describe('AuthService.login', () => {
  it('returns tokens on valid credentials', async () => {
    // Setup mock
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'u1',
      mobileNumber: '9581469690',
      passwordHash: await argon2.hash('123456'),
      ...
    })
    const result = await AuthService.login({ mobileNumber: '9581469690', password: '123456' })
    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
  })

  it('throws 401 on wrong password', async () => {
    await expect(
      AuthService.login({ mobileNumber: '9581469690', password: 'wrong' })
    ).rejects.toMatchObject({ statusCode: 401 })
  })
})
```

## When Adding New Tests

1. **Engine tests**: Add cases for any new relationship path you discover. The engine must correctly derive: Father, Mother, Son, Daughter, Brother, Sister, Husband, Wife, Grandfather, Grandmother, Grandson, Granddaughter, Uncle, Aunt, Nephew, Niece, Cousin, Uncle-in-law, Aunt-in-law, Cousin-in-law.

2. **Service tests**: Every public service method needs at least:
   - Happy path (success)
   - Auth failure (no token / wrong token)
   - Not found (invalid ID)
   - Forbidden (wrong tree)

3. **No integration tests against real DB**: Tests use mocked `db` and `redis`. Use `vi.mock()`.

## Running Specific Tests

```bash
# Run only engine tests
cd apps/api && npx vitest run src/modules/relationship/

# Run only auth tests
cd apps/api && npx vitest run src/modules/auth/

# Run with coverage
cd apps/api && npx vitest run --coverage

# Watch mode during development
cd apps/api && npx vitest
```

## Regression Prevention

Before committing any change to:
- `relationship.engine.ts` → run all 31 engine tests
- `auth.service.ts` → run all 14 auth tests
- `tree-link.service.ts` → run all 16 tree-link tests
- `story.service.ts` → run all 12 story tests
- `event.service.ts` → run all 11 event tests
- `notification.service.ts` / `notification-fanout.job.ts` → run the 8 notification + 6 fan-out tests
- `story-expiry.job.ts` / `memory-recall.job.ts` → run the 6 + 4 job tests
- `schema.prisma` → run all 116 tests + `npx prisma db push`

## Known Engine Edge Cases (must not regress)

```
PPCS path → Aunt/Uncle-in-law (parent's parent's other child's spouse via grandparent)
PBS path  → Aunt/Uncle-in-law (parent's sibling's spouse)
PCC path  → Nephew/Niece (from uncle to niece/nephew via shared grandparent)
```

## Delivery Checklist

Before reporting done:
- [ ] `npm test` shows exactly 116 (or 116 + new tests) passing
- [ ] No test marked `.skip` or `.todo` without a tracking issue
- [ ] New tests cover the failure case, not just the happy path
- [ ] Test names are human-readable descriptions (not "test 1")
