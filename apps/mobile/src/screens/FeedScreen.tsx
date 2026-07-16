import { useMemo, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import type { Tree, Person, FamilyEvent, Relative } from '../lib/types'
import { getFamilyCircle, FAMILY_CIRCLE_LABELS } from '../lib/types'
import type { FamilyCircle } from '../lib/types'
import StoryCircle from '../components/StoryCircle'
import PostCard from '../components/PostCard'
import type { Screen } from '../../App'
import { C } from '../lib/theme'

type FilterTab = FamilyCircle | 'all'

const TABS: FilterTab[] = ['all', 'close', 'dadiyal', 'naniyal', 'internal', 'extended']

interface Props {
  tree: Tree
  persons: Person[]
  events: FamilyEvent[]
  myRelatives: Relative[]
  myPersonId?: string
  navigateTo: (s: Screen) => void
  refreshing?: boolean
  onRefresh?: () => void
  onEditEvent?: (event: FamilyEvent) => void
  onDeleteEvent?: (eventId: string) => void
}

const SEEN_KEY = 'fo_seen_stories'

function loadSeen(): Set<string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SEEN_KEY) : null
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function saveSeen(ids: Set<string>) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]))
    }
  } catch {}
}

export default function FeedScreen({ tree, persons, events, myRelatives, myPersonId, navigateTo, refreshing = false, onRefresh, onEditEvent, onDeleteEvent }: Props) {
  const [seenIds,    setSeenIds]    = useState<Set<string>>(loadSeen)
  const [activeTab,  setActiveTab]  = useState<FilterTab>('all')

  // Build personId → circle map from my relatives list
  const circleMap = useMemo<Record<string, FamilyCircle>>(() => {
    const map: Record<string, FamilyCircle> = {}
    for (const r of myRelatives) {
      map[r.person.id] = getFamilyCircle(r.relationship)
    }
    return map
  }, [myRelatives])

  // Filter events: match if any tagged person is in the active circle
  const filteredEvents = useMemo(() => {
    if (activeTab === 'all') return events
    return events.filter(e =>
      e.taggedPersons.some(p => circleMap[p.id] === activeTab)
    )
  }, [events, activeTab, circleMap])

  // For stories row: show all persons on 'all', otherwise filter by circle
  const filteredPersons = useMemo(() => {
    if (activeTab === 'all') return persons
    return persons.filter(p => circleMap[p.id] === activeTab)
  }, [persons, activeTab, circleMap])

  function markSeen(personId: string) {
    setSeenIds(prev => {
      const next = new Set(prev).add(personId)
      saveSeen(next)
      return next
    })
  }

  return (
    <View style={styles.root}>

      {/* Stories row */}
      <View style={styles.storiesWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          {filteredPersons.map(person => (
            <StoryCircle
              key={person.id}
              person={person}
              seen={seenIds.has(person.id)}
              navigateTo={(id) => { markSeen(id); navigateTo({ name: 'person', personId: id }) }}
            />
          ))}
          {filteredPersons.length === 0 && activeTab !== 'all' && (
            <View style={styles.noStories}>
              <Text style={styles.noStoriesText}>No {FAMILY_CIRCLE_LABELS[activeTab]} members yet</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Family circle filter tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {TABS.map(tab => (
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

      {/* Posts */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
      >
        {filteredEvents.map(event => (
          <PostCard
            key={event.id}
            event={event}
            treeId={tree.id}
            navigateTo={navigateTo}
            onEdit={onEditEvent}
            onDelete={onDeleteEvent}
          />
        ))}

        {filteredEvents.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{activeTab === 'all' ? '📸' : '👨‍👩‍👦'}</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all' ? 'No memories yet' : `No ${FAMILY_CIRCLE_LABELS[activeTab]} memories`}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'all'
                ? 'Tap + to add your first family memory'
                : 'Tag family members in events to see them here'
              }
            </Text>
            {activeTab === 'all' && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigateTo({ name: 'createEvent' })}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>+ Create Memory</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  storiesWrap: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  storiesContent: { paddingHorizontal: 10, paddingVertical: 12, gap: 12 },
  noStories: { paddingVertical: 16, paddingHorizontal: 8 },
  noStoriesText: { fontSize: 12, color: C.textSecondary, fontStyle: 'italic' },

  tabsWrap: {
    backgroundColor: C.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: C.border,
  },
  tabsContent: { paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.bg,
  },
  tabActive: {
    backgroundColor: C.accent, borderColor: C.accent,
  },
  tabText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  tabTextActive: { color: '#FFFFFF' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyText: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: 13, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn: {
    marginTop: 8, backgroundColor: C.accent, borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  bottomPad: { height: 20 },
})
