---
description: Run the user-tester agent to simulate a real family member using FamilyOS. Produces a bug report, feature gap list, and UX friction report. Run after any feature ship.
argument-hint: (no arguments, or specify a screen to focus on)
---

# /test-user — User Experience Simulation

$ARGUMENTS

---

Activate the `user-tester` agent. Simulate Amina Khan (38, mother, moderate tech literacy) using FamilyOS.

## Before Testing

Check the app is alive:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081
curl -s http://localhost:3000/health
```

If either fails: run `/health` first to restore the system.

## Test Scope

If $ARGUMENTS is empty: test ALL screens in order.
If $ARGUMENTS specifies a screen: focus on that screen but also test navigation to/from it.

## Testing Approach

Simulate Amina's actual session:
1. Arrive at the app (login screen)
2. Navigate every main screen
3. Try the core actions: view memories, like, comment, view person, create memory, view own profile, check security settings
4. Try edge cases: empty states, long names, no profile photo, deceased member
5. Try things that SHOULD fail gracefully: wrong password, missing required fields

## Output

Produce the full User Test Report:
- Bug list (with CRITICAL / MAJOR / MINOR / COSMETIC severity)
- Feature Gaps (with Founder Rule verdict and priority)
- UX Friction points
- Top 3 priority actions

## After Testing

If CRITICAL bugs found:
→ Immediately open `/build <bug description>` to fix them

If HIGH priority feature gaps found that pass the Founder Rule:
→ Note them in `.claude/FEATURE_BOARD.md` under "User-Tested Gaps"
