---
name: familyos-validate
description: "Use when a decision is high-stakes enough to need a structured, written verdict instead of a quick verbal challenge — new architecture, a build-vs-buy call, an aggressive timeline, or anything /debate or /review is asked to settle. Produces an 8-section validation report with a deterministic verdict, so 'give feedback' becomes a repeatable procedure instead of free-form prose."
---

# FamilyOS Validation Report

A fixed report format for evaluating a plan, proposal, or architecture decision. Use this instead of open-ended commentary whenever the stakes justify the extra structure — routine tickets don't need it; `devil-advocate`'s short-form output (3 challenges + verdict) is enough for those.

## When to reach for this

- `/debate` or `/review` is evaluating something with real cost to reverse (schema change, new dependency, a "this is how we'll do X from now on" decision)
- The `cto` agent is choosing between two or more real architectural options, not just approving a ticket
- The `devil-advocate` agent's short-form challenge surfaced 2+ HIGH-severity issues and the decision needs a paper trail, not just a verdict

## The 8 Sections

```
## 1. Summary
[One paragraph: what's being proposed, in plain language]

## 2. Stated Assumptions
[List every assumption the proposal depends on — timeline, resource, technical,
business, external. Flag "wishful thinking" phrasing verbatim if present:
"should only take...", "we'll just...", "users probably won't...", "we can always
migrate later..." — these are where plans quietly go wrong.]

## 3. Founder Rule Check
[PASS / FAIL / CHALLENGE — does this verify identity, build hierarchy, or help
relive a memory? If FAIL, stop here; the remaining sections are moot.]

## 4. Anti-Pattern Scan
[Walk the catalog in devil-advocate.md's "FamilyOS Anti-Pattern Catalog" section.
List every pattern that matches, with severity. Empty is a valid, good result —
don't manufacture a match to look thorough.]

## 5. Risk Dimensions
[Score each 1-5 (5 = highest risk), one line of justification each:
 - Timeline risk (is the estimate realistic given what's actually being built?)
 - Technical risk (new tech, unproven approach, or well-trodden path?)
 - Security/privacy risk (new attack surface, data exposure?)
 - Performance risk (query pattern, bundle size, N+1 potential?)
 - Reversibility (how expensive is it to undo this later?)]

## 6. Strongest Counter-Argument
[The single best case AGAINST doing this, stated as strongly as the case for it.
If you can't construct a real counter-argument, say so explicitly rather than
inventing a weak one.]

## 7. Verdict
[Run devil-advocate.md's Verdict Decision Tree. State which rule fired and why.
PROCEED / PROCEED (with conditions) / REDESIGN / REJECT]

## 8. Path Forward
[If PROCEED (with conditions): the exact conditions, which become the Monitor
agent's checklist.
If REDESIGN: exactly what must change before this comes back for another pass.
If REJECT: what the real underlying need was, and what smaller thing (if
anything) actually satisfies it.]
```

## Notes on filling this out honestly

- Section 2 is the highest-leverage section — most bad plans fail here, not in the technical sections. Read every sentence of the proposal looking for a verb doing unearned work ("simply", "just", "should").
- Section 4 should cite the anti-pattern catalog by name (`docs/SMELLS.md` has the full precedent list) — a named pattern is more useful to future-you than a fresh paragraph of prose re-deriving the same concern.
- Section 6 is not optional box-checking — if the proposal is genuinely sound, construct the counter-argument anyway and then explain why it doesn't hold. That's what makes the verdict trustworthy rather than rubber-stamped.
- Keep the whole report scannable. Each section is a paragraph or a short list, not an essay.
