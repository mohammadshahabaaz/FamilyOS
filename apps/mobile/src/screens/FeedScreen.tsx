import { useMemo, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import type { Tree, Person, FamilyEvent, Relative, OnThisDayEvent } from '../lib/types'
import { getFamilyCircle, FAMILY_CIRCLE_LABELS } from '../lib/types'
import type { FamilyCircle } from '../lib/types'
import type { StoryItem } from '../lib/api'
import StoryCircle from '../components/StoryCircle'
import PostCard from '../components/PostCard'
import type { Screen } from '../../App'
import { C } from '../lib/theme'

type FilterTab = FamilyCircle | 'all'

const TABS: FilterTab[] = ['all', 'close', 'paternal', 'maternal', 'internal', 'extended']

interface Props {
  tree: Tree
  persons: Person[]
  events: FamilyEvent[]
  stories: StoryItem[]
  onThisDay: OnThisDayEvent[]
  myRelatives: Relative[]
  myPersonId?: string
  myUserId?: string
  navigateTo: (s: Screen) => void
  onOpenStory: (userId: string) => void
  onCreateStory: () => void
  refreshing?: boolean
  onRefresh?: () => void
  onEditEvent?: (event: FamilyEvent) => void
  onDeleteEvent?: (eventId: string) => void
}

const SEEN_KEY = 'fo_seen_story_groups'

function loadSeen(): Set<string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SEEN_KEY) : null
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveSeen(ids: Set<string>) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]))
    }
  } catch {}
}

export default function FeedScreen({
  tree,
  persons,
  events,
  stories,
  onThisDay,
  myRelatives,
  myPersonId,
  myUserId,
  navigateTo,
  onOpenStory,
  onCreateStory,
  refreshing = false,
  onRefresh,
  onEditEvent,
  onDeleteEvent,
}: Props) {
  const [seenIds, setSeenIds] = useState<Set<string>>(loadSeen)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

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
    return events.filter((e) => e.taggedPersons.some((p) => circleMap[p.id] === activeTab))
  }, [events, activeTab, circleMap])

  // Same circle filter applied to "on this day" so it stays consistent with the tabs
  const filteredOnThisDay = useMemo(() => {
    if (activeTab === 'all') return onThisDay
    return onThisDay.filter((e) => e.taggedPersons.some((p) => circleMap[p.id] === activeTab))
  }, [onThisDay, activeTab, circleMap])

  // Group active stories by author, split into "mine" vs. everyone else's, and
  // apply the same circle filter the tabs already drive for events.
  const { myGroup, otherGroups } = useMemo(() => {
    const byUser = new Map<string, StoryItem[]>()
    for (const s of stories) {
      const arr = byUser.get(s.createdBy.id) ?? []
      arr.push(s)
      byUser.set(s.createdBy.id, arr)
    }
    const mine = myUserId ? (byUser.get(myUserId) ?? []) : []
    const others: { userId: string; latest: StoryItem; count: number }[] = []
    for (const [userId, group] of byUser) {
      if (userId === myUserId) continue
      const personId = persons.find((p) => p.linkedUserId === userId)?.id
      if (activeTab !== 'all' && (!personId || circleMap[personId] !== activeTab)) continue
      const latest = group.reduce((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? a : b))
      others.push({ userId, latest, count: group.length })
    }
    others.sort(
      (a, b) => new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime(),
    )
    return { myGroup: mine, otherGroups: others }
  }, [stories, myUserId, persons, circleMap, activeTab])

  function markSeen(userId: string) {
    setSeenIds((prev) => {
      const next = new Set(prev).add(userId)
      saveSeen(next)
      return next
    })
  }

  const myPerson = persons.find((p) => p.id === myPersonId)

  return (
    <View style={styles.root}>
      {/* Stories row */}
      <View style={styles.storiesWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          {myUserId && (
            <StoryCircle
              name={myGroup.length > 0 ? 'Your Story' : 'Add Story'}
              avatarUrl={myPerson?.profilePicUrl}
              isAdd={myGroup.length === 0}
              onPress={() => (myGroup.length > 0 ? onOpenStory(myUserId) : onCreateStory())}
            />
          )}
          {otherGroups.map((g) => {
            const p = persons.find((pp) => pp.linkedUserId === g.userId)
            return (
              <StoryCircle
                key={g.userId}
                name={p?.firstName ?? g.latest.createdBy.username}
                avatarUrl={p?.profilePicUrl ?? g.latest.createdBy.profilePicUrl}
                seen={seenIds.has(g.userId)}
                onPress={() => {
                  markSeen(g.userId)
                  onOpenStory(g.userId)
                }}
              />
            )
          })}
          {otherGroups.length === 0 && myGroup.length === 0 && activeTab !== 'all' && (
            <View style={styles.noStories}>
              <Text style={styles.noStoriesText}>
                No {FAMILY_CIRCLE_LABELS[activeTab]} stories yet
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Family circle filter tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => (
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
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
        }
      >
        {filteredOnThisDay.length > 0 && (
          <View style={styles.onThisDayWrap}>
            <Text style={styles.onThisDaySectionLabel}>✨ On This Day</Text>
            {filteredOnThisDay.map((event) => (
              <View key={event.id} style={styles.onThisDayCard}>
                <Text style={styles.onThisDayCaption}>
                  {event.yearsAgo} year{event.yearsAgo === 1 ? '' : 's'} ago today
                </Text>
                <PostCard
                  event={event}
                  treeId={tree.id}
                  navigateTo={navigateTo}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                  myRelatives={myRelatives}
                  myPersonId={myPersonId}
                />
              </View>
            ))}
          </View>
        )}

        {filteredEvents.map((event) => (
          <PostCard
            key={event.id}
            event={event}
            treeId={tree.id}
            navigateTo={navigateTo}
            onEdit={onEditEvent}
            onDelete={onDeleteEvent}
            myRelatives={myRelatives}
            myPersonId={myPersonId}
          />
        ))}

        {filteredEvents.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{activeTab === 'all' ? '📸' : '👨‍👩‍👦'}</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all'
                ? 'No memories yet'
                : `No ${FAMILY_CIRCLE_LABELS[activeTab]} memories`}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'all'
                ? 'Tap + to add your first family memory'
                : 'Tag family members in events to see them here'}
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  tabActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  tabText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  tabTextActive: { color: '#FFFFFF' },

  onThisDayWrap: {
    borderBottomWidth: 8,
    borderBottomColor: C.bg,
  },
  onThisDaySectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    // @ts-ignore
    textTransform: 'uppercase',
    color: C.accent,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
  },
  onThisDayCard: {
    borderWidth: 1.5,
    borderColor: C.accentSoft,
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  onThisDayCaption: {
    fontSize: 12,
    fontStyle: 'italic',
    color: C.accent,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyText: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: 13, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  bottomPad: { height: 20 },
})
