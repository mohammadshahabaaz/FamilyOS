import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { C, F } from '../lib/theme'
import type { Screen } from '../../App'
import { notificationApi } from '../lib/api'
import type { NotificationItem } from '../lib/api'
import { timeAgo } from '../lib/types'

interface Props {
  navigateTo: (s: Screen) => void
  onMarkAllRead?: () => void
}

const TYPE_ICON: Record<string, string> = {
  EVENT_CREATED: '📸',
  MEMORY_RECALL: '📅',
  PROFILE_REQUEST: '🏷',
  REQUEST_APPROVED: '✅',
  REQUEST_REJECTED: '✕',
  TREE_LINK_REQUEST: '🔗',
  STORY_CREATED: '✨',
}

const TYPE_COPY: Record<string, { title: string; body: string }> = {
  EVENT_CREATED: { title: 'New memory added', body: 'A new event was posted to your family tree' },
  MEMORY_RECALL: { title: 'On this day', body: "A memory from your family's past" },
  PROFILE_REQUEST: { title: 'New profile request', body: 'Someone wants to join your family tree' },
  REQUEST_APPROVED: { title: 'Request approved', body: 'Your profile request was approved' },
  REQUEST_REJECTED: { title: 'Request declined', body: 'Your profile request was declined' },
  TREE_LINK_REQUEST: { title: 'Family link request', body: 'Another family wants to connect' },
  STORY_CREATED: { title: 'New story', body: 'Someone shared a new story' },
}

export default function NotificationsScreen({ navigateTo, onMarkAllRead }: Props) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    notificationApi
      .list()
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  async function markAllRead() {
    if (marking) return
    setMarking(true)
    try {
      await notificationApi.markAllRead()
      const now = new Date().toISOString()
      setItems((prev) => prev.map((n) => ({ ...n, openedAt: n.openedAt ?? now })))
      onMarkAllRead?.()
    } catch {
    } finally {
      setMarking(false)
    }
  }

  function handleTap(n: NotificationItem) {
    // EVENT_CREATED and MEMORY_RECALL both carry relatedEventId — open that event's
    // detail directly instead of dropping the user on the generic Timeline tab.
    // PROFILE_REQUEST / TREE_LINK_REQUEST have no destination screen yet.
    if (n.relatedEventId) navigateTo({ name: 'events', openEventId: n.relatedEventId })
  }

  const unreadCount = items.filter((n) => !n.openedAt).length

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} disabled={marking}>
            <Text style={styles.markRead}>{marking ? 'Marking…' : 'Mark all read'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 60 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySub}>Family notifications will appear here</Text>
          </View>
        ) : (
          items.map((n) => {
            const copy = TYPE_COPY[n.type] ?? { title: n.type, body: '' }
            return (
              <TouchableOpacity
                key={n.id}
                style={[styles.item, !n.openedAt && styles.itemUnread]}
                activeOpacity={0.8}
                onPress={() => handleTap(n)}
              >
                <View style={styles.iconBubble}>
                  <Text style={styles.icon}>{TYPE_ICON[n.type] ?? '🔔'}</Text>
                </View>
                <View style={styles.content}>
                  <Text style={styles.notifTitle}>{copy.title}</Text>
                  <Text style={styles.notifBody}>{copy.body}</Text>
                  <Text style={styles.notifTime}>{timeAgo(n.sentAt)}</Text>
                </View>
                {!n.openedAt && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            )
          })
        )}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
  },
  markRead: { fontSize: 13, color: C.accent, fontWeight: '600' },

  scroll: { flex: 1 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
    // @ts-ignore
    cursor: 'pointer',
  },
  itemUnread: {
    backgroundColor: C.accentBg,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.surfaceEl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    flexShrink: 0,
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 2 },
  notifBody: { fontSize: 13, color: C.textSecondary, marginBottom: 3 },
  notifTime: { fontSize: 11, color: C.accentSoft, fontWeight: '600' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
    flexShrink: 0,
  },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: 14, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  bottomPad: { height: 80 },
})
