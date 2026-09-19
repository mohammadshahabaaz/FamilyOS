# FamilyOS Smells Catalogue

Maintained throughout the build. Update this file every time a smell is introduced or fixed — move fixed entries to the "Resolved" section with the date and a one-line note rather than deleting them.

**Last audited:** 2026-07-17 (Phase 5 — Docker packaging, ESLint/Prettier, CI, structured logging, composite indexes).

## Severity Definitions

| Severity | Meaning |
|---|---|
| CRITICAL | Will cause data loss, security breach, or production outage |
| HIGH | Will cause incorrect behavior, hard-to-debug failures, or severe tech debt |
| MEDIUM | Slows down development, causes confusion, hurts maintainability |
| LOW | Style, readability, minor inconsistency |

---

## Backend (apps/api, packages/shared)

### Architecture Smells

| Category | Severity | Location | Description | Suggested Fix |
|---|---|---|---|---|
| Implicit Contract | HIGH | `apps/api/src/modules/person/person.routes.ts:44` | `POST /:personId/link-user` reads `const { userId } = (req.body as { userId: string })` — a raw TS cast with zero runtime validation, unlike every sibling route in this file. `linkUserToPerson` never verifies the target user exists or is a tree member. | Add a `linkUserSchema` to `packages/shared`, `.parse()` it, and verify the target user is a real tree member before linking. |
| Implicit Contract | MEDIUM | `apps/api/src/modules/family/family.routes.ts:14` | `createFamilySchema`/`createInviteSchema`/`acceptInviteSchema` are exported from `@familyos/shared` but the routes validate with different hand-rolled inline `z.object()` calls instead — the shared contract is stale and unused. | Validate with the shared schemas (extend them if needed) or delete the unused exports. |
| Implicit Contract | LOW | `apps/api/src/lib/r2.ts:14` | `STORAGE_LIMIT_BYTES` (env-derived) is never used; `family.repository.ts:9-10` independently hardcodes the same `5_368_709_120` literal, so the env var has no effect. | Default `storageLimitBytes` in `familyRepository.createTree` to the exported constant. |
| Leaky Abstraction | MEDIUM | `apps/api/src/modules/memory/memory.service.ts:47` | Raw AWS SDK shapes (`PutObjectCommand`, `DeleteObjectCommand`, `getSignedUrl`) are constructed directly in business logic instead of behind `lib/r2.ts`. | Wrap presign/delete behind `r2.presignUpload()` / `r2.deleteObject()`. |
| Dev/Prod Divergence | LOW | `packages/shared/package.json` (`main`/`types`) | Points straight at raw `src/index.ts` — correct for `tsx`'s on-the-fly TS resolution in dev, but plain `node` can't execute `.ts`. A real `tsc` build of `apps/api` compiles fine (types resolve) but the resulting `dist/index.js` crashes at boot with `ERR_UNKNOWN_FILE_EXTENSION` the moment it imports `@familyos/shared` — confirmed by actually running it. `apps/api/Dockerfile` works around this by building `packages/shared` and patching a **copy** of its `package.json` inside the image (never the repo's own file), but the repo's own `npm run build` / `node dist/index.js` outside Docker still hits this. | Give `packages/shared` a real `build` script and either commit to `main: dist/index.js` everywhere (accepting the dev-mode rebuild-on-change cost) or document that `apps/api` must only ever be run via Docker/tsx, never via a bare local `tsc && node dist/index.js`. |

### Backend Smells

| Category | Severity | Location | Description | Suggested Fix |
|---|---|---|---|---|
| Unbounded Query | HIGH | `apps/api/src/modules/tree/tree.repository.ts:59` | `getEvents(treeId)`, backing the **unauthenticated** `GET /api/trees/:treeId/events`, does `findMany` with deep nested includes and no `take` — unlike the paginated Phase 1 events endpoint. | Add cursor/`take` pagination matching Phase 1. |
| Scattered Auth | MEDIUM | `apps/api/src/modules/tree/tree.repository.ts:39` | `getPerson(personId)` ignores `treeId` entirely (`where: { id: personId }`), unlike `getPersons`/`getEvents` — violates the "always filter by treeId" invariant even though Phase 0 is intentionally public. | Filter with `where: { id: personId, familyTreeId: treeId }`. |
| Unbounded Query | MEDIUM | `apps/api/src/modules/person/person.repository.ts:29` | `listByTree(treeId)` has no limit; feeds the O(N) relationship engine. Matches the exact scale gap CLAUDE.md already calls out for trees >200 members, not yet implemented. | Add cursor pagination. |
| Race Condition | MEDIUM | `apps/api/src/modules/event/event.service.ts:151` | `toggleLike` is check-then-act (`getLike` → `addLike`/`removeLike`) with no transaction — concurrent double-taps can both read "not liked" and the second hits the `Like` unique constraint as an unhandled 500. | Wrap in `db.$transaction`, or catch the P2002 violation as already-liked. |
| Silent Failure | MEDIUM | `apps/api/src/modules/memory/memory.service.ts:99` | `deleteMedia` catches R2 delete failure with an empty comment-only catch block — orphaned R2 objects are invisible to operators. | `fastify.log.warn(err, { mediaId })` at minimum; ideally queue for retry. |

### DSA Smells

| Category | Severity | Location | Description | Suggested Fix |
|---|---|---|---|---|
| Repeated Computation | HIGH | `apps/api/src/modules/relationship/relationship.engine.ts:84-86` | `computeAllRelationships` calls `bfs()` as a brand-new traversal for every person in `allPersonIds` (verified: `for (const toId of allPersonIds) { bfs(fromPersonId, toId, adj) }`) instead of one multi-target BFS recording the path to every reachable node in a single pass. | Run a single BFS from `fromPersonId`, recording the path to each node the first time it's visited. |
| Nested Loop on Unbounded Input | MEDIUM | `apps/api/src/modules/relationship/relationship.engine.ts:43` | `bfs()` uses `queue.shift()` as its FIFO — O(n) per dequeue, giving the traversal quadratic behavior. Compounds with the entry above since it runs once per target. | Use an index pointer into the array instead of `Array.shift()`. |
| Repeated Computation | LOW | `apps/api/src/modules/relationship/relationship.engine.ts:107` | `pathToLabel` rebuilds the entire ~30-entry gendered label table on every call though only one entry is read. | Hoist a static `path -> [male, female, neutral]` table to module scope. |

### OOP Smells

| Category | Severity | Location | Description | Suggested Fix |
|---|---|---|---|---|
| Primitive Obsession | LOW | `apps/api/src/modules/family/family.service.ts:62,89,101`, `person.service.ts:56,65` | `['SUPER_ADMIN','ADMIN'].includes(role)` duplicated as an inline literal array in 5 places instead of one domain helper. | Extract `isAdminRole(role: MemberRole): boolean` and reuse it. |

**Backend health summary:** Phase 1 code (auth, person, event, memory) is generally solid — consistent membership-scoping, Zod validation on almost every route, and correct integer BigInt math throughout (the float-multiplication anti-pattern flagged in CLAUDE.md does not occur anywhere). Weak spots concentrate in the legacy public Phase 0 `tree.*` module (unbounded, occasionally treeId-blind queries behind an unauthenticated surface), a remaining check-then-act race condition on likes (storage quota is now resolved — see Resolved section), and the O(N) relationship-BFS engine that needs a multi-target rewrite before trees grow past ~100-200 members.

---

## Frontend (apps/mobile)

### Architecture Smells

| Category | Severity | Location | Description | Suggested Fix |
|---|---|---|---|---|
| God Module | HIGH | `apps/mobile/App.tsx` (448 lines) | Single file owns: auth session bootstrap, an 11-variant screen-routing state machine, full data-fetch orchestration, swipe-gesture touch-coordinate math, and notification bell-count state. | Split into `useAppData()`, `useAppNavigation()`, and a thin `<Router screen={screen}/>`; App.tsx becomes composition only. |
| Implicit Contract | HIGH | `apps/mobile/src/lib/types.ts:1-49` | `@familyos/shared` is a declared dependency in `package.json`, but a repo-wide grep confirms **zero imports of it anywhere in `apps/mobile/src`**. `types.ts` hand-rolls `Person.gender`/`FamilyEvent` and `CreateEventScreen.tsx:25-28`'s `EVENT_TYPES` duplicates the shared `eventTypeSchema` enum by hand. A backend enum change silently desyncs the app with no compile error. | Import `eventTypeSchema`, `genderSchema`, `relationTypeSchema` from `@familyos/shared` in `types.ts` and derive local arrays from them. |
| Hidden Coupling | MEDIUM | `apps/mobile/src/lib/auth.ts:10-22`, `theme.ts:167-176`, `FeedScreen.tsx:28-43` | Three unrelated modules (token store, theme preference, "seen stories") each independently read/write raw `localStorage` with duplicated SSR/native guards and ad-hoc key strings. | Add one `src/lib/storage.ts` with the guard baked in once; consume from all three. |

### Frontend Smells

| Category | Severity | Location | Description | Suggested Fix |
|---|---|---|---|---|
| Boolean Soup | HIGH | `apps/mobile/App.tsx:42-54,158-206` | `App()` renders auth/loading/onboarding/error/ready screens via five independent nullable/boolean states checked with sequential `if`s; an unvalidated state combo silently falls through to the generic "No family tree found" screen. | Replace with a discriminated union `AppState = {status:'loading'} \| {status:'unauth'} \| ... \| {status:'ready', tree, persons, events}`. |
| Missing Error Boundary | HIGH | `apps/mobile/App.tsx` (whole app) | No `ErrorBoundary` exists anywhere — a thrown exception in any single screen white-screens the entire app with no recovery UI. | Wrap the screen router in a top-level `ErrorBoundary` with a retry/reload fallback. |
| Missing Loading State | HIGH | `apps/mobile/src/screens/CreateEventScreen.tsx:201-205` | `handleSave()` fires `uploadPhotos(...).catch(() => {})` unawaited then immediately navigates away; the event handed back has an empty `media` array and nothing re-fetches once uploads finish — new posts silently show zero photos until a manual refresh. | Await the upload (or track per-event upload progress) and patch the event in state once `confirmUpload` resolves for each photo. |
| Hardcoded Strings | LOW | `apps/mobile/src/screens/SettingsScreen.tsx:24-110` (and most other screens) | User-facing copy (titles, descriptions, choice labels) is inlined directly in component files rather than a constants/copy module. | Extract to `src/lib/copy.ts` so wording changes don't touch component logic. |

### DSA Smells

| Category | Severity | Location | Description | Suggested Fix |
|---|---|---|---|---|
| Nested Loop on Unbounded Input | HIGH | `apps/mobile/src/screens/MembersScreen.tsx:146` | `PersonTile`'s `events.filter(e => e.taggedPersons.some(p => p.id === person.id))` runs per rendered grid tile — O(persons × events × taggedPersons) per render, unmemoized. CLAUDE.md itself flags trees scaling past 200 members. | Precompute a `Map<personId, FamilyEvent[]>` once per `events` change (useMemo in the parent), pass each tile its slice. |
| Repeated Computation | MEDIUM | `apps/mobile/src/screens/ProfileScreen.tsx:33-34` | `myEvents`/`memoriesCount` recomputed via `.filter()`/`.reduce()` on every render, including renders triggered only by theme-picker taps unrelated to events data. | Wrap in `useMemo(() => ..., [events, me?.id])`, matching `FeedScreen.tsx`'s existing pattern. |
| Repeated Computation | MEDIUM | `apps/mobile/src/components/TopBar.tsx:36` | `TopBar` re-scans `persons.find(p => p.linkedUserId === authUser.id)` to find "me", duplicating the identical O(n) scan `App.tsx:127` already performs as `myPersonId` — the result just isn't passed down. | Pass `myPersonId` into `TopBar` as a prop. |

### OOP Smells

| Category | Severity | Location | Description | Suggested Fix |
|---|---|---|---|---|
| Primitive Obsession | HIGH | `apps/mobile/src/screens/SettingsScreen.tsx:228-229` | `Switch trackColor={{false: C.border, true: C.accentSoft}} thumbColor={...C.accent...}` — **verified**: this passes `C.*` CSS-custom-property references into Switch color props, the exact pattern CLAUDE.md explicitly forbids ("NEVER use `C.*` for Switch.trackColor/thumbColor"). `ProfileScreen.tsx`'s `ToggleRow` does this correctly via `THEMES[activeTheme].*`. All 4 Security-screen toggles render with unthemed/broken colors. | Import `THEMES`/`getStoredTheme` in `SettingsScreen.tsx`, use `THEMES[activeTheme].border/.accentSoft/.accent` matching `ProfileScreen.tsx`. |
| Primitive Obsession | HIGH | `apps/mobile/src/lib/types.ts:105-112` | `getFamilyCircle()` classifies Father's Side/Mother's Side/Internal/Extended tabs by regex-matching the raw `relationship: string` label (`/paternal/i`, `/uncle-in-law\|aunt-in-law/i`, etc.) — a shipped feature gated on fragile string-wording with zero compile-time safety against engine label changes. | Have the relationship engine emit a structured `{ side: 'paternal'\|'maternal'\|null, category, label }` and consume that instead of regexing display text. |

**Frontend health summary:** Screen-level UI code (Feed/Members/Events/PersonScreen/PostCard) is generally well-structured with consistent `useMemo` usage and a clean typed API client, but `App.tsx` has grown into a genuine god-module and the app has zero error-boundary protection anywhere. The `SettingsScreen.tsx` Switch violation is the most actionable fix — it's a direct, verified breach of a rule CLAUDE.md calls out explicitly, sitting next to a screen that implements the same control correctly. `@familyos/shared` being a declared-but-unused dependency is the other high-value fix: it's exactly the frontend/backend drift the package exists to prevent.

**Note (not tabled, no taxonomy category fits):** `apps/mobile/src/components/BottomNav.tsx` is fully dead code — not imported anywhere (`App.tsx` uses `BottomTabs.tsx` instead). Worth deleting.

---

## Resolved

| Category | Severity | Location | Description | Resolution |
|---|---|---|---|---|
| Race Condition | HIGH | `apps/api/src/modules/memory/memory.service.ts` (was line 34) | Storage quota was checked against a stale `storageUsedBytes` read in `requestUploadUrl`, then `confirmUpload` incremented unconditionally — concurrent uploads could jointly exceed the quota. | **2026-07-16** — `memory.repository.ts` now exposes `incrementStorageUsedIfWithinLimit`, an atomic conditional `UPDATE ... WHERE storageUsedBytes + delta <= storageLimitBytes RETURNING id` via `$queryRaw`. `confirmUpload` reserves quota with this call *before* creating the `Media` row (avoiding an orphaned row on rejection) and throws `ConflictError('Storage quota exceeded')` when it returns no row. |
| Scattered Auth | HIGH | `apps/api/src/modules/event/event.service.ts` (was line 118) | `updateEvent` passed client-supplied `taggedPersonIds` to `updateTaggedPersons` with no tree-membership check, while `createEvent` validated the same field via `countPersonsInTree`. | **2026-07-16** — `updateEvent` now runs the same `personRepository.countPersonsInTree` check as `createEvent` before persisting a retag, throwing a 422 on mismatch. |
| Config Discovery | LOW | `apps/api/src/modules/auth/auth.service.ts:20` | `issueTokens` read `process.env.JWT_EXPIRES_IN`/`JWT_REFRESH_EXPIRES_IN` directly on every call instead of the centralized `env.ts`. | **2026-07-16** — superseded by the repo-wide `lib/env.ts` Zod-validated env module; `auth.service.ts` now reads `env.JWT_EXPIRES_IN`/`env.JWT_REFRESH_EXPIRES_IN`. Phase 5 also added an ESLint `no-restricted-properties` rule banning raw `process.env.*` outside `lib/env.ts`, so this class of smell can't reappear silently. |
| Dead Code | LOW | `apps/api/src/modules/family/family.routes.ts:4,7` | Unused `createFamilySchema` import and an unused `auth` const (`familyRoutes` used `guard` throughout instead) — same root issue as the "stale shared contract" entry above, just the unused-import half of it. | **2026-07-17** — found by ESLint's `no-unused-vars` during Phase 5 setup; both removed. |
| Dead Code | LOW | `apps/api/src/modules/memory/memory.repository.ts:4` | `r2Url()` helper was defined but never called — URL construction happens in the service layer's own `transform`/`toUrl` functions instead. | **2026-07-17** — found by ESLint's `no-unused-vars`; removed along with its now-unused `R2_PUBLIC_URL` import. |
