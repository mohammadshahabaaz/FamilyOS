## ADR-006: Error model (one base class/type vs ad hoc)

**Status:** PROPOSED

**Context:**
`apps/api/src/plugins/errorHandler.ts` already implements one central Fastify error handler: it special-cases `ZodError` (via a name-check, not `instanceof`, because the codebase has a documented gotcha where `tsx`'s ESM loader can produce separate module instances across symlinked workspace paths — breaking `instanceof`) and otherwise reads `error.statusCode ?? 500`. There is no shared custom error class today; services appear to throw plain `Error`s with a `.statusCode` bolted on by convention, which the compiler does not enforce.

**Options:**
1. **A small shared `AppError` hierarchy** (`NotFoundError`, `ConflictError`, `ForbiddenError`, etc., each carrying `statusCode` + an error code) thrown from services, caught by the existing central handler — Pros: consistent shape, compiler-checked subclasses instead of duck-typed `.statusCode`, small addition since the central handler already exists. Cons: one more shared module (`apps/api/src/lib/errors.ts`) to import across services.
2. **Ad hoc (status quo)** — Pros: zero new code. Cons: already fragile — a typo or missing `.statusCode` field silently 500s with no compiler check.
3. **Result/Either return type, no throwing** — Pros: forces explicit handling at every call site. Cons: would require rewriting all existing services and the 56 passing tests that assume throw/catch; not idiomatic for the rest of the Fastify/Prisma code here.

**Decision:** Option 1 — introduce `apps/api/src/lib/errors.ts` with an `AppError` base class and named subclasses. Update `errorHandler.ts` to check `instanceof AppError` (or the same name-check pattern already used for `ZodError`, to stay consistent with the documented ESM-instanceof gotcha) instead of duck-typing `.statusCode`.

**Consequences:** Services get a typed, discoverable set of errors to throw instead of ad hoc `Error` objects. Existing tests that assert on thrown error shape need a pass to switch to the new classes, but the central handler's external behavior (status codes, response shape) is unchanged, so this is additive, not breaking.
