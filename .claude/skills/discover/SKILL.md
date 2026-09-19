---
name: discover
description: Discover what to build next by auditing the actual FamilyOS codebase (not the FEATURE_BOARD.md backlog) — finds incomplete flows and roadmap gaps, then proposes Founder-Rule-vetted, prioritized tickets ready for /build.
argument-hint: (no arguments needed)
disable-model-invocation: true
---

# /discover — Code-Driven Feature Discovery

Runs the `product-manager` agent's full discovery workflow: audits actual module/route/screen state, cross-references `CLAUDE.md`'s Phase 2/3/4 roadmap and `docs/SMELLS.md`, applies the Founder Rule, scores what survives, and hands off the top picks as tickets in the same format `cto` uses.

## When to use this vs. `/product`
- **`/discover`** — grounded in real code state. Use when you want fresh candidates nobody has written down yet, or you suspect `FEATURE_BOARD.md` is stale.
- **`/product`** — grounded in the written backlog. Use when you already trust `FEATURE_BOARD.md` and just want it Founder-Rule-audited and prioritized.

They're complementary, not redundant — `/discover` is how new things get onto the backlog; `/product` is how the backlog gets turned into a sprint.

## Steps
1. Dispatch the `product-manager` agent with no additional framing — let it run its own discovery workflow (code audit → gap-finding → Founder Rule gate → RICE scoring → ticket handoff).
2. Present its output as-is: Code Audit Findings, Candidate Features table, Recommended Next Build, Dropped.
3. Ask the user whether to:
   - Run `/build` immediately on the top-ranked ticket, or
   - Append the surviving candidates to `.claude/FEATURE_BOARD.md` for later `/product` review
