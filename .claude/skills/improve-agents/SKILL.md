---
name: improve-agents
description: Run the agent-optimizer to audit all FamilyOS agents and skills, score their quality, and propose concrete improvements. Run periodically or after an agent makes a bad decision.
argument-hint: (no arguments, or specify an agent name to focus on)
disable-model-invocation: true
---

# /improve-agents — Agent System Audit

$ARGUMENTS

---

Activate the `agent-optimizer` agent. Conduct a full audit of the agent system.

## Step 1 — Inventory

Read every file in:
- `.claude/agents/` — agent definitions
- `.claude/skills/` — skills, including slash commands (`disable-model-invocation: true` = user-typed only)
- `.claude/rules/` — modular, path-scoped instruction files

Count them and list what exists.

## Step 2 — Score Each Agent

Score each agent file on: Clarity / Completeness / Specificity / Safety Rails / Measurable Output (each /5).

If $ARGUMENTS specifies an agent name, focus 80% of the audit on that one agent, 20% on overall system.

## Step 3 — Find Workflow Gaps

Test the agent handoff chain:
- CTO → Devil's Advocate: does the challenge produce something CTO can act on?
- CTO → Specialists: are tickets specific enough to build from?
- Specialists → Monitor: does Monitor know what to verify?
- user-tester → CTO: is the bug report actionable?

## Step 4 — Produce Patches

For the top 5 weaknesses, write the exact text replacement (not just a description of what to change).

## Step 5 — Apply Improvements (if clear)

If an improvement is unambiguous (missing a safety rail, outdated file path, vague instruction), apply it with Edit tool directly.

If an improvement changes the core product rules (Founder Rule, banned features, invariants), DO NOT apply — propose it and stop.

## Output

Produce the full audit report (see agent-optimizer.md format), then list what was changed vs what was proposed but not applied.
