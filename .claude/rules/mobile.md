---
paths:
  - "apps/mobile/**"
---

# Mobile rules (`apps/mobile`)

- `App.tsx` owns auth hydration, screen-routing state, and data loading (no router library). `authUser` is null on reload — `loadData()` always calls `authApi.me()` first.
- `src/lib/api.ts` — typed fetch client, auto-refreshes on 401; base URL `EXPO_PUBLIC_API_URL` (default `http://localhost:3000`).
- `src/lib/theme.ts` — `C.*` tokens as CSS custom properties, three themes, `applyTheme()` at runtime. **Never use `C.*` for `Switch.trackColor/thumbColor`** — use `THEMES[activeTheme].*` hex.
- `src/lib/media-upload.ts` — shared compress/upload helper for events and stories.
- Web-only styles use `// @ts-ignore` style props. Full design-system rules live in the `familyos-ui` skill.
