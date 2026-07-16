import type { Tree, Person, FamilyEvent, Relative } from './types'
import { tokenStore } from './auth'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await tokenStore.getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    // Try to refresh
    const refreshed = await tokenStore.refresh()
    if (refreshed) {
      const retry = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${refreshed}` },
      })
      if (!retry.ok) throw new ApiError(retry.status, await retry.json())
      return retry.json() as Promise<T>
    }
    throw new ApiError(401, { message: 'Session expired' })
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new ApiError(res.status, body)
  }

  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly body: { message?: string }) {
    super(body.message ?? `HTTP ${status}`)
  }
}

function get<T>(path: string)                              { return request<T>(path) }
function post<T>(path: string, body: unknown)              { return request<T>(path, { method: 'POST', body: JSON.stringify(body) }) }
function patch<T>(path: string, body: unknown)             { return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }) }
function del(path: string, body?: unknown)                 { return request<void>(path, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }) }

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface AuthResult {
  accessToken:  string
  refreshToken: string
  user: {
    id:           string
    username:     string
    uniqueUserId: string
    profilePicUrl: string | null
  }
}

export const authApi = {
  signup: (data: { mobileNumber: string; password: string; username: string; firstName: string; lastName: string }) =>
    post<AuthResult>('/api/v1/auth/signup', data),

  login: (data: { mobileNumber: string; password: string }) =>
    post<AuthResult>('/api/v1/auth/login', data),

  refresh: (refreshToken: string) =>
    post<{ accessToken: string; refreshToken: string }>('/api/v1/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    post<void>('/api/v1/auth/logout', { refreshToken }),

  me: () => get<AuthResult['user']>('/api/v1/auth/me'),
}

// ─── Family ─────────────────────────────────────────────────────────────────

export interface FamilyTree {
  id:           string
  name:         string
  rootPersonId: string | null
  timezone:     string
  createdAt:    string
  _count:       { persons: number; members: number; events: number }
  members?:     Array<{ role: string; joinedAt: string; user: { id: string; username: string; profilePicUrl: string | null } }>
}

export const familyApi = {
  create: (data: { name: string; firstName?: string; lastName?: string; gender?: string }) =>
    post<FamilyTree>('/api/v1/families', data),

  list: () => get<FamilyTree[]>('/api/v1/families'),

  get: (treeId: string) => get<FamilyTree>(`/api/v1/families/${treeId}`),

  generateInvite: (treeId: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') =>
    post<{ code: string; expiresInHours: number }>(`/api/v1/families/${treeId}/invites`, { role }),

  join: (code: string) => post<FamilyTree>('/api/v1/families/join', { code }),
}

// ─── Persons ────────────────────────────────────────────────────────────────

export const personApi = {
  list: (treeId: string) => get<Person[]>(`/api/v1/trees/${treeId}/persons`),

  create: (treeId: string, data: {
    firstName: string; lastName: string; gender: string;
    dateOfBirth?: string; isDeceased?: boolean; profilePicUrl?: string
  }) => post<Person>(`/api/v1/trees/${treeId}/persons`, data),

  update: (treeId: string, personId: string, data: Partial<{ firstName: string; lastName: string; isDeceased: boolean; profilePicUrl: string | null }>) =>
    patch<Person>(`/api/v1/trees/${treeId}/persons/${personId}`, data),

  delete: (treeId: string, personId: string) =>
    del(`/api/v1/trees/${treeId}/persons/${personId}`),

  relatives: (treeId: string, personId: string) =>
    get<Relative[]>(`/api/v1/trees/${treeId}/persons/${personId}/relatives`),

  addEdge: (treeId: string, data: { fromPersonId: string; toPersonId: string; relationType: string }) =>
    post<unknown>(`/api/v1/trees/${treeId}/persons/edges`, data),

  removeEdge: (treeId: string, data: { fromPersonId: string; toPersonId: string; relationType: string }) =>
    del(`/api/v1/trees/${treeId}/persons/edges`, data),
}

// ─── Events ─────────────────────────────────────────────────────────────────

export interface EventPage {
  items:      FamilyEvent[]
  nextCursor: string | undefined
  hasMore:    boolean
}

export const eventApi = {
  list: (treeId: string, params?: { cursor?: string; limit?: number; year?: number }) => {
    const q = new URLSearchParams()
    if (params?.cursor) q.set('cursor', params.cursor)
    if (params?.limit)  q.set('limit', String(params.limit))
    if (params?.year)   q.set('year', String(params.year))
    const qs = q.toString()
    return get<EventPage>(`/api/v1/trees/${treeId}/events${qs ? `?${qs}` : ''}`)
  },

  create: (treeId: string, data: {
    type: string; title: string; date: string; description?: string;
    visibility?: string; taggedPersonIds?: string[]
  }) => post<FamilyEvent>(`/api/v1/trees/${treeId}/events`, data),

  get: (treeId: string, eventId: string) =>
    get<FamilyEvent>(`/api/v1/trees/${treeId}/events/${eventId}`),

  update: (treeId: string, eventId: string, data: Partial<{ title: string; description: string; taggedPersonIds: string[] }>) =>
    patch<FamilyEvent>(`/api/v1/trees/${treeId}/events/${eventId}`, data),

  delete: (treeId: string, eventId: string) =>
    del(`/api/v1/trees/${treeId}/events/${eventId}`),

  like: (treeId: string, eventId: string) =>
    post<{ liked: boolean }>(`/api/v1/trees/${treeId}/events/${eventId}/like`, {}),

  addComment: (treeId: string, eventId: string, text: string) =>
    post<{ id: string; text: string; createdAt: string; user: { username: string; profilePicUrl: string | null } }>(`/api/v1/trees/${treeId}/events/${eventId}/comments`, { text }),

  listComments: (treeId: string, eventId: string, cursor?: string) => {
    const qs = cursor ? `?cursor=${cursor}` : ''
    return get<{ items: Array<{ id: string; text: string; createdAt: string; user: { username: string; profilePicUrl: string | null } }>; hasMore: boolean }>(`/api/v1/trees/${treeId}/events/${eventId}/comments${qs}`)
  },
}

// ─── Media ──────────────────────────────────────────────────────────────────

export const mediaApi = {
  requestUploadUrl: (treeId: string, eventId: string, data: { mimeType: string; sizeBytes: number }) =>
    post<{ uploadUrl: string; r2Key: string; type: 'PHOTO' | 'VIDEO' }>(`/api/v1/trees/${treeId}/events/${eventId}/media/upload-url`, data),

  confirmUpload: (treeId: string, eventId: string, data: { r2Key: string; type: 'PHOTO' | 'VIDEO'; sizeBytes: number; caption?: string }) =>
    post<{ id: string; url: string }>(`/api/v1/trees/${treeId}/events/${eventId}/media/confirm`, data),

  delete: (treeId: string, eventId: string, mediaId: string) =>
    del(`/api/v1/trees/${treeId}/events/${eventId}/media/${mediaId}`),
}

// ─── Legacy read-only helpers (Phase 0 compat) ───────────────────────────────

export const api = {
  health: () => get<{ status: string; version: string; timestamp: string }>('/health'),
  trees:  () => get<Tree[]>('/api/trees'),
  persons: (treeId: string) => get<Person[]>(`/api/trees/${treeId}/persons`),
  events:  (treeId: string) => get<FamilyEvent[]>(`/api/trees/${treeId}/events`),
  relatives: (treeId: string, personId: string) => get<Relative[]>(`/api/trees/${treeId}/persons/${personId}/relatives`),
}

export async function checkHealth() {
  return api.health()
}
