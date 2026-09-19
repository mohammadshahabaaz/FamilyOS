# FamilyOS Feature Board — Round 5
_Audit date: 2026-06-20 | Round 4 complete. Round 5 = Profile + Relationship Identity system_

---

## Round 6 — Candidates from `/discover` (code-audit, not this doc)
_Audit date: 2026-07-17 | Source: `product-manager` agent, grounded in actual code state — see `docs/AGENT_SYSTEM_GUIDE.md` for why this doc alone had gone stale._

| ID | Feature | Founder Rule | Reach/Impact | Effort | Status |
|---|---|---|---|---|---|
| R6-01 | Fix photo-upload race in CreateEventScreen (`handleSave` fires `uploadPhotos().catch(()=>{})` unawaited, navigates before it resolves) | PASS | All / High — core loop broken | S/M | ✅ Shipped |
| R6-02 | "On this day" Feed card (reuse `memory-recall.job.ts` query, new GET route + FeedScreen card) | PASS | All, daily / High | M | ✅ Shipped |
| R6-03 | Deep-link notifications to the specific EventDetailModal instead of the generic Timeline tab | PASS | All / Med | S | ✅ Shipped |
| R6-04 | TreeLink invite/request/approve mobile UI (backend has 5 routes, zero mobile consumer) | CHALLENGE — invite/approve PASS, but any cross-tree *read* hits the unresolved open question in `CLAUDE.md` | Subset (admins, in-laws) / High | M/L | Proposed — needs `/debate` on the open question first |
| R6-05 | Profile-linking request flow (self-service "I am this Person" + admin approve; `ProfileRequest` model exists, no route uses it) | PASS | Every new member, once / High | M | ✅ Shipped |
| R6-06 | Story-post notification fan-out (stories currently notify nobody) | PASS | All / Med | S | ✅ Shipped |
| R6-07 | Top-level ErrorBoundary (none exists — any thrown error white-screens the app) | PASS | All, on crash / Med-High | S | Proposed |
| R6-08 | Tests for Phase 2 modules (story, tree-link, notification, push-token, memory-recall, story-expiry — currently zero coverage) | PASS | n/a (protects all) / Med | M | ✅ Shipped |
| R6-09 | Dedicated In-Memoriam tribute screen (today: grayscale filter only) | PASS | Kin of deceased / Med-High | M | ✅ Shipped |
| R6-10 | Video memory support end-to-end (Media enum has VIDEO; upload/thumbnail path hardcoded to PHOTO/jpeg) | PASS | All / Med | L | ✅ Shipped |

**Dropped at discovery time:** a story "who viewed this" read-receipt list — flagged as a social-engagement mechanic, not identity/hierarchy/memory, rejected outright rather than listed here.

---

## Round 5 — In Progress / Shipped

| ID | Feature | Layer | Status |
|---|---|---|---|
| R5-THEME | App-wide theme switcher (Warm / Light / Dark) | Frontend | ✅ Shipped |
| R5-PROFILE-PIC | Profile picture change on own profile | Frontend | ✅ Shipped |
| R5-SIGNOUT | Sign Out visible on Profile screen (button + nav row) | Frontend | ✅ Shipped |
| R5-REL-MEMBERS | Relationship label badge on every member tile | Frontend | ✅ Shipped |
| R5-REL-PERSON | "Your [Relationship]" badge on PersonScreen | Frontend | ✅ Shipped |
| R5-CSS-VARS | CSS custom property theming (C.* = var(--fo-*)) | Frontend | ✅ Shipped |
| R5-INIT-THEME | Theme persisted to localStorage + restored on load | Frontend | ✅ Shipped |
| R5-REL-CACHE | myRelatives fetched once in App.tsx, passed as prop (no N+1) | Frontend | ✅ Shipped |
| R5-TEST-MOCK | Stale event.service.test.ts mock (countLikes, getUserLikedSet) | Backend | ✅ Fixed |

---

## Shipped This Session (Round 3 + Round 4)

