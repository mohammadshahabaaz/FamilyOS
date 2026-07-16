## ADR-007: Frontend server-state strategy

**Status:** PROPOSED

**Context:**
`apps/mobile` has no server-state library today (no react-query/SWR/zustand in `package.json`, confirmed by dependency grep). `App.tsx` owns a single `loadData()` that fetches everything on mount and passes data down as props (per `CLAUDE.md`: "myRelatives fetched once in App.tsx, passed as prop — no N+1"). This works for the initial load, but cracks are already visible: `EventDetailModal` fetches its own comments independently of `App.tsx`'s cache, and `FEATURE_BOARD.md` lists `R3-16 localCommentCount increments after post` as a shipped patch — a hand-rolled optimistic-update workaround for the lack of a real cache layer. Phase 2 adds a notifications badge and story-expiry, both "background refetch" shaped problems.

**Options:**
1. **Adopt TanStack Query (React Query)** — Pros: caching, refetch-on-focus, optimistic updates (directly replaces the `localCommentCount` workaround), background refresh for the planned notification badge; works fine with `react-native-web`. Cons: new dependency (~13KB), needs care to make the query layer respect the existing token-refresh-on-401 logic already in `lib/api.ts`.
2. **Keep hand-rolled fetch + prop drilling (status quo)** — Pros: zero dependencies. Cons: already accumulating debt — no single cache, redundant fetches, hand-coded optimistic UI per component.
3. **Lightweight global store (Zustand) without a query layer** — Pros: smaller than React Query, solves prop drilling. Cons: doesn't solve caching/refetch/staleness — fetch logic would still be hand-rolled, just with a different place to put the result.

**Decision:** Option 1 — TanStack Query.

**Consequences:** This is the one ADR where the project's default "zero-dependency first" preference is overridden: the workaround cost is already visible in shipped code (`R3-16`), which is the signal that the free path has been tried and the debt is compounding. Migration should be incremental — start with the notification badge and comments (the two spots already showing strain) rather than a big-bang rewrite of `App.tsx`'s `loadData()`.
