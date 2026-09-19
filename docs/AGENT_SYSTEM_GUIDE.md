# FamilyOS Agent System — How to Actually Use It

A guide to the `.claude/` setup: what's in it, how each piece gets triggered, and how to drive it instead of just typing at Claude and hoping. Written after fixing a real bug in this exact system — that fix is used as the worked case study below, because it's a better teacher than a made-up example.

## 1. The mental model: three different things, three different trigger rules

`.claude/` holds three kinds of files that look similar (all markdown, all with YAML frontmatter) but behave completely differently. Confusing them is the most common way this setup silently doesn't do what you expect.

| | Agents (`.claude/agents/*.md`) | Commands (`.claude/skills/<name>/SKILL.md` with `disable-model-invocation: true`) | Skills (`.claude/skills/<name>/SKILL.md`) |
|---|---|---|---|
| **What it is** | A persona with its own context window, model, and system prompt | A slash-command macro that runs in your *current* conversation | Instructions injected into your *current* conversation when the topic matches |
| **How it triggers** | Explicitly dispatched — by you, or by another agent (e.g. `cto` assigning a `[BACKEND]` ticket to `backend`) | Only when you type `/name` | Automatically, whenever your request matches the skill's `description` — no typing required |
| **Where it runs** | Isolated sub-context; reports back a summary | Inline, in this conversation | Inline, in this conversation |
| **Example in this repo** | `backend`, `frontend`, `monitor` | `/build`, `/db-reset`, `/health` | `familyos-api`, `familyos-ui` |

The practical consequence: if you write "add a new API route for X," you don't need to type `/build` or mention `backend` by name — the `familyos-api` skill's description matches "API route" and loads automatically, and *within that*, if the work is big enough, you'd separately choose to invoke `/build` to get the full CTO → Devil's Advocate → tickets → specialists → Monitor pipeline. Skills set ground rules for whatever you're already doing; commands start a defined multi-step process; agents are the individual specialists that process ends up calling.

## 2. Full roster

### Agents — dispatched via the Agent tool, one specialist per concern

| Agent | Model | Fires when |
|---|---|---|
| `cto` | opus | Entry point for any feature, bug, or architecture decision — applies the Founder Rule, assigns tickets |
| `product-manager` | opus | On-demand (`/discover`) — audits actual code state for gaps and roadmap misses, proposes prioritized, Founder-Rule-vetted tickets |
| `devil-advocate` | opus | Called by `cto` before anything gets built — finds flaws, scores anti-patterns, issues a verdict |
| `product-designer` | opus | `/design`, `/design-audit` — visual/interaction design craft, design-system discipline; specs new screens or audits existing ones. Distinct from `frontend`: designs, doesn't implement |
| `frontend` | sonnet | `[FRONTEND]` tickets — React Native / Expo / UI work, implements what Product Designer specs |
| `backend` | sonnet | `[BACKEND]` tickets — Fastify / Prisma / API work |
| `devops` | sonnet | `[DEVOPS]` tickets — Docker, R2, env config, CI |
| `performance` | sonnet | `[PERF]` tickets — query, bundle, caching work |
| `monitor` | haiku | `[MONITOR]` tickets — always last, verifies nothing broke |
| `user-tester` | opus | On-demand — simulates a real, non-technical family member using the app |
| `agent-optimizer` | opus | On-demand — audits and patches the agent system itself (used to build this guide) |

### Commands — typed explicitly, each a fixed multi-step pipeline

| Command | What happens |
|---|---|
| `/build <description>` | The full pipeline: `cto` intake → `devil-advocate` challenge → tickets → specialists build → `monitor` verifies |
| `/design <screen name>` | `cto` frames requirements → `devil-advocate` challenges UX → `product-designer` produces a layout spec — no code yet |
| `/design-audit [screen]` | `product-designer` audits every existing screen (or one) against the craft rubric — severity-ranked findings + top-5 fix list |
| `/debate <question>` | `cto` vs `devil-advocate`, structured rounds, ends in a decision doc — no code at all |
| `/review <file/module>` | `cto` architecture review, structured issue list |
| `/discover` | `product-manager` audits the actual codebase (not the backlog doc) for gaps and roadmap misses, proposes prioritized tickets |
| `/product` | `cto` audits `FEATURE_BOARD.md` against the Founder Rule, ranks by family value |
| `/phase-status` | Inspects actual code on disk, reports real build-phase progress |
| `/test-user` | Runs `user-tester` across all screens or one screen |
| `/health` | Layered health check: Docker → Postgres → Redis → API → tests → mobile |
| `/test-engine` | Runs the Vitest suite, or isolates the relationship-engine tests |
| `/improve-agents` | Runs `agent-optimizer` — audits every agent/skill, proposes and applies fixes |