| ID | What | Status |
|---|---|---|
| R3-01 | Session expiry → auto-logout | ✅ |
| R3-02 | Events sorted by date DESC | ✅ |
| R3-03 + R3-A01 | likedByMe in API + PostCard | ✅ |
| R3-A03 | BigInt sizeBytes stripped | ✅ |
| R3-A06 | Tagged persons validated against treeId | ✅ |
| R3-A07 | createFamily creates Person for admin | ✅ (OnboardingScreen) |
| R3-A08 | joinFamily 409 on duplicate | ✅ |
| R3-A12 | pathDebug removed from getRelatives | ✅ |
| R3-04 | PersonScreen back button respects `from` | ✅ |
| R3-05 | EventGridTile tappable | ✅ |
| R3-06 | AddPersonScreen: onSave before addEdge | ✅ |
| R3-07 | Dead else-branch removed from loadData | ✅ |
| R3-08 | Pull-to-refresh on Feed/Members/Events | ✅ |
| R3-11 | Initials crash (?.[ ] ?? '?') | ✅ |
| R3-14 | EventsScreen empty state + CTA | ✅ |
| R3-16 | localCommentCount increments after post | ✅ |
| R4-scroll | Scroll broken on web | ✅ fixed via CSS injection |
| R4-nav | BottomNav labels + active-bar indicator | ✅ |
| R4-login | LoginScreen dark theme + focus ring | ✅ |
| R4-feed-hdr | FeedScreen header with member count | ✅ |
| R4-person-btn | "+ Memory" as primary CTA on PersonScreen | ✅ |
| R4-ring | Relatives highlight ring uses gradient | ✅ |
| R4-tile-dup | Remove duplicate avatar from MembersScreen tile | ✅ |
| R4-footer | EventsScreen footer: "N likes · N comments" | ✅ |
| R4-desc | PostCard description as separate grey text | ✅ |
| R4-chip | CreateEventScreen type chip min-width | ✅ |
| R4-header-pad | CreateEventScreen header paddingTop 52→16 | ✅ |
| R4-01 | SignupScreen dark theme + focus ring | ✅ |
| R4-04 | Stories row moved above ScrollView (true sticky) | ✅ |
| R4-05 | PersonScreen empty bio shows "Family member" | ✅ |
| R4-06 | Date max uses local timezone (en-CA) | ✅ |
| R4-07 | AddPersonScreen shows edge direction hint | ✅ |
| R4-08 | FeedScreen empty state + "Create Memory" CTA | ✅ |
| R4-09 | BottomNav tab follows screen.from context | ✅ |
| R4-10 | EventsScreen poster initial crash-safe | ✅ |
| R4-11 | MembersScreen portrait photo objectPosition top | ✅ |

---

## High Priority

### R5-01: PostCard like animation (scale pulse on tap)
- **Problem**: Heart icon state change is abrupt — no tactile feedback confirms the action.
- **Fix**: Use `Animated.spring` to briefly scale the heart icon to 1.3 then back to 1 on press.
- **Acceptance**: Tap heart → visible scale pulse → state changes.

### R5-02: BottomNav + button hover shadow deepens
- **Problem**: SignupScreen still uses the old blue-button style, creating visual inconsistency immediately after login.
- **Fix**: Apply same card layout, dark button, focus-ring, and logo badge pattern from updated LoginScreen.
- **Acceptance**: Login → Create account → same visual language, no jarring color change.

### R4-02: BottomNav + button should glow on hover (web-specific)
- **Problem**: The create (+) button has no hover feedback on desktop. Other tabs have cursor: pointer but the plus button's state is static.
- **Fix**: Add `// @ts-ignore boxShadow: '0 4px 16px rgba(0,0,0,0.25)'` on hover via a `hovered` state bool.
- **Acceptance**: Hover over + → shadow deepens visually.

### R4-03: PostCard avatar ring uses `background` gradient — doesn't apply inside StyleSheet array merge
- **Problem**: The gradient background for the avatar ring is applied via `@ts-ignore background: linear-gradient(...)` but in StyleSheet.create it sits inside an object that can't merge with the spread. This means on some views the fallback background color shows instead.
- **Fix**: Move gradient style inline to the component's JSX (same pattern as banner/badge backgrounds).
- **Acceptance**: No gray flash on avatar ring before image loads.

### R4-04: FeedScreen stories row can overflow its sticky header on scroll
- **Problem**: The stories row is `stickyHeaderIndices={[0]}` but `ScrollView` on web doesn't always correctly implement `stickyHeaderIndices`. Stories can scroll away instead of sticking.
- **Fix**: Extract stories row into a separate static `View` ABOVE the `ScrollView` (not inside it). ScrollView contains only posts.
- **Acceptance**: Scroll down feed → stories row stays at top.

