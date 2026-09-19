// FamilyOS Design System
// CSS custom properties let us switch themes at runtime without re-rendering.
// react-native-web's isWebColor() whitelists 'var(--*)' strings, so they pass
// through to CSS correctly for all properties including Text color.
// NOTE: Switch trackColor/thumbColor bypass this — always pass THEMES[name].* hex values.

export type ThemeName =
  | 'warm' // Indigo Heritage (default)
  | 'light' // Forest Amber
  | 'dark' // Midnight
  | 'rose' // Rose Blossom
  | 'forest' // Forest Green
  | 'royal' // Royal Purple
  | 'ocean' // Ocean Blue
  | 'sunset' // Sunset Coral
  | 'slate' // Slate Storm
  | 'golden' // Golden Harvest

// All colours reference CSS custom properties set by applyTheme()
export const C = {
  bg: 'var(--fo-bg)',
  surface: 'var(--fo-surface)',
  surfaceEl: 'var(--fo-surface-el)',
  textPrimary: 'var(--fo-text)',
  textSecondary: 'var(--fo-text-sec)',
  accent: 'var(--fo-accent)',
  accentSoft: 'var(--fo-accent-soft)',
  accentBg: 'var(--fo-accent-bg)',
  border: 'var(--fo-border)',
  borderSoft: 'var(--fo-border-soft)',
  inMemoriam: 'var(--fo-in-memoriam)',
  danger: 'var(--fo-danger)',
  success: 'var(--fo-success)',
  info: 'var(--fo-info)',
} as const

export const F = {
  serif: `'Georgia', 'Times New Roman', serif`,
  sans: `'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif`,
} as const

export const shadow = {
  card: '0 1px 6px rgba(0,0,0,0.07)',
  modal: '0 8px 32px rgba(0,0,0,0.14)',
  fab: '0 4px 16px rgba(61,82,160,0.28)',
} as const

// ─── Theme presets ────────────────────────────────────────────────────────────

export type ThemeColors = {
  bg: string
  surface: string
  surfaceEl: string
  text: string
  textSec: string
  accent: string
  accentSoft: string
  accentBg: string
  border: string
  borderSoft: string
  inMemoriam: string
  danger: string
  success: string
  info: string
}

