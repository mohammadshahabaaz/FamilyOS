# FamilyOS Architecture Decision Records — Phase 2

All ten are `PROPOSED`, not `DECIDED`. Each file lays out options with pros/cons; this table is the recommendation only. Confirm, override, or send back for more debate before rebuild work starts.

| ADR | Title | Recommendation | Overrides status quo? |
|---|---|---|---|
| [0001](0001-module-boundary-enforcement.md) | Module boundary enforcement | ESLint import-boundary rules | New tooling, current layout unchanged |
| [0002](0002-orm-vs-hand-written-sql.md) | ORM vs hand-written SQL | Keep Prisma; scoped raw SQL only for the relationship engine, only if Redis caching isn't enough | No — codifies current default |
| [0003](0003-api-contract-ownership.md) | API contract ownership | Keep hand-maintained Zod contract; fix the `/api/v1` vs documented-path drift now | No, but fixes a live doc/code mismatch |
| [0004](0004-auth-enforcement-point.md) | Auth enforcement point | Keep the `fastify.authenticate` decorator; add a CI test that catches a missing `preHandler` | No — adds a safety net |
| [0005](0005-async-work-boundary.md) | Async work boundary | Queue everything non-trivial through BullMQ with bounded retry + DLQ | No — makes BullMQ's role explicit |
| [0006](0006-error-model.md) | Error model | Add a shared `AppError` hierarchy; central handler already exists | Small addition, non-breaking |
| [0007](0007-frontend-server-state-strategy.md) | Frontend server-state strategy | Adopt TanStack Query | **Yes** — new dependency, only ADR where "no new deps" is overridden |
| [0008](0008-component-hierarchy-rules.md) | Component hierarchy rules | Lint-enforce components-are-presentational; `EventDetailModal` needs reclassifying | Requires resolving one existing violation |
| [0009](0009-integration-abstraction-shape.md) | Integration abstraction shape | **No** Provider Protocol — keep thin singleton clients | No — explicitly rejects adding an abstraction |
| [0010](0010-observability-stack.md) | Observability stack | Structured logs + scheduled health/DLQ alerting via the existing `monitor` agent; defer tracing/metrics | No — extends existing Pino setup |

## Notable findings from grounding this in the actual codebase
- **Contract drift already exists**: `app.ts` registers `/api/v1/auth`, `/api/v1/families`, etc., but `CLAUDE.md`'s documented route list still shows unversioned `/api/auth/signup`-style paths. ADR-003 recommends fixing this as part of adoption.
- **Frontend state debt is already visible in shipped code**: `FEATURE_BOARD.md`'s `R3-16 localCommentCount increments after post` is a hand-rolled optimistic-update patch — a symptom of the missing cache layer ADR-007 addresses.
- **`EventDetailModal` already violates the layering ADR-008 proposes** (fetches its own comments instead of receiving them from `App.tsx`'s data flow) — called out as a required cleanup, not assumed away.
- **Module boundaries are clean today only by accident** — no cross-module imports currently exist, but nothing enforces that as the codebase grows via the `/build` agent pipeline.

## Next step
Reply per-ADR with accept / reject / discuss, or accept all. Once locked, each file's `Status` flips to `DECIDED` and this becomes the reference for the CTO/specialist agents during rebuild.
