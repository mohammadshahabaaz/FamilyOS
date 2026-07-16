## ADR-009: Integration abstraction shape (Provider Protocol + Adapter)

**Status:** PROPOSED

**Context:**
Two external integrations exist: R2 storage (`lib/r2.ts`, wrapping `@aws-sdk/client-s3`) and Expo push (`lib/push.ts`, wrapping `expo-server-sdk`). Both are thin singleton clients today, not behind an interface. There is no second storage or push provider anywhere on the roadmap. Existing tests already mock `lib/r2.ts` / `lib/push.ts` at the module level and pass without hitting real credentials.

**Options:**
1. **Provider Protocol + Adapter**: define a TS interface per integration type (`StorageProvider`, `PushProvider`), wrap the current SDK as the sole adapter implementing it. Pros: swappable later without touching call sites, marginally easier to mock. Cons: pure abstraction cost today — exactly one adapter per interface, no second one planned, directly against this project's own stated principle ("don't design for hypothetical future requirements... three similar lines is better than a premature abstraction").
2. **Keep thin singleton clients as-is (status quo)** — Pros: matches current scale (one storage provider, one push provider, both fixed by the stack in `CLAUDE.md`), no premature interface. Cons: none material — the module-mocking pattern already used in tests gives the same testability benefit a formal interface would.

**Decision:** Option 2 — no Provider Protocol abstraction.

**Consequences:** `lib/r2.ts` and `lib/push.ts` stay as they are. Revisit only if a second storage or push provider becomes concretely planned (e.g., an SMS channel alongside Expo push) — at that point, introduce the interface at the same time as the second adapter, not before.