export const THEMES: Record<ThemeName, ThemeColors & { label: string; preview: [string, string] }> =
  {
    // 1. Indigo Heritage — clean, modern, trustworthy
    warm: {
      label: 'Indigo',
      preview: ['#F7F8FC', '#3D52A0'],
      bg: '#F7F8FC',
      surface: '#FFFFFF',
      surfaceEl: '#F0F2F8',
      text: '#0F1523',
      textSec: '#5A6580',
      accent: '#3D52A0',
      accentSoft: '#7091D4',
      accentBg: '#EBF0FB',
      border: '#DDE2EF',
      borderSoft: '#EEF1F9',
      inMemoriam: '#8A93A8',
      danger: '#C0392B',
      success: '#27AE60',
      info: '#2980B9',
    },
    // 2. Forest Amber — warm, organic, generational
    light: {
      label: 'Amber',
      preview: ['#FBF8F3', '#C85A11'],
      bg: '#FBF8F3',
      surface: '#FFFFFF',
      surfaceEl: '#F5F0E6',
      text: '#1A120B',
      textSec: '#7A6652',
      accent: '#C85A11',
      accentSoft: '#E8956B',
      accentBg: '#FDF0E6',
      border: '#E8DDD0',
      borderSoft: '#F2EDE6',
      inMemoriam: '#9E9080',
      danger: '#B53B2F',
      success: '#3A7D44',
      info: '#2C6E91',
    },
    // 3. Midnight — premium dark, sleek and private
    dark: {
      label: 'Midnight',
      preview: ['#0E0F14', '#6C8BF5'],
      bg: '#0E0F14',
      surface: '#17191F',
      surfaceEl: '#20222B',
      text: '#E8EAF2',
      textSec: '#8990A8',
      accent: '#6C8BF5',
      accentSoft: '#9DAFE8',
      accentBg: '#1C2140',
      border: '#2C2F3D',
      borderSoft: '#1F2230',
      inMemoriam: '#4A5068',
      danger: '#E05547',
      success: '#4CAF7D',
      info: '#5BA4CF',
    },
    // 4. Rose Blossom — soft feminine, romantic, celebratory
    rose: {
      label: 'Rose',
      preview: ['#FFF5F7', '#E91E8C'],
      bg: '#FFF5F7',
      surface: '#FFFFFF',
      surfaceEl: '#FDE8EF',
      text: '#1A0A10',
      textSec: '#7A4A5E',
      accent: '#D81B60',
      accentSoft: '#F06292',
      accentBg: '#FCE4EC',
      border: '#F5C6D8',
      borderSoft: '#FDE8EF',
      inMemoriam: '#B07A8E',
      danger: '#C62828',
      success: '#2E7D32',
      info: '#1565C0',
    },
    // 5. Forest Green — earthy, grounded, heritage
    forest: {
      label: 'Forest',
      preview: ['#F0F5F0', '#2D6A4F'],
      bg: '#F0F5F0',
      surface: '#FFFFFF',
      surfaceEl: '#E2EDE2',
      text: '#0D1F0F',
      textSec: '#4A6650',
      accent: '#1B4332',
      accentSoft: '#52B788',
      accentBg: '#D8F3DC',
      border: '#B7DEC2',
      borderSoft: '#D8EDD8',
      inMemoriam: '#74A17D',
      danger: '#B53B2F',
      success: '#1B5E20',
      info: '#0D47A1',
    },
    // 6. Royal Purple — dignified, elegant, aristocratic
    royal: {
      label: 'Royal',
      preview: ['#F5F0FF', '#5B21B6'],
      bg: '#F5F0FF',
      surface: '#FFFFFF',
      surfaceEl: '#EDE9FE',
      text: '#1A0A2E',
      textSec: '#6B4E8A',
      accent: '#5B21B6',
      accentSoft: '#8B5CF6',
      accentBg: '#EDE9FE',
      border: '#DDD6FE',
      borderSoft: '#EDE9FE',
      inMemoriam: '#9C7BB5',
      danger: '#C0392B',
      success: '#15803D',
      info: '#1D4ED8',
    },
    // 7. Ocean Blue — calm, vast, timeless
    ocean: {
      label: 'Ocean',
      preview: ['#F0F7FF', '#0369A1'],
      bg: '#F0F7FF',
      surface: '#FFFFFF',
      surfaceEl: '#E0F0FA',
      text: '#0A1929',
      textSec: '#3D6680',
      accent: '#0369A1',
      accentSoft: '#38BDF8',
      accentBg: '#E0F2FE',
      border: '#BAE6FD',
      borderSoft: '#E0F2FE',
      inMemoriam: '#6B9AB8',
      danger: '#B91C1C',
      success: '#166534',
      info: '#075985',
    },
    // 8. Sunset Coral — vibrant, warm, energetic
    sunset: {
      label: 'Sunset',
      preview: ['#FFF7ED', '#EA580C'],
      bg: '#FFF7ED',
      surface: '#FFFFFF',
      surfaceEl: '#FEF3C7',
      text: '#1C0A00',
      textSec: '#78500A',
      accent: '#EA580C',
      accentSoft: '#FB923C',
      accentBg: '#FED7AA',
      border: '#FCD1A0',
      borderSoft: '#FEE8D0',
      inMemoriam: '#B8935A',
      danger: '#9B1C1C',
      success: '#14532D',
      info: '#1E3A5F',
    },
    // 9. Slate Storm — professional, neutral, sophisticated
    slate: {
      label: 'Slate',
      preview: ['#F1F5F9', '#334155'],
      bg: '#F1F5F9',
      surface: '#FFFFFF',
      surfaceEl: '#E2E8F0',
      text: '#0F172A',
      textSec: '#475569',
      accent: '#334155',
      accentSoft: '#64748B',
      accentBg: '#E2E8F0',
      border: '#CBD5E1',
      borderSoft: '#E2E8F0',
      inMemoriam: '#94A3B8',
      danger: '#DC2626',
      success: '#16A34A',
      info: '#2563EB',
    },
    // 10. Golden Harvest — rich, warm, festive
    golden: {
      label: 'Golden',
      preview: ['#FEFCE8', '#B45309'],
      bg: '#FEFCE8',
      surface: '#FFFFFF',
      surfaceEl: '#FEF9C3',
      text: '#1C1200',
      textSec: '#735714',
      accent: '#B45309',
      accentSoft: '#D97706',
      accentBg: '#FEF3C7',
      border: '#FDE68A',
      borderSoft: '#FEF9C3',
      inMemoriam: '#B8975A',
      danger: '#991B1B',
      success: '#14532D',
      info: '#1E3A5F',
    },
  }

