## ADR-008: Component hierarchy rules (what can import what)

**Status:** PROPOSED

**Context:**
`apps/mobile/src` has `screens/`, `components/`, `lib/`. Today `screens/` receive data as props from `App.tsx`'s single top-level `loadData()`, and `components/` (StoryCircle, PostCard, BottomTabs, TopBar, EventDetailModal) are presentational. Nothing currently prevents a component from importing `lib/api.ts` directly and fetching its own data — which is already exactly what `EventDetailModal` does for comments (see ADR-007), quietly breaking the "fetch once, pass down" pattern that the relationship-cache optimization (`R5-REL-CACHE`) depends on.

**Options:**
1. **Strict layering, lint-enforced**: `components/` are presentational only (props in, no `lib/api.ts` imports, no data fetching); `screens/` own data fetching/state and compose components; `lib/` is the only layer allowed to call `fetch`/`api.ts`. Enforced with the same ESLint import-boundaries mechanism as ADR-001. Pros: keeps components reusable/testable in isolation, matches the pattern most components already follow. Cons: needs a lint rule to actually hold, and `EventDetailModal` becomes a documented exception (self-contained modal, arguably screen-like) unless it's refactored to receive comments as props.
2. **No enforced rule, convention only (status quo)** — Pros: no setup. Cons: this is exactly how `EventDetailModal` ended up fetching independently; nothing stops the next component from doing the same.

**Decision:** Option 1, reusing the ESLint boundaries tooling from ADR-001 (one rule set, two path groups: `components/*` cannot import `lib/api`; `screens/*` and `lib/*` can) rather than standing up a separate mechanism.

**Consequences:** `EventDetailModal` needs to be explicitly classified — either reclassified as screen-like (moved or exempted) or refactored to receive comments via a prop/query hook once ADR-007 lands, rather than silently violating the new rule on day one.
