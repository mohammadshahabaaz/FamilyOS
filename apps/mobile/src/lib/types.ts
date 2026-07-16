export interface Tree {
  id: string
  name: string
  createdAt: string
  rootPersonId?: string | null
  timezone?: string
  _count: { persons: number; members: number; events: number }
  members?: Array<{ role: string; joinedAt: string; user?: { id: string; username: string; profilePicUrl: string | null } }>
}

export interface Person {
  id: string
  firstName: string
  lastName: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  dateOfBirth?: string | null
  isDeceased?: boolean
  profilePicUrl?: string | null
  linkedUserId?: string | null
  linkedUser?: { username: string } | null
}

export interface MediaItem {
  id: string
  type: string
  caption: string | null
  url: string
  thumbnail: string
}

export interface FamilyEvent {
  id: string
  type: string
  title: string
  description: string | null
  date: string
  createdBy?: { id: string; username: string; profilePicUrl?: string | null } | null
  taggedPersons: Person[]
  media: MediaItem[]
  commentCount: number
  likeCount: number
  likedByMe?: boolean
}

export interface Relative {
  person: Person
  relationship: string
  pathDebug: string
}

export const EVENT_GRADIENT: Record<string, string[]> = {
  BIRTHDAY:    ['#F9A8D4', '#EC4899'],
  WEDDING:     ['#C4B5FD', '#8B5CF6'],
  TRIP:        ['#93C5FD', '#3B82F6'],
  GATHERING:   ['#6EE7B7', '#10B981'],
  ACHIEVEMENT: ['#FDE68A', '#F59E0B'],
  MEMORIAL:    ['#CBD5E1', '#64748B'],
  ANNIVERSARY: ['#FCA5A5', '#EF4444'],
  GRADUATION:  ['#A7F3D0', '#059669'],
  OTHER:       ['#E5E7EB', '#9CA3AF'],
  CUSTOM:      ['#E5E7EB', '#9CA3AF'],
}

export const EVENT_LABEL: Record<string, string> = {
  BIRTHDAY: 'Birthday', WEDDING: 'Wedding', TRIP: 'Trip',
  GATHERING: 'Gathering', ACHIEVEMENT: 'Achievement', MEMORIAL: 'Memorial',
  ANNIVERSARY: 'Anniversary', GRADUATION: 'Graduation', OTHER: 'Memory', CUSTOM: 'Event',
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'Today'
  if (d === 1) return '1 day ago'
  if (d < 7) return `${d} days ago`
  if (d < 30) return `${Math.floor(d / 7)}w`
  if (d < 365) return `${Math.floor(d / 30)}mo`
  return `${Math.floor(d / 365)}y`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function birthYear(iso: string | null | undefined): string | null {
  return iso ? String(new Date(iso).getFullYear()) : null
}

// ─── Family circle classification ────────────────────────────────────────────
// Used for feed filtering and event invitation groups.
// Dadiyal = paternal side (father's family), Naniyal = maternal side (mother's family).
// Engine must produce "Paternal X" / "Maternal X" labels for Dadiyal/Naniyal to populate.

export type FamilyCircle = 'close' | 'dadiyal' | 'naniyal' | 'internal' | 'extended'

const CLOSE_SET = new Set([
  'Father','Mother','Son','Daughter','Brother','Sister',
  'Half-Brother','Half-Sister','Husband','Wife','Spouse',
  'Stepfather','Stepmother','Step-Father','Step-Mother',
  'Stepson','Stepdaughter','Step-Son','Step-Daughter',
])

export function getFamilyCircle(relationship: string): FamilyCircle {
  if (CLOSE_SET.has(relationship)) return 'close'
  if (/paternal/i.test(relationship) || /father'?s/i.test(relationship)) return 'dadiyal'
  if (/maternal/i.test(relationship) || /mother'?s/i.test(relationship)) return 'naniyal'
  if (/uncle-in-law|aunt-in-law|in-law/i.test(relationship)) return 'extended'
  if (/grandfather|grandmother|uncle|aunt|nephew|niece/i.test(relationship)) return 'internal'
  return 'extended'
}

export const FAMILY_CIRCLE_LABELS: Record<FamilyCircle | 'all', string> = {
  all:      'All',
  close:    'Close',
  dadiyal:  'Dadiyal',
  naniyal:  'Naniyal',
  internal: 'Internal',
  extended: 'Extended',
}
