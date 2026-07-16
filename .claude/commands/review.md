---
description: CTO architecture review of a file, module, or recent changes. Returns a structured assessment with issues and recommended fixes.
argument-hint: <file path or module name or "recent changes">
---

# /review — Architecture Review

**Subject:** $ARGUMENTS

---

Activate the `cto` agent persona. Conduct a thorough review.

## What To Check

### 1. Founder Rule compliance
Does the code build something outside the allowed scope?

### 2. Invariant violations
- Relationship label stored in DB?
- New edge type beyond PARENT/SPOUSE/SIBLING?
- BigInt field leaking into JSON response?
- Cross-tree query without TreeLink check?
- `migrate dev` called instead of `db push`?
- `db.familyEvent` instead of `db.event`?
- `authorId` instead of `userId` on Comment?

### 3. Security issues
- Unauthenticated endpoint that should be protected?
- Missing `treeId` filter (IDOR risk)?
- Password or token in a log statement?
- R2 presign pattern bypassed?

### 4. Performance issues
- N+1 query in a loop?
- BFS adjacency list rebuilt inside a per-person loop?
- Full object returned when only a subset is needed?
- BigInt arithmetic using floats?

### 5. TypeScript correctness
- `any` types hiding real type errors?
- Missing null checks on optional fields?
- `@ts-ignore` used outside the approved web-CSS patterns?

### 6. Frontend (if reviewing mobile code)
- Hardcoded hex colors instead of theme tokens?
- `stickyHeaderIndices` used (doesn't work on web)?
- New bottom tab added (limit is 3)?
- Non-theme background/text colors?

## Output Format

```
## Review: [subject]

### Critical Issues (must fix before ship)
1. [issue] — [file:line] — [why it's critical]

### Warnings (should fix)
1. [issue] — [file:line] — [recommendation]

### Minor Notes (optional improvements)
1. [issue] — [file:line] — [suggestion]

### Verdict: APPROVE / APPROVE WITH FIXES / REWORK REQUIRED
```
