## ADR-003: API contract ownership (code-first generated vs hand-maintained)

**Status:** PROPOSED

**Context:**
`packages/shared` already holds Zod schemas consumed by both the API (request validation) and mobile (response types) — a hand-maintained, TS-first contract with no OpenAPI spec. This is working, but contract drift is already visible: `app.ts` registers Phase 1+ routes under `/api/v1/...`, while `CLAUDE.md`'s documented route list still shows unversioned paths like `POST /api/auth/signup`. There is exactly one consumer of this API today (the FamilyOS mobile app itself) — no external/public API exists.

**Options:**
1. **Hand-maintained Zod-first contract (status quo)** — Pros: already working, single TS source of truth, zero extra tooling, fits "no new deps until proven necessary." Cons: no machine-readable spec; relies on discipline (which has already slipped once — the `/api/v1` drift).
2. **Code-first generated**: derive OpenAPI from the existing Zod schemas (e.g. `zod-to-openapi`) and generate a typed client. Pros: auto-generated docs, drift becomes a build failure instead of a doc rot. Cons: new dependency + build step, for a single internal consumer that doesn't need a generated client — it already has hand-typed access via `packages/shared`.
3. **Contract-first**: hand-write OpenAPI, generate Zod/types from it. Pros: strongest source of truth if a second client ever exists. Cons: inverts the current flow, most disruptive migration, no second consumer to justify it today.

**Decision:** Option 1, stay hand-maintained Zod-first — but treat the `/api/v1` vs documented-unversioned-paths drift as a bug to fix now: declare `/api/v1/*` (and the intentionally public, unversioned `/api/trees/*` Phase-0 read routes) as canonical, and update `CLAUDE.md` to match reality.

**Consequences:** No new build tooling. `CLAUDE.md`'s route list needs a correction pass as part of adopting this ADR. Revisit Option 2 the moment a second API consumer (a public API, a partner integration) becomes real — not before.
