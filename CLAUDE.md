# FamilyOS — Claude Code Project Instructions

## What this is
Private family identity and memory platform. Not a social network, chat app, or AI assistant.

**Founder Rule (apply to every feature decision):** Does this help verify family identity, build the family hierarchy, or help the family create/store/relive a memory together? If no, do not build it.

## Never build (even if asked)
- In-app chat
- AI features / AI assistant (requires explicit scope update first)
- Family tree / graph discovery / open search
- Medical records, travel planner, billing UI
- Cross-tree data visibility without explicit answer on the open question (see below)

## Open question — do NOT resolve unilaterally
**Cross-tree visibility:** After a TreeLink is approved between Tree A and Tree B (in-laws), do members of Tree A get any visibility into Tree B's events/members/media? Must get explicit user answer before building any cross-tree read logic.

## Stack
- **API**: Fastify 5, Prisma 6, PostgreSQL 16, Redis 7, BullMQ, Argon2 + JWT
- **Mobile**: React Native + Expo SDK 52 (managed)
- **Shared**: Zod schemas in packages/shared
- **Storage**: Cloudflare R2 (presigned uploads — never proxy bytes through API)
- **Jobs**: BullMQ (memory-recall, story-expiry, thumbnail generation)

## Key invariants
- **Relationship labels are NEVER stored** — always computed at read time from PARENT/SPOUSE/SIBLING edges via BFS engine
- **Only three primitive edge types**: PARENT, SPOUSE, SIBLING. All other labels (uncle, cousin, etc.) are derived.
- **`prisma db push`** for dev schema sync (not `migrate dev` — requires interactive TTY)
- BigInt arithmetic: never `BigInt(float * 1024)` — use integer math only

## Dev commands
```bash
# From repo root
docker compose up -d          # postgres:5432, redis:6379

# From apps/api
npm run dev                    # API on :3000
npm run db:seed                # Reseed Khan family demo
npx prisma db push             # Sync schema (non-interactive)
npm test                       # Vitest

# From apps/mobile
npx expo start                 # Metro on :8081
```

## Agent System

### Development Pipeline (always start here)
```
/build <feature description>   — Full multi-agent pipeline:
                                  CTO reviews → Devil's Advocate challenges →
                                  CTO assigns tickets → specialists build →
                                  Monitor verifies health

/design <screen name>          — Design a screen before coding: CTO frames it,
                                  Devil's Advocate challenges UX, Frontend produces spec.

/debate <technical topic>      — CTO vs Devil's Advocate debate, produces a decision doc
/review <file or module>       — CTO architecture review with structured issue list
```

### Product & Planning
```
/product                       — CTO product review: Founder Rule audit of backlog,
                                  family value ranking, sprint proposal (top 5 items).

/phase-status                  — Show build phase table and next task
```

### Testing & Quality
```
/test-user                     — Simulate a real family member using the app.
                                  Produces bug list, feature gap report, UX friction.
/health                        — Full system health check across all layers
/test-engine                   — Run relationship engine tests (or list missing cases)
/improve-agents                — Audit all agents + skills, score quality, propose patches
```

### Infrastructure
```
/dev                           — Start API + Expo web dev servers
/api-start                     — Kill old API process, start fresh, health-check
/db-reset                      — Wipe + re-push schema + reseed Khan family demo
```

### Agent Roster
| Agent | Role | When to use |
|-------|------|-------------|
| `cto` | Orchestrator — routes + assigns tickets | Entry point for all feature decisions |
| `devil-advocate` | Challenger — finds flaws before build | Called by CTO before every major decision |
| `frontend` | React Native / UI specialist | [FRONTEND] tickets |
| `backend` | Fastify / Prisma / API specialist | [BACKEND] tickets |
| `devops` | Docker / R2 / infra specialist | [DEVOPS] tickets |
| `performance` | Query / bundle optimisation | [PERF] tickets |
| `monitor` | Health checks / uptime verification | [MONITOR] tickets, always last |
| `user-tester` | Simulates real family member using app | Bug/gap discovery |
| `agent-optimizer` | Audits and improves all agents | System quality review |

### Skill Files
| Skill | When active |
|-------|-------------|
| `familyos-feature` | Any feature build or change |
| `familyos-ui` | Any frontend / screen / component work |
| `familyos-api` | Any API route / Prisma / service work |
| `familyos-test` | Writing or running Vitest tests |
| `familyos-review` | Code review against all FamilyOS rules |

## Monorepo layout
```
FamilyTree/                   ← npm workspaces root (Node >=20)
├── apps/
│   ├── api/                  ← Fastify REST API (:3000)
│   └── mobile/               ← React Native + Expo (iOS, Android, Web :8081)
├── packages/
│   └── shared/               ← Zod schemas shared by api + mobile
├── docker-compose.yml        ← postgres:5432 + redis:6379
└── tsconfig.base.json        ← base TS config extended by both apps
```

