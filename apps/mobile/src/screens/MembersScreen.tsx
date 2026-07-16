import { useMemo, useState } from 'react'
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import type { Person, FamilyEvent, Relative } from '../lib/types'
import { EVENT_GRADIENT, getFamilyCircle, FAMILY_CIRCLE_LABELS } from '../lib/types'
import type { FamilyCircle } from '../lib/types'
import type { Screen } from '../../App'
import { C } from '../lib/theme'

type FilterTab = FamilyCircle | 'all'
const CIRCLE_TABS: FilterTab[] = ['all', 'close', 'dadiyal', 'naniyal', 'internal', 'extended']

interface Props {
  persons: Person[]
  treeId: string
  events: FamilyEvent[]
  navigateTo: (s: Screen) => void
  refreshing?: boolean
  onRefresh?: () => void
  myPersonId?: string
  myRelatives?: Relative[]
}

export default function MembersScreen({ persons, treeId, events, navigateTo, refreshing = false, onRefresh, myPersonId, myRelatives = [] }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const relMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const r of myRelatives) map[r.person.id] = r.relationship
    if (myPersonId) map[myPersonId] = 'You'
    return map
  }, [myRelatives, myPersonId])

  const circleMap = useMemo<Record<string, FamilyCircle>>(() => {
    const map: Record<string, FamilyCircle> = {}
    for (const r of myRelatives) {
      map[r.person.id] = getFamilyCircle(r.relationship)
    }
    return map
  }, [myRelatives])

  const filterPerson = (p: Person) => {
    if (activeTab === 'all') return true
    if (p.id === myPersonId) return activeTab === 'close' // "You" lives in Close circle
    return circleMap[p.id] === activeTab
  }

  const living   = persons.filter(p => !p.isDeceased && filterPerson(p))
  const deceased = persons.filter(p =>  p.isDeceased && filterPerson(p))

  return (
    <View style={styles.root}>
      <View style={styles.topHeader}>
        <Text style={styles.count}>
          {activeTab === 'all' ? persons.length : living.length + deceased.length} members
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigateTo({ name: 'addPerson' })}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Family circle filter tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {CIRCLE_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {FAMILY_CIRCLE_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
      >
        {living.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {activeTab === 'all' ? 'Living' : FAMILY_CIRCLE_LABELS[activeTab]}
            </Text>
            <View style={styles.grid}>
              {living.map(person => (
                <PersonTile key={person.id} person={person} events={events} navigateTo={navigateTo} relLabel={relMap[person.id]} />
              ))}
            </View>
          </View>
        )}

        {deceased.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>In Memoriam</Text>
            <View style={styles.grid}>
              {deceased.map(person => (
                <PersonTile
                  key={person.id}
                  person={person}
                  events={events}
                  navigateTo={navigateTo}
                  grayscale
                  relLabel={relMap[person.id]}
                />
              ))}
            </View>
          </View>
        )}

        {living.length === 0 && deceased.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👨‍👩‍👦</Text>
            <Text style={styles.emptyText}>No {FAMILY_CIRCLE_LABELS[activeTab]} members yet</Text>
            <Text style={styles.emptySub}>Relationship labels are computed from family edges</Text>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  )
}

function PersonTile({
  person,
  events,
  navigateTo,
  grayscale = false,
  relLabel,
}: {
  person: Person
  events: FamilyEvent[]
  navigateTo: (s: Screen) => void
  grayscale?: boolean
  relLabel?: string
}) {
  const taggedEvents = events.filter(e => e.taggedPersons.some(p => p.id === person.id))
  const colors = EVENT_GRADIENT[taggedEvents[0]?.type ?? 'CUSTOM'] ?? EVENT_GRADIENT.CUSTOM

  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => navigateTo({ name: 'person', personId: person.id })}
      activeOpacity={0.85}
    >
      <View style={styles.tileMedia}>
        {person.profilePicUrl ? (
          <Image
            source={{ uri: person.profilePicUrl }}
            style={[styles.tileImg, grayscale && styles.tileImgGray, {
              // @ts-ignore — keep faces in frame
              objectPosition: 'center top',
            }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.tileImg, styles.tileImgFallback, {
            // @ts-ignore
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          }]}>
            <Text style={styles.tileInitials}>
              {person.firstName?.[0] ?? '?'}{person.lastName?.[0] ?? ''}
            </Text>
          </View>
        )}
        {grayscale && (
          <View style={styles.deceasedOverlay}>
            <Text style={styles.deceasedMark}>†</Text>
          </View>
        )}
      </View>

      <View style={styles.tileMeta}>
        <Text style={styles.tileName} numberOfLines={1}>
          {person.firstName} {person.lastName}
        </Text>
        {relLabel ? (
          <View style={[styles.relPill, relLabel === 'You' && styles.relPillSelf]}>
            <Text style={[styles.relPillText, relLabel === 'You' && styles.relPillTextSelf]} numberOfLines={1}>
              {relLabel}
            </Text>
          </View>
        ) : (
          <Text style={styles.tileHandle} numberOfLines={1}>
            {person.linkedUser
              ? `@${person.linkedUser.username}`
              : `${taggedEvents.length} ${taggedEvents.length === 1 ? 'memory' : 'memories'}`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
    backgroundColor: C.surface,
  },
  count: { fontSize: 12, fontWeight: '600', color: C.textSecondary, letterSpacing: 0.3 },
  addBtn: {
    backgroundColor: C.accent, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 7, alignItems: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  tabsWrap: {
    backgroundColor: C.surface,
    borderBottomWidth: 1.5, borderBottomColor: C.border,
  },
  tabsContent: { paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.bg,
  },
  tabActive: { backgroundColor: C.accent, borderColor: C.accent },
  tabText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  tabTextActive: { color: '#FFFFFF' },

  scroll: { flex: 1 },

  section: { marginBottom: 8 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: 13, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    letterSpacing: 1,
    // @ts-ignore
    textTransform: 'uppercase',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 8,
  },

  tile: {
    width: '30%',
    flexGrow: 1,
    // @ts-ignore
    cursor: 'pointer',
  },
  tileMedia: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: C.accentBg,
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  tileImg: { width: '100%', height: '100%' },
  tileImgGray: {
    opacity: 0.6,
    // @ts-ignore
    filter: 'grayscale(100%)',
  },
  tileImgFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: C.accent,
    opacity: 0.6,
  },
  deceasedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  deceasedMark: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
  },

  tileMeta: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  tileName: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  tileHandle: { fontSize: 11, color: C.textSecondary, marginTop: 1 },
  relPill: {
    marginTop: 3,
    alignSelf: 'flex-start',
    backgroundColor: C.accentBg,
    borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: C.accentSoft,
  },
  relPillSelf: { backgroundColor: C.accent, borderColor: C.accent },
  relPillText: { fontSize: 10, fontWeight: '700', color: C.accent },
  relPillTextSelf: { color: '#FFFFFF' },

  bottomPad: { height: 80 },
})
