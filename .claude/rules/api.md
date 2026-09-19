---
paths:
  - "apps/api/**"
  - "packages/shared/**"
---

# API rules (`apps/api/src`)

- **Module layering:** each `modules/<name>/` is `*.routes.ts` → `*.service.ts` → `*.repository.ts`. Services may import other modules' repositories; routes validate with Zod and call services.
- **Auth:** per-route `{ preHandler: [fastify.authenticate] }` (decorator in `plugins/authGuard.ts`). Access JWT 15m `{ sub, uniqueUserId }`; refresh 30d with Redis rotation and **family invalidation** (replaying a rotated token revokes the whole family).
- **Route surfaces** (all registered in `app.ts`):
  - `/api/trees/*` — legacy Phase 0 **unauthenticated** read endpoints (`modules/tree`). Don't extend.
  - `/api/v1/*` — everything else. Tree-scoped resources nest under `/api/v1/trees/:treeId/{persons,events,events/:eventId,stories,profile-requests}`.
- **Errors:** throw `AppError` subclasses; `plugins/errorHandler.ts` returns `{ error: { code, message } }`. Logs carry `{ traceId, userId, module, errorCode }` — `traceId` is the request id from `genReqId`.
- **Background jobs:** `lib/queues.ts` defines the queues; `src/worker.ts` runs them in a separate process and is never imported by the API. Jobs: thumbnail, daily memory-recall, event `notifyGroup` push fan-out, hourly story expiry (reclaims R2 objects + quota).
- **Storage quota** is enforced with one atomic conditional `UPDATE` — keep it that way, no check-then-act.
- **Singleton clients** in `lib/`: `db.ts` (Prisma), `redis.ts`, `r2.ts`, `push.ts` (Expo), `env.ts`.
- **Relationship engine:** per request, build the gender map once from the persons array and the adjacency list once per `computeAllRelationships` call — never re-fetch edges per person. The engine emits `Paternal X` / `Maternal X` prefixes that mobile's `getFamilyCircle()` depends on.
- **Tests** are unit tests: service tests `vi.mock` the `*.repository.js` and `lib/queues.js` modules (ESM — keep the `.js` suffix in imports).