> **`/discover` vs `/product`** — these look similar and are easy to reach for interchangeably, but they start from different ground truth. `/product` trusts `.claude/FEATURE_BOARD.md` and ranks what's already written down; it's only as fresh as that file (which, as of this writing, is a shipped-item changelog dated over a month old — not a forward-looking plan). `/discover` doesn't trust the doc at all — it reads the actual code, finds what's stubbed/half-built/missing versus the Phase 2/3/4 roadmap in `CLAUDE.md`, and proposes candidates nobody has written down yet. Run `/discover` first when you suspect the backlog is stale; run `/product` when you already trust it and just want a sprint plan.
| `/dev` | Starts API + Expo web together, health-checks both |
| `/api-start` | Kills port 3000, restarts the API fresh, smoke-tests login |
| `/db-reset` | Wipes the DB, re-pushes the Prisma schema, reseeds the Khan family demo |

### Skills — auto-load based on topic match, no typing required

| Skill | Loads when you're... |
|---|---|
| `familyos-feature` | ...building or changing any feature |
| `familyos-api` | ...touching a Fastify route, Prisma query, or service |
| `familyos-ui` | ...touching any screen or component |
| `familyos-test` | ...writing or running tests |
| `familyos-review` | ...doing a code review |
| `familyos-validate` | ...evaluating a high-stakes decision that needs a written, structured verdict |

## 3. Worked example: "add a badge count to the notification bell"

Tracing what actually happens end to end, so the pipeline stops being a black box:

1. **You type** `/build add an unread badge count to the notification bell icon`.
2. **`cto` runs first.** Applies the Founder Rule (does this help relive/build/verify family? — yes, it surfaces family activity), checks it's not a Phase-2-before-Phase-1 problem, then drafts a decision.
3. **`cto` calls `devil-advocate`** before finalizing. Devil's Advocate walks its attack vectors — in this case probably lands on a performance question ("does the badge count refetch on every screen mount, or is it cached?") and a mobile/UX question ("does this need a new bottom tab, or does it live inside the existing bell icon?"). It returns a verdict via the Verdict Decision Tree — likely `PROCEED (with conditions)`, naming the caching condition explicitly.
4. **`cto` assigns tickets**: a `[BACKEND]` ticket (expose an unread count on the notifications endpoint) and a `[FRONTEND]` ticket (render the badge, wire it to that count).
5. **`backend` and `frontend` build** their tickets independently, each following the `familyos-api` / `familyos-ui` skill rules that auto-load the moment they touch those files (correct field names, theme tokens, `treeId` filtering, etc.).
6. **`monitor` runs last** — health-checks the API, confirms the test suite is still green, confirms the badge renders in a browser check.
7. **You get a final report**: what changed, what tickets were closed, what to verify manually.

If instead you'd just typed the request without `/build`, the `familyos-feature` skill would still auto-load and keep you honest about the Founder Rule and invariants — you'd just be doing the CTO/Devil's-Advocate/ticket steps yourself instead of getting the structured pipeline.

## 4. Case study: the skills bug this guide was written to fix

This is a real bug found and fixed in this project, not a hypothetical — worth reading closely because it's the sharpest possible lesson on skill structure.

**What was wrong:** `familyos-feature.md`, `familyos-api.md`, `familyos-ui.md`, `familyos-test.md`, and `familyos-review.md` all lived as flat files directly under `.claude/skills/` — e.g. `.claude/skills/familyos-feature.md`. `CLAUDE.md` documented all five as active. They were well-written, specific, genuinely useful. And they were **completely inert** — never loading, ever.

**How it was caught:** by cross-referencing two sources of truth that should have agreed and didn't — the live "available skills" listing the Claude Code harness actually surfaces in-session, versus the skill table documented in `CLAUDE.md`. The five `familyos-*` names were in the documentation but absent from the live listing. That gap is the tell.

**Root cause:** Claude Code only auto-registers a skill when it's packaged as its own directory — `.claude/skills/<name>/SKILL.md` — not as a flat `.claude/skills/<name>.md` file. A skill one level too shallow is silently ignored, with no error, no warning. It just never fires.

**The fix:** move each flat file into its own folder — `familyos-feature.md` → `familyos-feature/SKILL.md` — with zero content changes. That's it. All five skills went from dead to live in this exact session, confirmed by the harness surfacing them in the live listing immediately after the move.

**The lesson:** if you write a new skill and it never seems to trigger, the very first thing to check — before doubting your `description` wording — is whether the file is at `.claude/skills/<name>/SKILL.md`, not `.claude/skills/<name>.md`.

## 5. How to invoke things manually vs. let auto-routing handle it

- **Just describe the work** (e.g. "fix the login bug," "add a story-viewer screen") when you want the relevant skill's ground rules applied but don't need the full multi-agent ceremony. Fast, low-overhead, still safe — the skill enforces the Founder Rule and invariants either way.
- **Use `/build`** when the work is non-trivial enough to benefit from a Devil's Advocate pass before code gets written, or spans multiple specialties (backend + frontend + infra).
- **Use `/debate` or `/review`** when you want a decision or an assessment with *no code written at all* — pure analysis.
- **Use `familyos-validate`'s report format** (ask for it explicitly, or it'll get pulled in automatically by `/debate`/`/review` on high-stakes calls) when a decision is expensive enough to reverse that you want a paper trail, not just a verbal verdict.
- **If a skill doesn't seem to be firing**, check its file path first (see the case study above), then check its `description` actually contains language matching what you typed — skills match on topic, not on exact keywords, but a description that's too narrow or too generic both fail silently.
