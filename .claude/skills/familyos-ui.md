---
name: familyos-ui
description: "Use when building or modifying any UI component or screen in FamilyOS. Enforces the warm parchment design system, react-native-web constraints, and the Founder Rule. Activate for any frontend ticket."
---

# FamilyOS UI Skill

## Pre-Flight Checklist (run before writing a single line)

1. Does this UI change pass the Founder Rule? (family identity / hierarchy / memory)
2. Am I importing `{ C, F, shadow }` from `'../lib/theme'`?
3. Is the component strictly within the existing navigation structure (no new tabs)?
4. Have I checked whether this needs a web-specific `@ts-ignore` style?

## Design System Rules

**Always use theme tokens. Never hardcode colors.**

```ts
import { C, F, shadow } from '../lib/theme'
// C.bg, C.surface, C.accent, C.textPrimary, C.textSecondary, etc.
// F.serif, F.sans
// shadow.card, shadow.modal, shadow.fab
```

**Typography hierarchy:**
- H1 names/titles: `fontFamily: F.serif, fontWeight: '800', color: C.textPrimary`
- H2 section: `fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: C.textSecondary`
- Body: `fontSize: 14, color: C.textPrimary, lineHeight: 20`
- Meta/label: `fontSize: 12, color: C.textSecondary`
- Dates (italic serif): `fontFamily: F.serif, fontStyle: 'italic', color: C.accentSoft`

**Spacing rhythm:** 4px base unit. Use multiples: 4, 8, 12, 16, 20, 24.

**Border radius:** 8 (small), 10 (medium tile), 12-14 (card), 16 (FAB), 20 (pill badge).

## React-Native-Web Constraints

| CSS property | How to apply |
|---|---|
| `background: linear-gradient(...)` | `// @ts-ignore` on View style |
| `boxShadow: '...'` | `// @ts-ignore` on View/TouchableOpacity style |
| `cursor: 'pointer'` | `// @ts-ignore` on TouchableOpacity style |
| `outlineStyle: 'none'` | `// @ts-ignore` on TextInput style |
| `objectPosition: 'center top'` | `// @ts-ignore` on Image style |
| `textTransform: 'uppercase'` | `// @ts-ignore` on Text style |
| `fontFamily: F.serif` | `// @ts-ignore` on Text style |
| `fontStyle: 'italic'` | `// @ts-ignore` on Text style |

**Critical scroll rule:**
- `html,body,#root{height:100%;overflow:hidden;}` is injected in `index.js` — do NOT remove
- Do NOT add `overflow: 'auto'` to any wrapper View — it creates competing scroll containers
- Stories row MUST be outside (above) the ScrollView — `stickyHeaderIndices` is broken on web

## Component Construction Pattern

**Cards:**
```tsx
<View style={{
  backgroundColor: C.surface,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: C.border,
  // @ts-ignore
  boxShadow: shadow.card,
  overflow: 'hidden',
}}>
```

**Avatar ring (square style):**
```tsx
<View style={{
  borderRadius: 10, padding: 2,
  // @ts-ignore
  background: `linear-gradient(135deg, ${C.accent}, ${C.accentSoft})`,
}}>
  <View style={{ borderRadius: 8, borderWidth: 2, borderColor: C.surface, overflow: 'hidden' }}>
    {/* image or initials */}
  </View>
</View>
```

**Section header:**
```tsx
<Text style={{
  fontSize: 11, fontWeight: '800', color: C.textSecondary,
  letterSpacing: 1,
  // @ts-ignore
  textTransform: 'uppercase',
}}>SECTION TITLE</Text>
```

**Primary CTA button:**
```tsx
<TouchableOpacity style={{
  backgroundColor: C.accent, borderRadius: 8,
  paddingVertical: 10, alignItems: 'center',
  // @ts-ignore
  cursor: 'pointer',
}}>
  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Action</Text>
</TouchableOpacity>
```

## Navigation Contract

Current screens and their access paths:

| Screen | Accessed from |
|--------|---------------|
| `feed` | BottomTabs "Home" |
| `members` | BottomTabs "Family" |
| `events` | BottomTabs "Timeline" |
| `person` | StoryCircle / PersonTile / tagged persons |
| `profile` | TopBar avatar (any root screen) |
| `settings` | ProfileScreen → Security |
| `createEvent` | FAB (bottom-right floating button) |
| `addPerson` | MembersScreen → "+ Add" |

**Never add a 4th bottom tab.** If you need a new screen, access it from an existing screen or TopBar.

## Delivery Checklist

Before reporting done:
- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] No hardcoded hex colors outside theme.ts
- [ ] No `stickyHeaderIndices` used
- [ ] No `overflow: 'auto'` added to a wrapper
- [ ] Expo serves at http://localhost:8081
- [ ] Golden path works in browser (login → navigate → core action)
- [ ] Empty states handled (no data → clear message)
- [ ] Deceased members render with `inMemoriam` tint, not full color
