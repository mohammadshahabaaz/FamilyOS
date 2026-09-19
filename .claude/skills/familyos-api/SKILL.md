---
name: familyos-api
description: "Use when building or modifying any Fastify API route, Prisma query, or service in FamilyOS. Enforces schema invariants, security rules, and the Founder Rule. Activate for any backend ticket."
---

# FamilyOS API Skill

## Pre-Flight Checklist (run before writing a single line)

1. Does this endpoint pass the Founder Rule?
2. Is the route protected by `preHandler: [fastify.authenticate]`?
3. Does every query filter by `treeId` (no cross-tree reads)?
4. Am I using `db.event` (not `db.familyEvent`)?
5. Does any response include BigInt fields? (block if yes — use `select`)
6. Is the Zod schema in `packages/shared/`?

## Route Implementation Pattern

```ts
// 1. Import from shared
import { createEventSchema } from '@familyos/shared'

// 2. Auth guard on all non-public routes
fastify.post('/api/trees/:treeId/events', {
  preHandler: [fastify.authenticate],
  schema: { body: createEventSchema },
}, async (req, reply) => {
  const { treeId } = req.params
  const userId = req.user.sub   // from JWT payload

  // 3. Verify membership (prevents cross-tree access)
  const member = await db.familyMember.findFirst({
    where: { userId, treeId },
  })
  if (!member) return reply.status(403).send({ error: 'Not a member of this tree' })

  // 4. Execute DB operation (use select, not include, for FamilyTree)
  const event = await db.event.create({
    data: { treeId, ...req.body },
    select: { id: true, title: true, date: true, type: true },  // no BigInt
  })

  // 5. Return typed response
  return reply.status(201).send(event)
})
```

## Critical Field Rules

| Field | Rule |
|-------|------|
| `mobileNumber` | Auth field on User — no `email` |
| JWT `sub` | UserId — access tokens contain `{ sub, uniqueUserId }` |
| JWT refresh | Contains `{ tokenId, type: 'refresh' }` — check Redis before using |
| `db.event` | NOT `db.familyEvent` |
| `Comment.userId` | NOT `authorId` |
| `Media.r2Key` | NOT `key` or `url` — derive URL as `${R2_PUBLIC_URL}/${r2Key}` |
| `MediaType` | `PHOTO` or `VIDEO` — NOT `IMAGE` |
| BigInt fields | `storageUsedBytes`, `storageLimitBytes`, `sizeBytes` — NEVER in response |
| FamilyTree queries | Always `select`, never `include` (BigInt serialisation error) |

## Relationship Engine Rules

**NEVER store a relationship label.** Labels are derived at read time by the BFS engine.
**NEVER create a new edge type.** Only PARENT, SPOUSE, SIBLING are valid.

Correct usage:
```ts
// Get all relationships for a person
const relatives = await relationshipEngine.computeAllRelationships(treeId, personId)
// Returns: Array<{ person: Person, relationship: string }>
```

## Zod Schema Pattern

```ts
// packages/shared/src/schemas/event.ts
import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['WEDDING', 'BIRTHDAY', 'TRAVEL', 'MILESTONE', 'REUNION', 'MEMORIAL', 'CUSTOM']),
  date: z.string().datetime(),
  taggedPersonIds: z.array(z.string().cuid()).optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
```

## Error Response Format

```ts
// Always use these status codes
reply.status(400).send({ error: 'Validation failed', details: [...] })
reply.status(401).send({ error: 'Unauthorized' })
reply.status(403).send({ error: 'Not a member of this tree' })
reply.status(404).send({ error: 'Not found' })
reply.status(409).send({ error: 'Already exists' })
reply.status(500).send({ error: 'Internal server error' })
```

## R2 Presign Pattern

```ts
// Generate presigned upload URL
fastify.post('/api/trees/:treeId/media/upload-url', {
  preHandler: [fastify.authenticate],
}, async (req, reply) => {
  const r2Key = `${treeId}/${Date.now()}-${nanoid()}`
  const uploadUrl = await r2.createPresignedUrl({ key: r2Key, expiresIn: 300 })
  return { uploadUrl, r2Key }
  // Client uploads directly to R2
  // Client calls /confirm with r2Key
})
```

## BullMQ Job Pattern

```ts
// Add job to queue
import { memoryRecallQueue } from '../jobs/memoryRecall'

await memoryRecallQueue.add('send-recall', {
  treeId,
  eventId,
  targetUserIds: memberUserIds,
}, { delay: 86400 * 1000 }) // 24h delay
```

## Testing Requirements

```bash
# All 116 tests must pass before and after your change
cd apps/api && npm test

# Zero TypeScript errors
cd apps/api && npx tsc --noEmit

# Quick endpoint verification
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9581469690","password":"123456"}' | jq .
```

## Schema Change Protocol

If you modify `prisma/schema.prisma`:
1. `cd apps/api && npx prisma db push` (NOT `migrate dev`)
2. `npm run db:seed` (reseed demo data)
3. `npm test` (verify 116 tests still pass)
4. Update `packages/shared/` Zod schemas if types changed

## Delivery Checklist

Before reporting done:
- [ ] `npm test` — 116 tests passing
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Curl the new endpoint — shows correct response
- [ ] No BigInt in any JSON response
- [ ] No cross-tree query without TreeLink guard
- [ ] Zod schema added to `packages/shared/` if new input shape
- [ ] R2 presign pattern used (never proxy bytes through API)
