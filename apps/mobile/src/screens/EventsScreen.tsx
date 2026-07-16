import { useState, useMemo } from 'react'
import {
  ScrollView, View, Text, Image, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native'
import type { FamilyEvent } from '../lib/types'
import { EVENT_GRADIENT, EVENT_LABEL, formatDate } from '../lib/types'
import type { Screen } from '../../App'
import { C, F, shadow } from '../lib/theme'
import EventDetailModal from '../components/EventDetailModal'

// Helper: pick the accent color from the first event on a date
function eventAccent(events: FamilyEvent[]): string {
  if (!events?.length) return C.accent
  return EVENT_GRADIENT[events[0].type]?.[1] ?? '#3D52A0'
}

interface Props {
  events: FamilyEvent[]
  treeId: string
  navigateTo: (s: Screen) => void
  refreshing?: boolean
  onRefresh?: () => void
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ─── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ events, onDateSelect }: { events: FamilyEvent[]; onDateSelect: (e: FamilyEvent) => void }) {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-based

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1) }
    else setViewMonth(m => m - 1)
  }
  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1) }
    else setViewMonth(m => m + 1)
  }

  // Build a Set<string> of "YYYY-MM-DD" dates that have events
  const eventsByDate = useMemo(() => {
    const map: Record<string, FamilyEvent[]> = {}
    for (const e of events) {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(e)
    }
    return map
  }, [events])

  const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Build grid cells (nulls = blank padding before the 1st)
  const cells: Array<number | null> = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <View style={calStyles.root}>
      {/* Month header */}
      <View style={calStyles.header}>
        <TouchableOpacity onPress={prev} style={calStyles.navBtn} activeOpacity={0.7}>
          <Text style={calStyles.navIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={calStyles.monthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={next} style={calStyles.navBtn} activeOpacity={0.7}>
          <Text style={calStyles.navIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week header */}
      <View style={calStyles.dow}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <Text key={i} style={calStyles.dowLabel}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={calStyles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`pad-${i}`} style={calStyles.cell} />
          const key = `${viewYear}-${viewMonth}-${day}`
          const dayEvents = eventsByDate[key]
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
          const accent = dayEvents ? eventAccent(dayEvents) : null
          return (
            <TouchableOpacity
              key={day}
              style={[
                calStyles.cell,
                isToday && calStyles.todayCell,
                // Colored fill for event dates — beats a tiny dot for discoverability
                dayEvents && !isToday && {
                  // @ts-ignore
                  background: `linear-gradient(135deg, ${EVENT_GRADIENT[dayEvents[0].type]?.[0] ?? '#EBF0FB'}, ${EVENT_GRADIENT[dayEvents[0].type]?.[1] ?? '#3D52A0'})`,
                  borderRadius: 8,
                },
              ]}
              activeOpacity={dayEvents ? 0.75 : 1}
              onPress={() => dayEvents?.[0] && onDateSelect(dayEvents[0])}
            >
              <Text style={[
                calStyles.dayNum,
                isToday && calStyles.todayNum,
                dayEvents && !isToday && calStyles.eventDayNum,
              ]}>
                {day}
              </Text>
              {dayEvents && dayEvents.length > 1 && (
                <Text style={calStyles.eventCount}>+{dayEvents.length}</Text>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const calStyles = StyleSheet.create({
  root: {
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  navBtn: { padding: 6 },
  navIcon: { fontSize: 22, color: C.accent, fontWeight: '700', lineHeight: 24 },
  monthTitle: {
    fontSize: 14, fontWeight: '700', color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
  },
  dow: { flexDirection: 'row', paddingHorizontal: 4 },
  dowLabel: {
    flex: 1, textAlign: 'center', fontSize: 10,
    fontWeight: '700', color: C.textSecondary, paddingBottom: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4 },
  cell: {
    width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4, minHeight: 34,
  },
  todayCell: {
    // @ts-ignore
    backgroundColor: C.accentBg, borderRadius: 8,
  },
  dayNum: { fontSize: 12, color: C.textPrimary, fontWeight: '500' },
  todayNum: { color: C.accent, fontWeight: '800' },
  eventDayNum: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  eventCount: { fontSize: 8, color: 'rgba(255,255,255,0.9)', fontWeight: '700', marginTop: 1 },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EventsScreen({ events, treeId, navigateTo, refreshing = false, onRefresh }: Props) {
  const [showCalendar, setShowCalendar] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null)

  const byYear = events.reduce<Record<string, FamilyEvent[]>>((acc, e) => {
    const y = String(new Date(e.date).getFullYear())
    if (!acc[y]) acc[y] = []
    acc[y].push(e)
    return acc
  }, {})

  for (const y of Object.keys(byYear)) {
    byYear[y].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const years = Object.keys(byYear).sort((a, b) => parseInt(b) - parseInt(a))

  return (
    <View style={styles.root}>

      {/* Stats + calendar toggle */}
      <View style={styles.topHeader}>
        <Text style={styles.sub}>
          {events.length} {events.length === 1 ? 'memory' : 'memories'} · {events.reduce((n, e) => n + e.media.length, 0)} photos
        </Text>
        <TouchableOpacity
          style={[styles.calToggle, showCalendar && styles.calToggleActive]}
          onPress={() => setShowCalendar(v => !v)}
          activeOpacity={0.7}
        >
          <Text style={[styles.calToggleText, showCalendar && styles.calToggleTextActive]}>
            {showCalendar ? 'Hide calendar' : 'Calendar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mini calendar */}
      {showCalendar && (
        <MiniCalendar
          events={events}
          onDateSelect={e => setSelectedEvent(e)}
        />
      )}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
      >
        {events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No memories yet</Text>
            <Text style={styles.emptySub}>Create your first family memory</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigateTo({ name: 'createEvent' })}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>+ Create Memory</Text>
            </TouchableOpacity>
          </View>
        ) : (
          years.map(year => (
            <View key={year}>
              <View style={styles.yearDivider}>
                <View style={styles.yearLine} />
                <View style={styles.yearBadge}>
                  <Text style={styles.yearText}>{year}</Text>
                </View>
                <View style={styles.yearLine} />
              </View>
              {byYear[year].map(event => (
                <EventRow
                  key={event.id}
                  event={event}
                  navigateTo={navigateTo}
                  onPress={() => setSelectedEvent(event)}
                />
              ))}
            </View>
          ))
        )}
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          treeId={treeId}
          visible={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          navigateTo={navigateTo}
        />
      )}
    </View>
  )
}

// ─── EventRow ─────────────────────────────────────────────────────────────────

function EventRow({ event, navigateTo, onPress }: {
  event: FamilyEvent
  navigateTo: (s: Screen) => void
  onPress: () => void
}) {
  const colors = EVENT_GRADIENT[event.type] ?? EVENT_GRADIENT.CUSTOM
  const label = EVENT_LABEL[event.type] ?? 'Event'
  const poster = event.taggedPersons[0]

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={onPress}
      activeOpacity={0.92}
      // @ts-ignore
      cursor="pointer"
    >
      {/* Post header */}
      <View style={styles.eventHeader}>
        <View style={styles.eventHeaderLeft}>
          <View style={styles.posterRing}>
            <View style={styles.posterInner}>
              {poster?.profilePicUrl ? (
                <Image source={{ uri: poster.profilePicUrl }} style={styles.posterImg} />
              ) : (
                <View style={[styles.posterImg, styles.posterFallback]}>
                  <Text style={styles.posterInitial}>{poster?.firstName?.[0] ?? 'F'}</Text>
                </View>
              )}
            </View>
          </View>
          <View>
            <Text style={styles.eventHandle}>
              {poster?.linkedUser?.username
                ? `@${poster.linkedUser.username}`
                : poster
                  ? `${poster.firstName.toLowerCase()}_${poster.lastName.toLowerCase()}`
                  : 'khan_family'}
            </Text>
            <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
          </View>
        </View>

        <View style={[styles.typeBadge, {
          // @ts-ignore
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
        }]}>
          <Text style={styles.typeText}>{label}</Text>
        </View>
      </View>

      {/* Title + description */}
      <View style={styles.eventBody}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        {event.description && (
          <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
        )}
      </View>

      {/* Media strip — thumbnail preview */}
      {event.media.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mediaStrip}
        >
          {event.media.slice(0, 6).map(m => (
            <Image
              key={m.id}
              source={{ uri: m.thumbnail }}
              style={styles.mediaTile}
              resizeMode="cover"
            />
          ))}
          {event.media.length > 6 && (
            <View style={styles.moreMedia}>
              <Text style={styles.moreMediaText}>+{event.media.length - 6}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Tagged people */}
      {event.taggedPersons.length > 0 && (
        <View style={styles.taggedRow}>
          {event.taggedPersons.slice(0, 5).map((p, i) => (
            <View key={p.id} style={[styles.tagAvatar, { marginLeft: i > 0 ? -6 : 0 }]}>
              {p.profilePicUrl ? (
                <Image source={{ uri: p.profilePicUrl }} style={styles.tagAvatarImg} />
              ) : (
                <View style={[styles.tagAvatarImg, styles.tagFallback]}>
                  <Text style={styles.tagInitial}>{p.firstName?.[0] ?? '?'}</Text>
                </View>
              )}
            </View>
          ))}
          <Text style={styles.tagNames}>
            {' '}{event.taggedPersons.slice(0, 2).map(p => p.firstName).join(', ')}
            {event.taggedPersons.length > 2 ? ` +${event.taggedPersons.length - 2}` : ''}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.eventFooter}>
        <Text style={styles.footerStat}>
          {event.likeCount ?? 0} {event.likeCount === 1 ? 'like' : 'likes'}
          {' · '}
          {event.commentCount} {event.commentCount === 1 ? 'comment' : 'comments'}
          {event.media.length > 0 ? ` · ${event.media.length} ${event.media.length === 1 ? 'photo' : 'photos'}` : ''}
        </Text>
        <Text style={styles.tapHint}>Tap to open ›</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sub: { fontSize: 12, fontWeight: '600', color: C.textSecondary, letterSpacing: 0.3 },
  calToggle: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.bg,
  },
  calToggleActive: { backgroundColor: C.accentBg, borderColor: C.accentSoft },
  calToggleText: { fontSize: 11, fontWeight: '600', color: C.textSecondary },
  calToggleTextActive: { color: C.accent },

  scroll: { flex: 1 },

  yearDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  yearLine: { flex: 1, height: 1, backgroundColor: C.border },
  yearBadge: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  yearText: {
    fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5,
    // @ts-ignore
    fontFamily: F.serif,
  },

  eventCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    // @ts-ignore
    boxShadow: shadow.card,
    overflow: 'hidden',
    // @ts-ignore
    cursor: 'pointer',
  },

  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  eventHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    // @ts-ignore
    cursor: 'pointer',
  },
  posterRing: {
    width: 38, height: 38, borderRadius: 10, padding: 2,
    // @ts-ignore
    background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentSoft} 100%)`,
  },
  posterInner: {
    flex: 1, borderRadius: 8, borderWidth: 2, borderColor: C.surface,
    overflow: 'hidden', backgroundColor: C.accentBg,
  },
  posterImg: { width: '100%', height: '100%' },
  posterFallback: {
    backgroundColor: C.accentBg, alignItems: 'center', justifyContent: 'center',
  },
  posterInitial: { fontSize: 14, fontWeight: '700', color: C.accent },
  eventHandle: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  eventDate: {
    fontSize: 11, color: C.accentSoft, marginTop: 1, fontWeight: '600',
    // @ts-ignore
    fontFamily: F.serif, fontStyle: 'italic',
  },

  typeBadge: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.border,
  },
  typeText: { fontSize: 11, fontWeight: '700', color: C.accent },

  eventBody: { paddingHorizontal: 12, paddingBottom: 10 },
  eventTitle: {
    fontSize: 16, fontWeight: '800', color: C.textPrimary, marginBottom: 4,
    // @ts-ignore
    fontFamily: F.serif,
  },
  eventDesc: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },

  mediaStrip: { paddingHorizontal: 12, paddingBottom: 10, gap: 6 },
  mediaTile: { width: 100, height: 74, borderRadius: 8, backgroundColor: C.accentBg },
  moreMedia: {
    width: 74, height: 74, borderRadius: 8,
    backgroundColor: C.accentBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  moreMediaText: { fontSize: 14, fontWeight: '700', color: C.accent },

  taggedRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 8,
  },
  tagAvatar: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: C.surface,
    overflow: 'hidden', backgroundColor: C.accentBg,
  },
  tagAvatarImg: { width: '100%', height: '100%' },
  tagFallback: { backgroundColor: C.accentBg, alignItems: 'center', justifyContent: 'center' },
  tagInitial: { fontSize: 9, fontWeight: '700', color: C.accent },
  tagNames: { fontSize: 12, color: C.textSecondary, marginLeft: 6 },

  eventFooter: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.borderSoft,
    justifyContent: 'space-between',
  },
  footerStat: { fontSize: 12, color: C.textSecondary, fontWeight: '500' },
  tapHint: { fontSize: 11, color: C.accentSoft, fontWeight: '600' },

  bottomPad: { height: 80 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: 14, color: C.textSecondary },
  emptyBtn: {
    marginTop: 8, backgroundColor: C.accent, borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
})
