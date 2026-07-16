## ADR-004: Auth enforcement point (decorator stack vs middleware vs per-route)

**Status:** PROPOSED

**Context:**
`apps/api/src/plugins/authGuard.ts` already implements a Fastify decorator — `fastify.authenticate` — verified via `@fastify/jwt`, opted into explicitly per route via `preHandler`. This is deliberate: Phase 0 tree routes (`/api/trees/*`) are intentionally public/unauthenticated, so a global default would need an exception list anyway.

**Options:**
1. **Decorator + explicit per-route `preHandler` (status quo)** — Pros: already built, explicit at every route (easy to audit public vs protected at a glance), idiomatic Fastify. Cons: forgetting the `preHandler` on a new route silently ships it unauthenticated — no failure signal.
2. **Global middleware, authenticate-by-default with an opt-out list for public routes** — Pros: fail-safe default; a forgotten route is protected, not exposed. Cons: requires refactoring existing routes, still needs an explicit allowlist for the intentionally-public tree routes, less idiomatic in Fastify's plugin model (this is an Express pattern).
3. **Inline `request.jwtVerify()` calls per handler** — Pros: none over Option 1. Cons: duplicated logic, easy to get wrong, strictly worse than the decorator already in place.

**Decision:** Option 1 (keep the decorator), hardened with a CI-enforced test: assert every route registered outside the known-public prefix list (`/health`, `/api/trees/*`) declares `preHandler: [fastify.authenticate]`.

**Consequences:** No routing refactor needed. One new test file (e.g. `app.routes-guarded.test.ts`) that inspects the route table Fastify exposes and fails the build if a new route is added without the guard or without being added to the public allowlist.
