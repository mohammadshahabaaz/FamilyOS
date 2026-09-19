---
name: test-engine
description: Run the full Vitest suite (116 tests), or isolate the relationship engine tests, and diagnose common failure causes.
argument-hint: (no arguments, or "engine" to isolate relationship engine tests)
disable-model-invocation: true
---

Run all FamilyOS API tests and report results.

Steps:
1. Run the full test suite:
   ```
   cd ./apps/api && npm test 2>&1
   ```

2. Report: total tests, passing, failing. If all pass, show the suite breakdown.
   If any fail, show the full failure output for each failing test.

Current test suites (116 tests):
- `relationship.engine.test.ts` — 31 cases (all family roles + symmetry)
- `auth.service.test.ts` — 14 cases (signup, login, refresh, logout, getMe)
- `event.service.test.ts` — 11 cases (createEvent, list+pagination, update, delete, like toggle)
- `tree-link.service.test.ts` — 16 cases (invite codes, request/approve/reject, admin guards)
- `story.service.test.ts` — 12 cases (upload quota, confirm, fan-out enqueue, view tracking)
- `notification.service.test.ts` — 8 cases (create, pagination, markAllRead, push filtering)
- `story-expiry.job.test.ts` — 6 cases (R2 cleanup, quota reclaim, graceful degradation)
- `notification-fanout.job.test.ts` — 6 cases (recipient resolution, event/story routing)
- `memory-recall.job.test.ts` — 4 cases (UTC date matching, yearsAgo calculation)
- `push-token.service.test.ts` — 1 case (register)

If tests fail, diagnose the root cause before suggesting a fix. Common issues:
- Mock imports not matching actual module paths
- Enum value mismatches (PHOTO not IMAGE, db.event not db.familyEvent)
- JWT payload type changes affecting auth.service.test.ts

To run only the relationship engine tests:
```
cd ./apps/api && npx vitest run src/modules/relationship/relationship.engine.test.ts
```