### R4-05: PersonScreen — empty bio line when no DOB and not deceased
- **Problem**: If `isDeceased=false` and `dateOfBirth=null`, the bio section renders an empty gap (no text at all) between the name and action buttons.
- **Fix**: Add fallback `<Text style={styles.bioLine}>Family member</Text>` when both conditions are false.
- **Acceptance**: Person with no DOB shows "Family member" subtitle instead of blank gap.

### R4-06: CreateEventScreen date can be set to future — allows future memories
- **Problem**: The `<input type="date" max={today}>` prevents future dates on web, but the `max` value uses `new Date().toISOString()` which is UTC and may be 1 day ahead for users in UTC-X timezones.
- **Fix**: Use `new Date().toLocaleDateString('en-CA')` for the `max` value (en-CA gives YYYY-MM-DD in local time).
- **Acceptance**: A user in UTC-5 can select today's date without it being blocked.

### R4-07: AddPersonScreen relation picker doesn't explain direction of edge
- **Problem**: The "From person" picker creates `PARENT` / `SPOUSE` / `SIBLING` edges from the selected person to the new person, but the UI shows no directional hint. A user creating a "parent" edge doesn't know if they're saying "X is parent of new person" or "new person is parent of X".
- **Fix**: Add a `<Text>` below the type selector: "Edge direction: [From person] is [relationship type] of [new person]" rendered dynamically.
- **Acceptance**: User can see "Tariq is PARENT of (new person)" before saving.

---

## Medium Priority

### R4-08: FeedScreen empty state needs + Create CTA like EventsScreen
- **Problem**: Feed empty state shows "No memories yet" + "Family events will appear here" but has no button. EventsScreen has a "+ Create Memory" CTA.
- **Fix**: Add `TouchableOpacity` CTA → `navigateTo({ name: 'createEvent' })` below the empty state text.
- **Acceptance**: Empty feed → "+ Create Memory" button visible and tappable.

### R4-09: BottomNav doesn't highlight "People" tab when on PersonScreen from Members
- **Problem**: When on PersonScreen (navigated from Members), `active` is set to `'members'` which lights up People. But from Feed → person, `active` is `'members'` too — Feed tab doesn't stay highlighted. This is intentional but confusing.
- **Fix**: When `screen.name === 'person'`, use `screen.from` to determine which tab to highlight.
- **Acceptance**: Feed → person → BottomNav shows Feed tab active. Members → person → People tab active.

### R4-10: EventsScreen EventRow poster initial not crash-safe
- **Problem**: `EventsScreen.tsx` line 105: `poster?.firstName[0]` — optional chain on poster but not on `[0]`. If firstName is empty string → undefined.
- **Fix**: `poster?.firstName?.[0] ?? 'F'`
- **Acceptance**: Event with empty firstName renders 'F' initial, no crash.

### R4-11: MembersScreen tile media square clips tall portrait photos awkwardly
- **Problem**: `aspectRatio: 1` forces a square crop. Profile pictures are typically portrait, so heads are cropped at the neck.
- **Fix**: Add `resizeMode="cover"` with `objectPosition: 'center top'` via `// @ts-ignore` to keep faces in frame.
- **Acceptance**: Portrait profile photos show faces, not chests.

---

## Polish / Deferred

### R4-12: PostCard like heart scale animation (CSS transition)
- **Status**: Needs `Animated.Value` or web CSS animation — medium effort, minor UX gain. Defer.

### R4-13: FeedScreen skeleton loading placeholder
- **Status**: Requires a dedicated SkeletonCard component. Medium effort, visible only on initial load.

### R4-14: SignupScreen gender field should default to a choice, not require selection
- **Status**: Minor UX, low priority.

### R3-09: Date input cross-platform (native iOS/Android)
- **Status**: Web-only app for now. Accept tech debt.

### R3-10: PostCard carousel swiping
- **Status**: Phase 2 — needs paginated ScrollView.

### R3-12: BottomNav Profile tab shows Members when no linked person
- **Status**: Phase 2 — ties into person-linking flow.

### R3-A04: Story creation endpoint
- **Status**: Phase 2 feature.

### R3-A05: BullMQ thumbnail / memory-recall workers
- **Status**: Phase 2 feature.

### R3-A09: Comment delete UI
- **Status**: Deferred — swipe-to-delete pattern.

### R3-A10: Refresh token family invalidation
- **Status**: Phase 2 security hardening.