// Maps ThemeColors key → CSS custom property name
const VAR: Record<keyof ThemeColors, string> = {
  bg: '--fo-bg',
  surface: '--fo-surface',
  surfaceEl: '--fo-surface-el',
  text: '--fo-text',
  textSec: '--fo-text-sec',
  accent: '--fo-accent',
  accentSoft: '--fo-accent-soft',
  accentBg: '--fo-accent-bg',
  border: '--fo-border',
  borderSoft: '--fo-border-soft',
  inMemoriam: '--fo-in-memoriam',
  danger: '--fo-danger',
  success: '--fo-success',
  info: '--fo-info',
}

export function applyTheme(name: ThemeName) {
  if (typeof document === 'undefined') return
  const t = THEMES[name]
  const root = document.documentElement
  for (const [key, varName] of Object.entries(VAR)) {
    root.style.setProperty(varName, (t as unknown as Record<string, string>)[key])
  }
  try {
    localStorage.setItem('fo-theme', name)
  } catch {}
}

export function getStoredTheme(): ThemeName {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem('fo-theme') : null
    const valid: ThemeName[] = [
      'warm',
      'light',
      'dark',
      'rose',
      'forest',
      'royal',
      'ocean',
      'sunset',
      'slate',
      'golden',
    ]
    if (v && valid.includes(v as ThemeName)) return v as ThemeName
  } catch {}
  return 'warm'
}

export function initTheme() {
  applyTheme(getStoredTheme())
}

// ─── Global CSS injection for responsive layout + hover effects ───────────────

export function injectGlobalStyles() {
  if (typeof document === 'undefined') return
  const id = 'fo-global-styles'
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = `
    /* ── Responsive container ── */
    html, body, #root { height: 100%; margin: 0; padding: 0; }
    body { background: var(--fo-bg, #F7F8FC); }

    @media (min-width: 600px) {
      /* Tablet: center content up to 540px */
      #root > div > div { max-width: 540px; margin: 0 auto; }
    }
    @media (min-width: 900px) {
      /* Desktop: phone shell simulation */
      body { display: flex; align-items: flex-start; justify-content: center; padding-top: 32px; padding-bottom: 32px; min-height: 100vh; }
      #root { width: 430px; max-height: calc(100vh - 64px); border-radius: 32px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.22); position: relative; }
      #root > div { height: calc(100vh - 64px) !important; }
    }

    /* ── Hover lift effect — opt-in only (.fo-lift), never blanket ──
       [role="button"] is applied by react-native-web to every TouchableOpacity,
       including full-width list rows (settings rows, notification items, tab
       bars) — a blanket rule on that selector made those rows visibly levitate
       off the page on hover. Reserved for actual cards/primary buttons instead. */
    .fo-lift {
      transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease !important;
    }
    .fo-lift:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(0,0,0,0.13) !important;
    }
    .fo-lift:active {
      transform: translateY(0px) !important;
      opacity: 0.88 !important;
    }

    /* ── Smooth scrolling ── */
    * { scroll-behavior: smooth; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--fo-border, #DDE2EF); border-radius: 2px; }

    /* ── Date input styling ── */
    input[type="date"] { font-family: 'Inter', system-ui, sans-serif; }
    input[type="date"]:focus { outline: 2px solid var(--fo-accent, #3D52A0) !important; border-color: var(--fo-accent, #3D52A0) !important; }
  `
  document.head.appendChild(style)
}
