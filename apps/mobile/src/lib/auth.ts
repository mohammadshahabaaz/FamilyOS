import { Platform } from 'react-native'
import { authApi } from './api'

// ─── Token store ─────────────────────────────────────────────────────────────
// Web: persists to localStorage
// Native: in-memory (upgrade to expo-secure-store when needed)

const KEYS = { access: 'fo_access', refresh: 'fo_refresh' }

function persist(key: string, value: string | null) {
  if (Platform.OS !== 'web') return
  try {
    value === null
      ? localStorage.removeItem(key)
      : localStorage.setItem(key, value)
  } catch {}
}

function read(key: string): string | null {
  if (Platform.OS !== 'web') return null
  try { return localStorage.getItem(key) } catch { return null }
}

let _access:  string | null = read(KEYS.access)
let _refresh: string | null = read(KEYS.refresh)

export const tokenStore = {
  set(access: string, refresh: string) {
    _access  = access
    _refresh = refresh
    persist(KEYS.access,  access)
    persist(KEYS.refresh, refresh)
  },

  clear() {
    _access  = null
    _refresh = null
    persist(KEYS.access,  null)
    persist(KEYS.refresh, null)
  },

  async getAccessToken(): Promise<string | null> {
    return _access
  },

  // Returns new access token if refresh succeeded, null otherwise
  async refresh(): Promise<string | null> {
    if (!_refresh) return null
    try {
      const tokens = await authApi.refresh(_refresh)
      tokenStore.set(tokens.accessToken, tokens.refreshToken)
      return tokens.accessToken
    } catch {
      tokenStore.clear()
      return null
    }
  },

  isLoggedIn(): boolean {
    return _access !== null
  },
}

// ─── Auth actions (use these from screens) ────────────────────────────────────

export interface AuthUser {
  id:           string
  username:     string
  uniqueUserId: string
  profilePicUrl: string | null
}

export async function login(mobileNumber: string, password: string): Promise<AuthUser> {
  const result = await authApi.login({ mobileNumber, password })
  tokenStore.set(result.accessToken, result.refreshToken)
  return result.user
}

export async function signup(data: {
  mobileNumber: string
  password:     string
  username:     string
  firstName:    string
  lastName:     string
}): Promise<AuthUser> {
  const result = await authApi.signup(data)
  tokenStore.set(result.accessToken, result.refreshToken)
  return result.user
}

export async function logout() {
  const refresh = _refresh
  tokenStore.clear()
  if (refresh) {
    authApi.logout(refresh).catch(() => {})
  }
}
