import { View, Text, ScrollView, Modal, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { C, F, shadow } from '../lib/theme'
import { EVENT_GRADIENT, EVENT_LABEL, formatDate } from '../lib/types'
import type { FamilyEvent, Relative } from '../lib/types'
import type { Screen } from '../../App'

export type StatsSheetType = 'events' | 'relatives' | 'memories'

interface Props {
  type: StatsSheetType | null
  events: FamilyEvent[]
  relatives: Relative[]
  navigateTo: (s: Screen) => void
  onClose: () => void
}

const TITLES: Record<StatsSheetType, string> = {
  events:    'Your Events',
  relatives: 'Your Relatives',
  memories:  'Your Memories',
}

export default function ProfileStatsSheet({ type, events, relatives, navigateTo, onClose }: Props) {
  if (!type) return null

  const photos = events.flatMap(e => e.media.map(m => ({ ...m, event: e })))

  function openEvent(e: FamilyEvent) {
    onClose()
    navigateTo({ name: 'events' })
  }

  function openPerson(personId: string) {
    onClose()
    navigateTo({ name: 'person', personId })
  }

  return (
    <Modal
      visible={!!type}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{TITLES[type]}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* EVENTS tab */}
          {type === 'events' && (
            events.length === 0 ? (
              <Empty icon="📅" text="No events yet" sub="Tag yourself in events to see them here" />
            ) : events.map(e => {
              const colors = EVENT_GRADIENT[e.type] ?? EVENT_GRADIENT.CUSTOM
              return (
                <TouchableOpacity key={e.id} style={styles.eventRow} onPress={() => openEvent(e)} activeOpacity={0.85}>
                  <View style={[styles.eventColorBar, {
                    // @ts-ignore
                    background: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})`,
                  }]} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{e.title}</Text>
                    <Text style={styles.eventMeta}>{EVENT_LABEL[e.type]} · {formatDate(e.date)}</Text>
                    <Text style={styles.eventStats}>
                      {e.likeCount} likes · {e.commentCount} comments · {e.media.length} photos
                    </Text>
                  </View>
                  {e.media[0] && (
                    <Image source={{ uri: e.media[0].thumbnail }} style={styles.eventThumb} resizeMode="cover" />
                  )}
                </TouchableOpacity>
              )
            })
          )}

          {/* RELATIVES tab */}
          {type === 'relatives' && (
            relatives.length === 0 ? (
              <Empty icon="👨‍👩‍👦" text="No relatives linked" sub="Add family members to your tree" />
            ) : relatives.map(r => (
              <TouchableOpacity
                key={r.person.id}
                style={styles.relRow}
                onPress={() => openPerson(r.person.id)}
                activeOpacity={0.85}
              >
                <View style={styles.relAvatar}>
                  {r.person.profilePicUrl ? (
                    <Image source={{ uri: r.person.profilePicUrl }} style={styles.relAvatarImg} />
                  ) : (
                    <Text style={styles.relAvatarInitial}>{r.person.firstName?.[0] ?? '?'}</Text>
                  )}
                </View>
                <View style={styles.relInfo}>
                  <Text style={styles.relName}>{r.person.firstName} {r.person.lastName}</Text>
                  <Text style={styles.relLabel}>{r.relationship}</Text>
                </View>
                <Text style={styles.relArrow}>›</Text>
              </TouchableOpacity>
            ))
          )}

          {/* MEMORIES tab */}
          {type === 'memories' && (
            photos.length === 0 ? (
              <Empty icon="📸" text="No photos yet" sub="Upload photos when creating events" />
            ) : (
              <View style={styles.photoGrid}>
                {photos.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.photoCell}
                    onPress={() => openEvent(m.event)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: m.url || m.thumbnail }} style={styles.photoImg} resizeMode="cover" />
                    <View style={styles.photoOverlay}>
                      <Text style={styles.photoEventTitle} numberOfLines={1}>{m.event.title}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </View>
    </Modal>
  )
}

function Empty({ icon, text, sub }: { icon: string; text: string; sub: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '80%',
    backgroundColor: C.bg,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    // @ts-ignore
    boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
    overflow: 'hidden',
  },
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: {
    fontSize: 18, fontWeight: '800', color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.surfaceEl, alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { fontSize: 15, color: C.textSecondary, fontWeight: '700' },

  scroll: { flex: 1 },

  // Events
  eventRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.borderSoft,
    backgroundColor: C.surface, gap: 12,
    // @ts-ignore
    cursor: 'pointer',
  },
  eventColorBar: { width: 4, height: 48, borderRadius: 2, flexShrink: 0 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 2 },
  eventMeta: { fontSize: 12, color: C.accent, fontWeight: '600', marginBottom: 2 },
  eventStats: { fontSize: 11, color: C.textSecondary },
  eventThumb: {
    width: 52, height: 52, borderRadius: 8,
    backgroundColor: C.accentBg, flexShrink: 0,
  },

  // Relatives
  relRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.borderSoft,
    backgroundColor: C.surface,
    // @ts-ignore
    cursor: 'pointer',
  },
  relAvatar: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.accentBg, borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    flexShrink: 0,
  },
  relAvatarImg: { width: '100%', height: '100%' },
  relAvatarInitial: { fontSize: 18, fontWeight: '700', color: C.accent },
  relInfo: { flex: 1 },
  relName: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 2 },
  relLabel: {
    fontSize: 12, color: C.accent, fontWeight: '600',
    backgroundColor: C.accentBg, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    borderWidth: 1, borderColor: C.accentSoft,
  },
  relArrow: { fontSize: 20, color: C.border, fontWeight: '700' },

  // Memories photo grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  photoCell: { width: '33.33%', aspectRatio: 1, position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 4, paddingVertical: 3,
  },
  photoEventTitle: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: 13, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  bottomPad: { height: 60 },
})
