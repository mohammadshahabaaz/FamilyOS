import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Image, TouchableWithoutFeedback, StyleSheet } from 'react-native'
import { storyApi } from '../lib/api'
import type { StoryItem } from '../lib/api'
import { timeAgo } from '../lib/types'
import { C } from '../lib/theme'

const DURATION_MS = 5000
const TICK_MS = 50

interface Props {
  allStories: StoryItem[] // every active story in the tree
  startUserId: string // whose group to open first
  onClose: () => void
}

interface Group {
  userId: string
  stories: StoryItem[]
}

export default function StoryViewerScreen({ allStories, startUserId, onClose }: Props) {
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, StoryItem[]>()
    for (const s of allStories) {
      const arr = map.get(s.createdBy.id) ?? []
      arr.push(s)
      map.set(s.createdBy.id, arr)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    return [...map.entries()].map(([userId, stories]) => ({ userId, stories }))
  }, [allStories])

  const startGroupIdx = Math.max(
    0,
    groups.findIndex((g) => g.userId === startUserId),
  )
  const [groupIdx, setGroupIdx] = useState(startGroupIdx)
  const [storyIdx, setStoryIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const seenRef = useRef<Set<string>>(new Set())

  const group = groups[groupIdx]
  const story = group?.stories[storyIdx]

  function goNext() {
    const g = groups[groupIdx]
    if (!g) {
      onClose()
      return
    }
    if (storyIdx < g.stories.length - 1) {
      setStoryIdx((i) => i + 1)
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((i) => i + 1)
      setStoryIdx(0)
    } else {
      onClose()
    }
  }

  function goPrev() {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1)
    } else if (groupIdx > 0) {
      const prevLen = groups[groupIdx - 1].stories.length
      setGroupIdx((i) => i - 1)
      setStoryIdx(prevLen - 1)
    }
  }

  // Auto-advance + progress bar fill
  useEffect(() => {
    if (!story) return
    setProgress(0)
    const start = Date.now()
    const interval = setInterval(() => {
      const pct = Math.min(1, (Date.now() - start) / DURATION_MS)
      setProgress(pct)
      if (pct >= 1) clearInterval(interval)
    }, TICK_MS)
    const timeout = setTimeout(goNext, DURATION_MS)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdx, storyIdx])

  // Record a view once per story per viewer session
  useEffect(() => {
    if (!story || seenRef.current.has(story.id)) return
    seenRef.current.add(story.id)
    storyApi.view(story.id).catch(() => {})
  }, [story?.id])

  if (!group || !story) return null

  return (
    <View style={styles.root}>
      {/* Progress bars — one segment per story in the current group */}
      <View style={styles.progressRow}>
        {group.stories.map((s, i) => (
          <View key={s.id} style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${i < storyIdx ? 100 : i === storyIdx ? progress * 100 : 0}%`,
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {story.createdBy.profilePicUrl ? (
            <Image source={{ uri: story.createdBy.profilePicUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {story.createdBy.username[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.username}>@{story.createdBy.username}</Text>
            <Text style={styles.time}>{timeAgo(story.createdAt)}</Text>
          </View>
        </View>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* Story media + left/right tap zones (left third = back, right = forward) */}
      <View style={styles.mediaWrap}>
        {story.type === 'VIDEO' ? (
          // @ts-ignore — raw web <video>, mirrors the <input type="date"> pattern used
          // elsewhere. Autoplay+muted (no controls) matches how stories are glanced at,
          // not watched — same fixed-duration cap as a photo story.
          <video
            key={story.id}
            src={story.url}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <Image source={{ uri: story.url }} style={styles.media} resizeMode="contain" />
        )}
        {story.caption && (
          <View style={styles.captionWrap}>
            <Text style={styles.captionText}>{story.caption}</Text>
          </View>
        )}
        <TouchableWithoutFeedback onPress={goPrev}>
          <View style={styles.tapZoneLeft} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={goNext}>
          <View style={styles.tapZoneRight} />
        </TouchableWithoutFeedback>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },

  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 9 },
  avatarFallback: {
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  username: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  time: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    // @ts-ignore
    cursor: 'pointer',
  },
  closeIcon: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  mediaWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  media: { width: '100%', height: '100%' },
  captionWrap: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    padding: 12,
  },
  captionText: { color: '#FFFFFF', fontSize: 14, textAlign: 'center' },
  tapZoneLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '33%' },
  tapZoneRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '67%' },
})
