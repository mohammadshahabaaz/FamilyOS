import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { C, F, shadow } from '../lib/theme'
import type { Screen } from '../../App'

interface Props {
  navigateTo: (s: Screen) => void
}

interface NotifItem {
  id: string
  type: 'tagged' | 'comment' | 'like' | 'member_joined' | 'memory'
  title: string
  body: string
  time: string
  read: boolean
  personId?: string
}

// Demo notifications — replace with real API once GET /notifications is wired
const DEMO: NotifItem[] = [
  { id: '1', type: 'tagged',        title: 'You were tagged', body: 'in "Eid Gathering 2024"',          time: '2h ago',    read: false },
  { id: '2', type: 'comment',       title: 'New comment',     body: 'on "Tariq\'s Birthday Party"',     time: '5h ago',    read: false },
  { id: '3', type: 'like',          title: 'Someone liked',   body: 'your post "Trip to Murree"',       time: 'Yesterday', read: true  },
  { id: '4', type: 'member_joined', title: 'New family member', body: 'Sara Khan joined the tree',    time: '2 days ago', read: true  },
  { id: '5', type: 'memory',        title: 'Memory reminder', body: 'Ahmed would be 60 today',          time: '3 days ago', read: true  },
]

const NOTIF_ICON: Record<NotifItem['type'], string> = {
  tagged:        '🏷',
  comment:       '💬',
  like:          '♡',
  member_joined: '👤',
  memory:        '📅',
}

export default function NotificationsScreen({ navigateTo }: Props) {
  const [items, setItems] = useState<NotifItem[]>(DEMO)

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = items.filter(n => !n.read).length

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySub}>Family notifications will appear here</Text>
          </View>
        ) : (
          items.map(n => (
            <TouchableOpacity
              key={n.id}
              style={[styles.item, !n.read && styles.itemUnread]}
              activeOpacity={0.8}
              onPress={() => setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
            >
              <View style={styles.iconBubble}>
                <Text style={styles.icon}>{NOTIF_ICON[n.type]}</Text>
              </View>
              <View style={styles.content}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.notifBody}>{n.body}</Text>
                <Text style={styles.notifTime}>{n.time}</Text>
              </View>
              {!n.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 16, fontWeight: '700', color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
  },
  markRead: { fontSize: 13, color: C.accent, fontWeight: '600' },

  scroll: { flex: 1 },

  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.borderSoft,
    // @ts-ignore
    cursor: 'pointer',
  },
  itemUnread: {
    backgroundColor: C.accentBg,
    borderLeftWidth: 3, borderLeftColor: C.accent,
  },
  iconBubble: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.surfaceEl,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
    flexShrink: 0,
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 2 },
  notifBody: { fontSize: 13, color: C.textSecondary, marginBottom: 3 },
  notifTime: { fontSize: 11, color: C.accentSoft, fontWeight: '600' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, flexShrink: 0,
  },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: 14, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  bottomPad: { height: 80 },
})
