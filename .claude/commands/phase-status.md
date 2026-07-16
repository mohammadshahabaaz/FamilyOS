Show the current FamilyOS build phase status and next task.

Check the following to determine actual status:
1. `ls apps/api/src/modules/` — what modules exist
2. `cat apps/api/src/app.ts` — which routes are registered
3. `cd apps/api && npm test 2>&1 | tail -5` — how many tests pass

Then report this table, updating "Status" based on what you observe:

| Phase | Name | Status | Key deliverables |
|-------|------|--------|-----------------|
| 0 | Foundation + Demo | Done | Schema, seed, BFS engine, Phase 0 read routes |
| 1 | Identity Core | Done | auth (signup/login/JWT+refresh+logout+me), Person CRUD, edges CRUD, 56 tests |
| 2 | Tree Operations | Not started | ProfileRequest approval, FamilyMember role management UI |
| 3 | Stories + Feed | Not started | 24hr Stories, story expiry BullMQ job, feed composition |
| 4 | Notifications | Not started | BullMQ memory-recall job, Expo push via push.ts |
| 5 | TreeLink | Blocked | In-law tree linking — cross-tree visibility UNRESOLVED (do not build) |

API routes live under:
- `/api/trees/*` — Phase 0 read-only (no auth)
- `/api/v1/auth/*` — Phase 1 auth
- `/api/v1/families/*` — family CRUD + invite codes
- `/api/v1/trees/:treeId/persons/*` — person + edge CRUD
- `/api/v1/trees/:treeId/events/*` — event CRUD + likes
- `/api/v1/trees/:treeId/events/:eventId/*` — media + comments

Always flag:
- Cross-tree visibility (TreeLink data access) — UNRESOLVED. Do not build without explicit answer.
- AI features require explicit scope change before any implementation.

Print the table, then print the single next concrete task to pick up.
