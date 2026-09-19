import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { C, F, shadow } from '../lib/theme'
import { eventApi } from '../lib/api'
import { EVENT_GRADIENT, EVENT_LABEL, formatDate } from '../lib/types'
import type { FamilyEvent, Relative } from '../lib/types'
import type { Screen } from '../../App'

interface Comment {
  id: string
  text: string
  createdAt: string
  user: { username: string; profilePicUrl: string | null }
}

interface Props {
  event: FamilyEvent
  treeId: string
  visible: boolean
  onClose: () => void
  navigateTo: (s: Screen) => void
  // Optional — when supplied, each tagged person's card is captioned with their
  // computed relationship to the viewer instead of just a first name.
  myRelatives?: Relative[]
  myPersonId?: string
}

export default function EventDetailModal({
  event,
  treeId,
  visible,
  onClose,
  navigateTo,
  myRelatives,
  myPersonId,
}: Props) {
  const [liked, setLiked] = useState(event.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(event.likeCount ?? 0)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)
  const commentInputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (!visible) return
    setLiked(event.likedByMe ?? false)
    setLikeCount(event.likeCount ?? 0)
    setActivePhoto(0)
    setLoadingComments(true)
    eventApi
      .listComments(treeId, event.id)
      .then((res) => setComments(res.items))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false))
  }, [visible, event.id])

  async function handleLike() {
    try {
      const res = await eventApi.like(treeId, event.id)
      setLiked(res.liked)
      setLikeCount((prev) => (res.liked ? prev + 1 : prev - 1))
    } catch {}
  }

  async function handleComment() {
    const text = newComment.trim()
    if (!text) return
    setPostingComment(true)
    try {
      const c = await eventApi.addComment(treeId, event.id, text)
      setComments((prev) => [
        {
          id: c.id,
          text: c.text,
          createdAt: c.createdAt,
          user: c.user,
        },
        ...prev,
      ])
      setNewComment('')
    } catch {
    } finally {
      setPostingComment(false)
    }
  }

  const colors = EVENT_GRADIENT[event.type] ?? EVENT_GRADIENT.CUSTOM
  const label = EVENT_LABEL[event.type] ?? 'Event'
  const hasMedia = event.media.length > 0

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Close button */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{label}</Text>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo gallery OR gradient banner */}
          {hasMedia ? (
            <View style={styles.galleryWrap}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(
                    e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width,
                  )
                  setActivePhoto(idx)
                }}
              >
                {event.media.map((m) =>
                  m.type === 'VIDEO' ? (
                    // @ts-ignore — raw web <video>, mirrors the <input type="date"> pattern used elsewhere
                    <video
                      key={m.id}
                      src={m.url}
                      controls
                      playsInline
                      style={{
                        width: '100%',
                        height: 300,
                        objectFit: 'contain',
                        background: '#000',
                      }}
                    />
                  ) : (
                    <Image
                      key={m.id}
                      source={{ uri: m.url || m.thumbnail }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  ),
                )}
              </ScrollView>
              {event.media.length > 1 && (
                <View style={styles.photoDots}>
                  {event.media.map((_, i) => (
                    <View key={i} style={[styles.dot, i === activePhoto && styles.dotActive]} />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View
              style={[
                styles.banner,
                {
                  // @ts-ignore
                  background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
                },
              ]}
            >
              <Text style={styles.bannerLabel}>{label}</Text>
              <Text style={styles.bannerTitle}>{event.title}</Text>
            </View>
          )}

          {/* Event info */}
          <View style={styles.infoBlock}>
            <View
              style={[
                styles.typePill,
                {
                  // @ts-ignore
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                },
              ]}
            >
              <Text style={styles.typePillText}>{label}</Text>
            </View>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
            {event.description && <Text style={styles.eventDesc}>{event.description}</Text>}
          </View>

          {/* Tagged people */}
          {event.taggedPersons.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>With</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.taggedRow}
              >
                {event.taggedPersons.map((p) => {
                  const isMe = !!(myPersonId && p.id === myPersonId)
                  const relation = myRelatives?.find((r) => r.person.id === p.id)?.relationship
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.taggedPerson}
                      onPress={() => {
                        onClose()
                        navigateTo({ name: 'person', personId: p.id })
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.taggedAvatar}>
                        {p.profilePicUrl ? (
                          <Image source={{ uri: p.profilePicUrl }} style={styles.taggedImg} />
                        ) : (
                          <Text style={styles.taggedInitial}>{p.firstName?.[0] ?? '?'}</Text>
                        )}
                      </View>
                      <Text style={styles.taggedName} numberOfLines={1}>
                        {p.firstName}
                      </Text>
                      {(isMe || relation) && (
                        <Text style={styles.taggedRelation} numberOfLines={1}>
                          {isMe ? 'You' : relation}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          )}

          {/* Like + stats row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.likeBtn} onPress={handleLike} activeOpacity={0.7}>
              <Text style={[styles.likeIcon, liked && styles.likeIconActive]}>
                {liked ? '♥' : '♡'}
              </Text>
              <Text style={[styles.likeCount, liked && styles.likeCountActive]}>
                {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.commentCountText}>
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </Text>
          </View>

          {/* Comment input */}
          <View style={styles.commentInput}>
            <TextInput
              ref={commentInputRef}
              style={styles.input}
              placeholder="Add a comment…"
              placeholderTextColor={C.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.postBtn, !newComment.trim() && styles.postBtnDisabled]}
              onPress={handleComment}
              disabled={!newComment.trim() || postingComment}
              activeOpacity={0.8}
            >
              {postingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.postBtnText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Comments list */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments</Text>
            {loadingComments ? (
              <ActivityIndicator color={C.accent} style={{ padding: 20 }} />
            ) : comments.length === 0 ? (
              <Text style={styles.noComments}>Be the first to comment</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    {c.user.profilePicUrl ? (
                      <Image
                        source={{ uri: c.user.profilePicUrl }}
                        style={styles.commentAvatarImg}
                      />
                    ) : (
                      <Text style={styles.commentAvatarInitial}>
                        {c.user.username[0]?.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUsername}>@{c.user.username}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surfaceEl,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  closeIcon: { fontSize: 16, color: C.textSecondary, fontWeight: '700' },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
  },

  scroll: { flex: 1 },

  galleryWrap: { position: 'relative', backgroundColor: C.surfaceEl },
  photo: { width: '100%', height: 300 },
  photoDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 18 },

  banner: {
    height: 200,
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    // @ts-ignore
    textTransform: 'uppercase',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    // @ts-ignore
    fontFamily: F.serif,
  },

  infoBlock: { padding: 16 },
  typePill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  typePillText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  eventTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: F.serif,
  },
  eventDate: { fontSize: 13, color: C.accentSoft, fontWeight: '600', marginBottom: 8 },
  eventDesc: { fontSize: 14, color: C.textSecondary, lineHeight: 22 },

  section: { paddingHorizontal: 16, paddingTop: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 10,
    // @ts-ignore
    textTransform: 'uppercase',
  },

  taggedRow: { gap: 14, paddingBottom: 4 },
  taggedPerson: { alignItems: 'center', width: 52 },
  taggedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.accentBg,
    borderWidth: 1.5,
    borderColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  taggedImg: { width: '100%', height: '100%' },
  taggedInitial: { fontSize: 18, fontWeight: '700', color: C.accent },
  taggedName: { fontSize: 10, fontWeight: '600', color: C.textPrimary, textAlign: 'center' },
  taggedRelation: { fontSize: 9, fontWeight: '600', color: C.accent, textAlign: 'center' },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
    gap: 16,
  },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeIcon: { fontSize: 22, color: C.textSecondary },
  likeIconActive: { color: '#E05547' },
  likeCount: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
  likeCountActive: { color: '#E05547' },
  commentCountText: { fontSize: 14, color: C.textSecondary },

  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    backgroundColor: C.surfaceEl,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  postBtn: {
    backgroundColor: C.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  noComments: { fontSize: 13, color: C.textSecondary, fontStyle: 'italic', paddingBottom: 12 },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: C.accentBg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  commentAvatarImg: { width: '100%', height: '100%' },
  commentAvatarInitial: { fontSize: 14, fontWeight: '700', color: C.accent },
  commentBubble: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: C.borderSoft,
  },
  commentUsername: { fontSize: 12, fontWeight: '700', color: C.accent, marginBottom: 3 },
  commentText: { fontSize: 14, color: C.textPrimary, lineHeight: 20 },

  bottomPad: { height: 60 },
})
