---
name: design
description: Design a new screen or component before coding begins. CTO frames the requirements, Devil's Advocate challenges the UX assumptions, and the Product Designer agent produces a detailed layout spec.
argument-hint: <screen or component name>
disable-model-invocation: true
---

You are running the design pipeline for: **$ARGUMENTS**

## Step 1 — CTO frames requirements

Apply the Founder Rule. Then answer:
- Who uses this screen and when?
- What is the ONE job this screen does?
- What data does it read? (list API calls needed)
- What actions does it support? (list mutations)
- What is the happy path? (step-by-step user journey)
- What are the edge cases? (empty state, loading, error, no-permission)

## Step 2 — Devil's Advocate challenges

Challenge the UX assumptions:
- Is this screen necessary or can it be merged with an existing screen?
- Is the data model supporting this feasible without new API routes?
- What could go wrong UX-wise when family members use this on mobile web?
- Is there a simpler version that delivers 80% of the value?

## Step 3 — Product Designer specifies the layout

Dispatch the `product-designer` agent (Mode 2 — spec a new screen). Using the FamilyOS design system (Indigo Heritage, `C.*` tokens, Georgia serif for names, Inter for UI):

Produce a component-level layout spec:

```
Screen: [name]
Route: screen.name === '[name]'

Layout:
  TopBar: [title | back behavior]
  ScrollView / FlatList:
    - [Section 1]: [components, data source, interaction]
    - [Section 2]: ...
  BottomTabs: [which tab is active]
  FAB: [visible? what does it do?]

Empty state: [what renders when data = []]
Loading state: [ActivityIndicator? skeleton? what shows]
Error state: [what renders on API failure]

API calls:
  - [GET /api/v1/...] → [type]
  - [POST /api/v1/...] → [type]

New files needed: [list]
Files to edit: [list]
```

## Step 4 — Greenlight decision

CTO gives a final GO / NO-GO with rationale. If GO, hand off to `/build [screen-name]`.