### apps/api/ — key paths
| Path | Purpose |
|---|---|
| `src/app.ts` | Fastify instance — CORS, Helmet, JWT, error handler, auth guard, routes |
| `src/modules/tree/` | Public read endpoints (trees, persons, events, relatives) — only wired routes in Phase 0 |
| `src/modules/auth/` | Signup / login / JWT — stubbed, not yet registered |
| `src/modules/event/` | Event CRUD — stubbed, not yet registered |
| `src/modules/family/` | FamilyMember management — stubbed |
| `src/modules/relationship/` | BFS relationship engine (the core algorithm) |
| `src/modules/notification/` | Push via Expo Server SDK |
| `src/jobs/` | BullMQ workers: memory-recall, thumbnail generation |
| `src/lib/` | Singleton clients: Prisma (`db.ts`), ioredis (`redis.ts`), R2 (`r2.ts`), push (`push.ts`) |
| `src/plugins/` | `authGuard.ts` (JWT decorator), `errorHandler.ts` |
| `prisma/schema.prisma` | Full DB schema — 15 models, 10 enums |

### apps/mobile/ — key paths
| Path | Purpose |
|---|---|
| `App.tsx` | Root — loads tree data, owns navigation state, renders BottomNav + active screen |
| `index.js` | Entry — `registerRootComponent(App)` required for Expo web |
| `src/lib/api.ts` | Typed fetch client targeting `localhost:3000` |
| `src/lib/types.ts` | Frontend types + helpers (`timeAgo`, `formatDate`, `EVENT_GRADIENT`) |
| `src/components/` | `StoryCircle`, `PostCard`, `BottomTabs`, `TopBar`, `EventDetailModal` |
| `src/screens/` | `FeedScreen`, `MembersScreen`, `EventsScreen`, `PersonScreen`, `NotificationsScreen` |

### packages/shared/ — key paths
Zod schemas consumed by both API (request validation) and mobile (type-safe responses): `auth`, `family`, `event`, `media`, `comment`.

## DB schema highlights (prisma/schema.prisma)
- **15 models**: User, FamilyTree, Person, RelationshipEdge, FamilyMember, ProfileRequest, TreeLink, Event, EventPerson, Media, Comment, Like, Story, StoryView, Notification
- **BigInt fields**: `storageUsedBytes` + `storageLimitBytes` on FamilyTree — always use `select` (not `include`) when querying FamilyTree to avoid JSON serialisation errors
- **Polymorphic Like**: `targetType` + `targetId` — no DB foreign key; enforced in app code
- **Story expiry**: `expiresAt` on Story; job handles cleanup

## UI — Indigo Heritage design system

The mobile app runs as a web app via `react-native-web`. Three themes selectable from Profile screen.

**Default (Indigo Heritage):**
- **Palette**: bg `#F7F8FC` (near-white), surface `#FFFFFF`, accent `#3D52A0` (deep indigo), text `#0F1523`
- **Amber theme**: bg `#FBF8F3`, accent `#C85A11` (burnt orange)
- **Midnight theme**: bg `#0E0F14`, accent `#6C8BF5` (electric periwinkle, dark mode)
- All tokens: `C.*` CSS custom properties from `src/lib/theme.ts`. `applyTheme()` updates `:root` at runtime.
- **NEVER use `C.*` for Switch.trackColor/thumbColor** — use `THEMES[activeTheme].*` static hex instead.

**Typography**: Georgia serif for names/titles/event dates/stat numbers. Inter sans for UI labels/section headers/meta.

**Navigation**: TopBar (avatar→profile on root tabs | back arrow on all other screens | bell icon on root tabs) + 3-tab BottomTabs (Home · Family · Timeline) + FAB bottom-right. Swipe left/right to switch between main tabs.

**Key screens:**
- **Feed**: stories row + family circle filter tabs (All/Close/Dadiyal/Naniyal/Internal/Extended) + MemoryEntryCards
- **Members**: family circle filter tabs + 3-column photo grid + "In Memoriam" section with grayscale filter
- **Events (Timeline)**: mini calendar (toggle, month view with event dots) + year dividers + tappable event cards → opens EventDetailModal
- **EventDetailModal**: full-screen slide-up modal with photo gallery (paginated), likes, comments (live from API), comment input
- **Notifications**: bell icon in TopBar → NotificationsScreen (unread badge, mark-all-read, demo items until GET /notifications is wired)
- **Person Profile**: avatar+stats row, relationship badge, relatives highlight strip, event grid
- **Profile (MY profile)**: hero gradient banner + inset avatar + centered name + horizontal relatives strip + theme picker + privacy toggles + sign out button
- **Settings screen**: 8 family security controls (toggles + choice dropdowns)
- **CreateEvent**: type selector + gradient preview + date + tag people + **notify group picker** (Close/Dadiyal/Naniyal/Internal/Extended/All — UI only, push notification delivery is Phase 2)

