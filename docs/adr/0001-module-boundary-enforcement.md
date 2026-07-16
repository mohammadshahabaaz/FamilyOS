## ADR-001: Module boundary enforcement strategy

**Status:** PROPOSED

**Context:**
`apps/api/src/modules/*` already follows a route/service/repository split per module (auth, family, person, event, memory, tree, relationship, notification). A grep of cross-module imports shows the boundary is currently clean by accident, not by enforcement — every module only reaches into shared singletons (`lib/db.ts`, `lib/redis.ts`, `lib/r2.ts`), never into another module's service or repository directly. Nothing stops that from changing as more modules are added and multiple specialist agents (`backend`, `frontend`, `devops`) generate code in parallel via `/build`.

**Options:**
1. **ESLint import-boundary rules** (`eslint-plugin-boundaries` or `import/no-restricted-paths`) encoding "a module may only import itself, `lib/*`, and `@familyos/shared`" — Pros: cheap to add, fails CI/pre-commit, zero runtime cost, proportional to an 8-module codebase. Cons: only as good as the ruleset; needs a one-line update when a module is added.
2. **TypeScript project references** with per-module `tsconfig.json` path restrictions — Pros: compiler-enforced, stronger guarantee. Cons: heavy setup for the current scale, adds friction to the `tsx watch` dev loop, disproportionate to 8 modules.
3. **Convention only, no tooling** (status quo) — Pros: zero setup. Cons: already only holds because the codebase is small; nothing catches drift, especially from agent-generated code across sessions with no shared memory of "don't do this."

**Decision:** Option 1 — ESLint import-boundary rules.

**Consequences:** Adding a new module requires one line in the ESLint boundary config. A module importing another module's internals becomes a lint error, not a silent architectural drift. Revisit Option 2 only if module count roughly doubles and the lint rule stops being sufficient signal.
