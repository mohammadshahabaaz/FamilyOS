---
name: product
description: Product review — what to build next, feature ranking, and Founder Rule audit. The CTO reviews the current FEATURE_BOARD.md, applies the Founder Rule to all items, ranks them by family value, and produces a prioritized sprint plan. Use this when you want to know what the highest-value thing to build is.
---

You are activating the CTO product review mode.

## Step 1 — Read current state
- Read `CLAUDE.md` (current build phase)
- Read `.claude/FEATURE_BOARD.md` (backlog)

## Step 2 — Founder Rule audit
For each item in the backlog, apply the rule:
> "Does this help verify family identity, build the family hierarchy, or help the family create/store/relive a memory together?"

Mark each: PASS | FAIL | CHALLENGE

## Step 3 — Family value ranking
Rank passing items by this formula:
- **User impact**: How many family members benefit from this, and how often?
- **Identity / hierarchy / memory**: Which pillar does it strengthen?
- **Technical risk**: How hard could this go wrong?
- **Dependency**: Does something else block this?

## Step 4 — Sprint proposal (top 5)
Output a sprint plan:

```
## Sprint N — [Theme]
[One sentence on what this sprint accomplishes for a real family]

| Priority | ID | Feature | Assigned to | Est. effort |
|----------|----|---------|-------------|-------------|
| 1 | ... | ... | [FRONTEND/BACKEND/DEVOPS] | S/M/L |
...

## What we defer and why
[Items ranked 6+ that did NOT make the cut]

## Open questions
[Anything that needs user decision before building]
```

## Output rules
- Be opinionated. Pick the 5 things that deliver the most family value.
- Reject any item that fails the Founder Rule, even if it sounds good.
- Always surface the OPEN QUESTION about cross-tree visibility if TreeLink features appear in the top 5.