**Auth hydration invariant**: `authUser` is null on page reload. `App.tsx loadData()` always calls `authApi.me()` to hydrate it before any screen renders that needs `authUser`.

Web-specific CSS via `// @ts-ignore` style props — renders correctly on web, degrades gracefully on native.

## Current build state
Phase 0 + Phase 1 complete:

**Backend (all routes wired into app.ts):**
- Auth: `POST /api/auth/signup|login|refresh|logout`, `GET /api/auth/me`
  - mobileNumber + password, Argon2 hash, JWT access (15m) + refresh (30d) with Redis rotation
- Families: `POST|GET /api/families`, `POST /api/families/join`, invite code generation
- Persons: `GET|POST|PATCH|DELETE /api/trees/:treeId/persons/:personId`
- Edges: `POST|DELETE /api/trees/:treeId/persons/edges` (PARENT, SPOUSE, SIBLING only)
- Events: `GET|POST|PATCH|DELETE /api/trees/:treeId/events/:eventId`, `POST .../like`
- Media: presigned R2 upload URL + confirm (`POST .../media/upload-url|confirm`)
- Comments: `GET|POST|DELETE /api/trees/:treeId/events/:eventId/comments/:commentId`

**Auth notes:**
- Auth field is `mobileNumber` (not email) — Prisma User model has no email field
- JWT payload: `{ sub: userId, uniqueUserId }` for access tokens
- Refresh tokens carry extra `{ tokenId, type: 'refresh' }` for Redis-based revocation
- Media type enum is `PHOTO | VIDEO` (not IMAGE)
- Prisma Event model is `db.event` (not `db.familyEvent`)
- Media uses `r2Key` (not `key` or `url`) — derive URL as `${R2_PUBLIC_URL}/${r2Key}`
- Comment uses `userId` (not `authorId`)

**Mobile:**
- Auth screens: LoginScreen + SignupScreen with form validation and ApiError handling
- Auth state: `src/lib/auth.ts` (tokenStore with localStorage on web, in-memory on native)
- API client: `src/lib/api.ts` — full typed client, auto-attaches JWT, auto-refreshes on 401
- CreateEventScreen: type selector, gradient preview banner, date field, tag-people chips, notify group picker
- BottomTabs: + button (centre) opens CreateEventScreen
- TopBar: bell icon (root tabs) with unread badge → NotificationsScreen; back arrow on all non-tab screens
- FamilyCircle utility: `getFamilyCircle(relationship): FamilyCircle` in `types.ts` — classifies relatives into close/dadiyal/naniyal/internal/extended. Dadiyal/Naniyal tabs require engine to produce "Paternal X" / "Maternal X" label prefixes.
- EventDetailModal: standalone modal component, fetches comments live, toggles likes, paginated photo gallery

**Tests (56 passing):**
- `src/modules/relationship/relationship.engine.test.ts` — 31 cases covering all family roles
- `src/modules/auth/auth.service.test.ts` — 14 cases (signup, login, refresh, logout, getMe)
- `src/modules/event/event.service.test.ts` — 11 cases (CRUD + like toggle)

**Engine additions (bug fixes):**
- `PPCS` → Aunt / Uncle-in-law (parent's parent's other child's spouse — via grandparent, no sibling edge)
- `PBS` → Aunt / Uncle-in-law (parent's sibling's spouse — corrected from wrongly mapped 'Cousin-in-law')
- `PCC` → Nephew / Niece (from uncle to niece/nephew via shared grandparent)

**Phase 2 next**: Story creation + expiry, push notifications (wire notify group from CreateEvent to BullMQ fan-out), BullMQ jobs (memory-recall, thumbnail generation), TreeLink / in-law invite flow, GET /notifications API endpoint, relationship engine paternal/maternal prefix labels for Dadiyal/Naniyal feed filtering.

## Scale architecture (to implement progressively)
- **Redis caching**: Cache computed relationship graphs per treeId with TTL invalidated on edge mutations (currently recomputed per request)
- **DB indexes needed**: `RelationshipEdge(treeId, fromPersonId)`, `Event(treeId, date)`, `EventPerson(eventId)`, `Media(eventId)`
- **Pagination**: Events already cursor-paginated; persons list needs cursor pagination when family trees exceed 200 members
- **Notification fan-out**: On event create, push to Redis queue → BullMQ fan-out worker → Expo push per recipient group (already wired via notifyGroup in CreateEventScreen)
- **Horizontal API**: Fastify stateless (JWT + Redis refresh store) → PM2 cluster or Docker replicas behind nginx
- **CDN**: R2 presigned uploads already bypass API; add CloudFront or Cloudflare cache headers on media read URLs

## Data access patterns
- Tree repository: always filter by `treeId` — no cross-tree queries without explicit TreeLink check
- Person gender map: built once per request from `persons` array, passed into relationship engine
- Adjacency list: built once per `computeAllRelationships` call — do not re-fetch edges per person
