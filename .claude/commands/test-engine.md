Run all FamilyOS API tests and report results.

Steps:
1. Run the full test suite:
   ```
   cd /Users/mohammadshahabaaz_1/Shahabaaz_personal_development/FamilyTree/apps/api && npm test 2>&1
   ```

2. Report: total tests, passing, failing. If all pass, show the suite breakdown.
   If any fail, show the full failure output for each failing test.

Current test suites (56 tests):
- `relationship.engine.test.ts` — 31 cases (all family roles + symmetry)
- `auth.service.test.ts` — 14 cases (signup, login, refresh, logout, getMe)
- `event.service.test.ts` — 11 cases (createEvent, list+pagination, update, delete, like toggle)

If tests fail, diagnose the root cause before suggesting a fix. Common issues:
- Mock imports not matching actual module paths
- Enum value mismatches (PHOTO not IMAGE, db.event not db.familyEvent)
- JWT payload type changes affecting auth.service.test.ts

To run only the relationship engine tests:
```
cd /Users/mohammadshahabaaz_1/Shahabaaz_personal_development/FamilyTree/apps/api && npx vitest run src/modules/relationship/relationship.engine.test.ts
```
