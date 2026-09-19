---
name: design-audit
description: Full UI/UX craft audit across every screen in FamilyOS, from login to every page — visual hierarchy, missing states, spacing/color discipline, motion, accessibility, and dead ends. Produces a severity-ranked, per-screen findings list plus a prioritized top-5 fix list.
argument-hint: (no arguments, or a single screen name to audit just that one)
disable-model-invocation: true
---

# /design-audit — Full UI/UX Craft Pass

Dispatches the `product-designer` agent in **Mode 1 — audit existing screens**.

## Steps

1. If `$ARGUMENTS` names a specific screen, audit only that one. Otherwise audit the full roster: `LoginScreen`, `SignupScreen`, `OnboardingScreen`, `FeedScreen`, `MembersScreen`, `EventsScreen`, `PersonScreen`, `InMemoriamScreen`, `ProfileScreen`, `SettingsScreen`, `NotificationsScreen`, `CreateEventScreen`, `CreateStoryScreen`, `StoryViewerScreen`, `AddPersonScreen`, `RequestProfileScreen`.
2. For each screen, read the actual current source — not a description of it — and score it against the craft rubric in `product-designer.md` (hierarchy, state coverage, spacing/color discipline, touch targets, motion, microcopy tone, dead ends, navigation clarity, Founder Rule fit).
3. Report findings in the agent's standard audit format: per-screen score, severity-tagged findings with file:line citations and concrete fixes, and what's already working (don't manufacture criticism where the craft is genuinely good).
4. Close with a prioritized top-5 fix list across all screens, ranked by (UX impact) × (how many users hit it) — not by screen order.
5. Ask the user whether to hand the top picks to `/build` for implementation, or just leave the findings as a backlog.
