## ADR-002: ORM vs hand-written SQL

**Status:** PROPOSED

**Context:**
Prisma 6 is already the ORM across every repository (`lib/db.ts`, `schema.prisma` with 15 models), and 56 passing tests are built against it. The one place this is genuinely awkward today is the relationship engine (`modules/relationship/`), which loads all `RelationshipEdge` rows into memory and runs BFS in JavaScript rather than expressing the traversal in SQL — a known scale concern already flagged in `CLAUDE.md`'s "Scale architecture" section (Redis caching of computed graphs, currently recomputed per request).

**Options:**
1. **Prisma everywhere (status quo)** — Pros: type-safety, `db push` migrations, 15 working models, 56 passing tests all assume this. Cons: recursive/graph queries are awkward in Prisma; already worked around by pulling all edges into app memory.
2. **Prisma for CRUD + raw parameterized SQL (`$queryRaw`) for graph-heavy reads** (recursive CTEs for relationship traversal) — Pros: keeps ORM ergonomics for ~90% of the code, unlocks proper recursive-CTE performance for the one genuinely graph-shaped problem. Cons: two query styles to maintain; raw SQL needs manual review to guarantee `$queryRaw` is always parameterized, never string-concatenated (SQL injection surface).
3. **Drop Prisma for a query builder (e.g., Kysely) everywhere** — Pros: full control, best perf ceiling. Cons: throws away 15 working models, migrations, and all existing tests; disproportionate — most queries here are simple CRUD scoped by `treeId`.

**Decision:** Option 1 as the default, with Option 2 as a scoped, explicit exception for the relationship engine — and only once the already-planned Redis cache-per-treeId (invalidated on edge mutation) proves insufficient on its own.

**Consequences:** No wholesale migration. If/when the relationship engine needs raw SQL, it lives in `modules/relationship/relationship.repository.ts` behind the same interface the BFS engine already uses, so the rest of the app is unaffected. Any `$queryRaw` usage must go through code review with injection-safety as an explicit checklist item.
