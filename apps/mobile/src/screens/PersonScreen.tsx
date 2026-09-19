import { useEffect, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import type { Person, FamilyEvent, Relative } from '../lib/types'
import { EVENT_GRADIENT, EVENT_LABEL, birthYear } from '../lib/types'
import { personApi } from '../lib/api'
import type { Screen } from '../../App'
import { C, F, shadow } from '../lib/theme'
import EventDetailModal from '../components/EventDetailModal'

interface Props {
  personId: string
  treeId: string
  persons: Person[]
  events: FamilyEvent[]
  navigateTo: (s: Screen) => void
  from?: 'feed' | 'members' | 'events'
  myPersonId?: string
  myRelatives?: Relative[]
}

export default function PersonScreen({
  personId,
  treeId,
  persons,
  events,
  navigateTo,
  from = 'members',
  myPersonId,
  myRelatives = [],
}: Props) {
  const [relatives, setRelatives] = useState<Relative[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null)

  const person = persons.find((p) => p.id === personId)
  const myEvents = events.filter((e) => e.taggedPersons.some((p) => p.id === personId))
  const memoriesCount = myEvents.reduce((n, e) => n + e.media.length, 0)

  const handle = person?.linkedUser?.username
    ? `@${person.linkedUser.username}`
    : person
      ? `${person.firstName.toLowerCase()}_${person.lastName.toLowerCase()}`
      : '...'

  useEffect(() => {
    setLoading(true)
    personApi
      .relatives(treeId, personId)
      .then(setRelatives)
      .catch(() => setRelatives([]))
      .finally(() => setLoading(false))
  }, [personId, treeId])

  // Derive relationship label from the pre-fetched myRelatives (no extra API call)
  const myRelLabel =
    myPersonId === personId
      ? 'You'
      : (myRelatives.find((r) => r.person.id === personId)?.relationship ?? null)

  if (!person) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Person not found</Text>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileSection}>
          {/* Avatar + Stats row */}
          <View style={styles.statsRow}>
            {/* Avatar */}
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {person.profilePicUrl ? (
                  <Image source={{ uri: person.profilePicUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>
                      {person.firstName?.[0] ?? '?'}
                      {person.lastName?.[0] ?? ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats */}
            <View style={styles.stats}>
              <StatPill value={myEvents.length} label="posts" />
              <StatPill value={loading ? '…' : relatives.length} label="relatives" />
              <StatPill value={memoriesCount} label="memories" />
            </View>
          </View>

          {/* Name, bio, status */}
          <View style={styles.bio}>
            <View style={styles.bioNameRow}>
              <Text style={styles.fullName}>
                {person.firstName} {person.lastName}
              </Text>
              {myRelLabel && (
                <View style={[styles.relBadge, myRelLabel === 'You' && styles.relBadgeSelf]}>
                  <Text
                    style={[styles.relBadgeText, myRelLabel === 'You' && styles.relBadgeTextSelf]}
                  >
                    {myRelLabel === 'You' ? 'You' : `Your ${myRelLabel}`}
                  </Text>
                </View>
              )}
            </View>
            {person.dateOfBirth ? (
              <Text style={styles.bioLine}>Born {birthYear(person.dateOfBirth)}</Text>
            ) : (
              <Text style={styles.bioLine}>Family member</Text>
            )}
            {person.linkedUser && (
              <Text style={styles.bioUsername}>@{person.linkedUser.username}</Text>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.btnPrimary}
              activeOpacity={0.8}
              onPress={() => navigateTo({ name: 'members' })}
            >
              <Text style={styles.btnPrimaryText}>Family</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecondary}
              activeOpacity={0.8}
              onPress={() => navigateTo({ name: 'createEvent' })}
            >
              <Text style={styles.btnSecondaryText}>+ Memory</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Relatives as Highlights */}
        {!loading && relatives.length > 0 && (
          <View style={styles.highlights}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlightsContent}
            >
              {relatives.slice(0, 8).map((r) => (
                <TouchableOpacity
                  key={r.person.id}
                  style={styles.highlight}
                  onPress={() => navigateTo({ name: 'person', personId: r.person.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.highlightRing}>
                    <View style={styles.highlightInner}>
                      {r.person.profilePicUrl ? (
                        <Image
                          source={{ uri: r.person.profilePicUrl }}
                          style={styles.highlightImg}
                        />
                      ) : (
                        <View style={[styles.highlightImg, styles.highlightFallback]}>
                          <Text style={styles.highlightInitial}>
                            {r.person.firstName?.[0] ?? '?'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.highlightLabel} numberOfLines={1}>
                    {r.relationship.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.highlightsDivider} />
          </View>
        )}

        {/* Tabs: Grid | Tagged */}
        <View style={styles.tabRow}>
          <View style={[styles.tabItem, styles.tabItemActive]}>
            <Text style={styles.tabIcon}>⊞</Text>
          </View>
          <View style={styles.tabItem}>
            <Text style={[styles.tabIcon, { opacity: 0.3 }]}>🏷</Text>
          </View>
        </View>

        {/* Events grid */}
        {myEvents.length === 0 ? (
          <View style={styles.emptyGrid}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyText}>No memories yet</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {myEvents.map((event) => (
              <EventGridTile key={event.id} event={event} onPress={() => setSelectedEvent(event)} />
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          treeId={treeId}
          visible={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          navigateTo={navigateTo}
          myRelatives={myRelatives}
          myPersonId={myPersonId}
        />
      )}
    </View>
  )
}

function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={statStyles.wrap}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  )
}

function EventGridTile({ event, onPress }: { event: FamilyEvent; onPress?: () => void }) {
  const colors = EVENT_GRADIENT[event.type] ?? EVENT_GRADIENT.CUSTOM
  const hasMedia = event.media.length > 0

  return (
    <TouchableOpacity style={tileStyles.cell} onPress={onPress} activeOpacity={0.85}>
      {hasMedia ? (
        <Image
          source={{ uri: event.media[0].thumbnail }}
          style={tileStyles.img}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            tileStyles.img,
            tileStyles.banner,
            {
              // @ts-ignore
              background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            },
          ]}
        >
          <Text style={tileStyles.bannerType}>{EVENT_LABEL[event.type]?.[0] ?? '?'}</Text>
        </View>
      )}
      {event.media.length > 1 && (
        <View style={tileStyles.multiIcon}>
          <Text style={tileStyles.multiIconText}>⧉</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, color: C.textSecondary },

  scroll: { flex: 1 },

  profileSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 18,
    padding: 2.5,
    marginRight: 24,
    // @ts-ignore
    background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentSoft} 100%)`,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: C.surface,
    overflow: 'hidden',
    backgroundColor: C.accentBg,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: {
    backgroundColor: C.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: C.accent },

  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  bio: { marginBottom: 12 },
  bioNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
  },
  relBadge: {
    backgroundColor: C.accentBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.accentSoft,
  },
  relBadgeSelf: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  relBadgeText: { fontSize: 11, fontWeight: '700', color: C.accent },
  relBadgeTextSelf: { color: '#FFFFFF' },
  bioLine: { fontSize: 13, color: C.textSecondary, marginBottom: 1 },
  bioUsername: { fontSize: 13, color: C.accentSoft, fontWeight: '600' },

  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: C.accentBg,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    // @ts-ignore
    cursor: 'pointer',
  },
  btnPrimaryText: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  btnSecondary: {
    flex: 1,
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    // @ts-ignore
    cursor: 'pointer',
    // @ts-ignore
    boxShadow: shadow.fab,
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  btnIcon: {
    backgroundColor: C.accentBg,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  btnIconText: { fontSize: 14, color: '#262626' },

  highlights: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },
  highlightsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  highlight: {
    alignItems: 'center',
    width: 64,
    // @ts-ignore
    cursor: 'pointer',
  },
  highlightRing: {
    width: 60,
    height: 60,
    borderRadius: 14,
    padding: 2.5,
    marginBottom: 5,
    // @ts-ignore
    background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentSoft} 100%)`,
  },
  highlightInner: {
    flex: 1,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.surface,
    overflow: 'hidden',
    backgroundColor: C.accentBg,
  },
  highlightImg: { width: '100%', height: '100%' },
  highlightFallback: {
    backgroundColor: C.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightInitial: { fontSize: 20, fontWeight: '700', color: C.accent },
  highlightLabel: {
    fontSize: 11,
    color: C.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  highlightsDivider: { height: 0 },

  tabRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    // @ts-ignore
    cursor: 'pointer',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
  },
  tabIcon: { fontSize: 22 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 4,
  },

  emptyGrid: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: C.textSecondary },

  bottomPad: { height: 80 },
})

const statStyles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  value: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  label: { fontSize: 12, color: C.textSecondary, marginTop: 1 },
})

const tileStyles = StyleSheet.create({
  cell: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: C.accentBg,
    borderRadius: 8,
  },
  img: { width: '100%', height: '100%' },
  banner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerType: {
    fontSize: 32,
    fontWeight: '800',
    color: C.accent,
    opacity: 0.35,
  },
  multiIcon: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  multiIconText: {
    fontSize: 16,
    color: '#FFFFFF',
    // @ts-ignore
    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
  },
})
