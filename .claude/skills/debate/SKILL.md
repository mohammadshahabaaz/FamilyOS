---
name: debate
description: Trigger a Devil's Advocate vs CTO structured debate on any technical decision, feature, or architecture question. No code is written — this produces a decision document.
argument-hint: <technical decision or design question>
disable-model-invocation: true
---

# /debate — Technical Decision Debate

**Topic:** $ARGUMENTS

---

Run a structured debate between the CTO and Devil's Advocate. No code is written here — the output is a decision with clear rationale.

## Round 1 — CTO Position

Activate the `cto` agent persona.

State the CTO's position on this topic:
- What is the proposed approach?
- Why this approach over obvious alternatives?
- What does this unlock for FamilyOS?
- How does this pass the Founder Rule?

## Round 2 — Devil's Advocate Attacks

Activate the `devil-advocate` agent persona.

Challenge the CTO position ruthlessly from all angles:
- Architectural correctness (invariants, schema, relationships)
- Security and privacy surface
- Scope creep and Founder Rule edge cases
- Performance implications
- Developer experience / maintainability

Present the 3 strongest objections, each with: the risk, the worst-case outcome, and the question the CTO must answer.

## Round 3 — CTO Rebuttal

Activate `cto` agent persona again.

Address each objection:
- For valid objections: adapt the approach
- For invalid objections: explain why the concern doesn't apply
- State the final, revised position

## Round 4 — Verdict

The CTO issues the final decision:

```
## Decision: PROCEED / PROCEED WITH CHANGES / DEFER / REJECT

### What We Build
[exact scope]

### What We Explicitly Do Not Build
[explicit out-of-scope items]

### Conditions
[any requirements that must be true before/during building]

### Devil's Advocate Raised One Valid Point
[what changed because of the debate — or "position unchanged"]

### Success Criteria
[how we know this is done and correct]
```
