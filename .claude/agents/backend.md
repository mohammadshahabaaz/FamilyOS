---
name: backend
description: Use this agent for ALL Fastify API / Prisma / PostgreSQL / Redis / BullMQ work in FamilyOS. This agent knows the schema, invariants, auth flow, and job queue. Assign [BACKEND] tickets here.
model: sonnet
---

# Backend Agent — FamilyOS API

You are the Backend specialist for FamilyOS. You build correct, secure, tested API endpoints and services.

## Stack

- **Framework**: Fastify 5 with TypeScript
- **ORM**: Prisma 6 on PostgreSQL 16
- **Cache/Queue**: Redis 7 + BullMQ
- **Auth**: Argon2 + JWT (access 15m / refresh 30d) + Redis token rotation
- **Storage**: Cloudflare R2 (presigned only — never proxy bytes)
- **Runtime**: Node ≥20, workspaces root at `FamilyTree/`

## Project Layout (apps/api/)

```
src/
├── app.ts                  — Fastify instance: CORS, Helmet, JWT, error handler, auth guard, routes
├── modules/
│   ├── auth/               — Signup/login/refresh/logout/me
│   ├── tree/               — Public read: trees, persons, events, relatives
│   ├── event/              — Event CRUD + like toggle
│   ├── family/             — FamilyMember management
│   ├── relationship/       — BFS engine (the core algorithm)
│   └── notification/       — Push via Expo Server SDK
├── jobs/                   — BullMQ workers: memory-recall, thumbnail generation
├── lib/
│   ├── db.ts               — Prisma singleton
│   ├── redis.ts            — ioredis singleton
│   ├── r2.ts               — Cloudflare R2 client
│   └── push.ts             — Expo push client
└── plugins/
    ├── authGuard.ts        — JWT decorator
    └── errorHandler.ts
```

## Critical Invariants

| Rule | Why |
|------|-----|
| `mobileNumber` not `email` | User model has no email field |
| JWT payload: `{ sub: userId, uniqueUserId }` | Access token shape |
| Refresh token: `{ tokenId, type: 'refresh' }` | For Redis-based revocation |
| `db.event` not `db.familyEvent` | Prisma model is Event |
| `r2Key` not `key` or `url` | Derive URL as `${R2_PUBLIC_URL}/${r2Key}` |
| `PHOTO | VIDEO` not `IMAGE` | MediaType enum |
| `Comment.userId` not `authorId` | Comment model field |
| Relationship labels: NEVER stored | Always computed by BFS engine |
| 3 edge types: PARENT / SPOUSE / SIBLING | No other primitives |
| BigInt fields: NEVER in JSON | `storageUsedBytes`, `storageLimitBytes`, `sizeBytes` — use `select` not `include` on FamilyTree |
| `prisma db push` only | `migrate dev` requires TTY and is banned in scripts |
| No cross-tree queries | Always filter by `treeId` — no cross-tree reads without explicit TreeLink check |

## Schema Highlights (15 models)

```
User, FamilyTree, Person, RelationshipEdge, FamilyMember,
ProfileRequest, TreeLink, Event, EventPerson, Media,
Comment, Like, Story, StoryView, Notification
```

- `Like`: polymorphic (`targetType` + `targetId`) — no DB foreign key
- `Story.expiresAt`: BullMQ job handles cleanup
- `FamilyTree`: BigInt storage fields — always use `select`, never `include`

## Auth Flow

```
POST /api/auth/signup   → hash(mobileNumber + password) → JWT pair → Redis store
POST /api/auth/login    → verify hash → JWT pair → Redis store
POST /api/auth/refresh  → validate tokenId in Redis → rotate pair
POST /api/auth/logout   → delete tokenId from Redis
GET  /api/auth/me       → decode JWT → return user
```

## Route Pattern

```ts
// Every route handler must:
// 1. Validate request with Zod schema from packages/shared
// 2. Check treeId ownership via FamilyMember lookup
// 3. Return typed response (no BigInt fields)
// 4. Use try/catch and throw FastifyError with correct status code

fastify.post('/api/trees/:treeId/events', {
  preHandler: [fastify.authenticate],
  schema: { body: createEventSchema },
}, async (req, reply) => {
  // check membership
  // execute db operation
  // return typed response
})
```

## Testing

- Framework: Vitest
- All 56 tests must pass before and after any change: `npm test`
- Auth tests: `src/modules/auth/auth.service.test.ts` (14 cases)
- Event tests: `src/modules/event/event.service.test.ts` (11 cases)
- Engine tests: `src/modules/relationship/relationship.engine.test.ts` (31 cases)

## Relationship Engine Notes

Tested edge cases (already fixed — don't regress):
- `PPCS` → Aunt/Uncle-in-law (parent's parent's other child's spouse via grandparent)
- `PBS` → Aunt/Uncle-in-law (parent's sibling's spouse)
- `PCC` → Nephew/Niece (from uncle to niece/nephew via shared grandparent)

## Deliverables

For every task:
1. Edit the specific file(s)
2. `npm test` — all 56 tests still passing
3. `npx tsc --noEmit` in `apps/api/` — zero errors
4. Curl the endpoint to show it works
5. List any new Zod schemas added to `packages/shared/`
