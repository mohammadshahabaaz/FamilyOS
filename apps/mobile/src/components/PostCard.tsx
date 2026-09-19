import { useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native'
import type { FamilyEvent, MediaItem, Relative } from '../lib/types'
import { EVENT_GRADIENT, EVENT_LABEL, timeAgo } from '../lib/types'
import { eventApi } from '../lib/api'
import type { Screen } from '../../App'
import { C, F, shadow } from '../lib/theme'
import ActionSheet from './ActionSheet'
import ConfirmDialog from './ConfirmDialog'

interface Comment {
  id: string
  text: string
  createdAt: string
  user: { username: string; profilePicUrl: string | null }
}

interface Props {
  event: FamilyEvent
  treeId: string
  navigateTo: (s: Screen) => void
  onEdit?: (event: FamilyEvent) => void
  onDelete?: (eventId: string) => void
  // Viewer's own computed relationships — powers the relationship-aware
  // subtitle below (e.g. "Your Grandmother's Wedding" instead of "Wedding").
  myRelatives?: Relative[]
  myPersonId?: string
}

// ─── Full-screen photo lightbox ───────────────────────────────────────────────

function PhotoLightbox({
  media,
  startIndex,
  onClose,
}: {
  media: MediaItem[]
  startIndex: number
  onClose: () => void
}) {
  const [current, setCurrent] = useState(startIndex)
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={lbStyles.root}>
        {/* Close */}
        <TouchableOpacity style={lbStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={lbStyles.closeIcon}>✕</Text>
        </TouchableOpacity>

        {/* Counter */}
        <View style={lbStyles.counter}>
          <Text style={lbStyles.counterText}>
            {current + 1} / {media.length}
          </Text>
        </View>

        {/* Scrollable images */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: current * 390, y: 0 }}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / 390)
            setCurrent(idx)
          }}
          style={lbStyles.scroll}
          contentContainerStyle={lbStyles.scrollContent}
        >
          {media.map((m) =>
            m.type === 'VIDEO' ? (
              <View key={m.id} style={lbStyles.imageWrap}>
                {/* @ts-ignore — raw web <video>, mirrors the <input type="date"> pattern used elsewhere */}
                <video
                  src={m.url}
                  controls
                  playsInline
                  style={{ width: 390, height: 520, objectFit: 'contain', background: '#000' }}
                />
              </View>
            ) : (
              <View key={m.id} style={lbStyles.imageWrap}>
                <Image
                  source={{ uri: m.url || m.thumbnail }}
                  style={lbStyles.image}
                  resizeMode="contain"
                />
              </View>
            ),
          )}
        </ScrollView>

        {/* Dot indicators */}
        {media.length > 1 && (
          <View style={lbStyles.dotsRow}>
            {media.map((_, i) => (
              <View key={i} style={[lbStyles.dot, i === current && lbStyles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </Modal>
  )
}

const lbStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
  counter: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  counterText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  scroll: { width: '100%' },
  scrollContent: { alignItems: 'center' },
  imageWrap: { width: 390, height: '100%', alignItems: 'center', justifyContent: 'center' },
  image: { width: 390, height: 520 },
  dotsRow: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 18 },
})

// ─── Photo gallery strip inside a card ────────────────────────────────────────

function PhotoGallery({ media, onOpen }: { media: MediaItem[]; onOpen: (i: number) => void }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  if (media.length === 0) return null

  if (media.length === 1) {
    return (
      <TouchableOpacity onPress={() => onOpen(0)} activeOpacity={0.92}>
        {/* Previews always use the thumbnail — media[0].url is the raw file, which
            for a video is not an image and can't be decoded by <Image>. */}
        <Image
          source={{ uri: media[0].thumbnail || media[0].url }}
          style={galStyles.singleImg}
          resizeMode="cover"
        />
        {media[0].type === 'VIDEO' && (
          <View style={galStyles.playBadge}>
            <Text style={galStyles.playBadgeIcon}>▶</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / 375)
          setActiveIdx(idx)
        }}
      >
        {media.map((m, i) => (
          <TouchableOpacity key={m.id} onPress={() => onOpen(i)} activeOpacity={0.92}>
            <Image
              source={{ uri: m.thumbnail || m.url }}
              style={galStyles.galleryImg}
              resizeMode="cover"
            />
            {m.type === 'VIDEO' && (
              <View style={galStyles.playBadge}>
                <Text style={galStyles.playBadgeIcon}>▶</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Dot indicators + counter */}
      <View style={galStyles.dotsRow}>
        {media.map((_, i) => (
          <View key={i} style={[galStyles.dot, i === activeIdx && galStyles.dotActive]} />
        ))}
        <View style={galStyles.counter}>
          <Text style={galStyles.counterText}>
            {activeIdx + 1}/{media.length}
          </Text>
        </View>
      </View>
    </View>
  )
}

const galStyles = StyleSheet.create({
  singleImg: { width: '100%', aspectRatio: 4 / 3 },
  galleryImg: { width: 375, aspectRatio: 4 / 3 },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -22,
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadgeIcon: { fontSize: 16, color: '#FFFFFF' },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.border },
  dotActive: { backgroundColor: C.accent, width: 14 },
  counter: {
    position: 'absolute',
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  counterText: { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },
})

// ─── Main PostCard ─────────────────────────────────────────────────────────────

export default function PostCard({
  event,
  treeId,
  navigateTo,
  onEdit,
  onDelete,
  myRelatives,
  myPersonId,
}: Props) {
  const [liked, setLiked] = useState(event.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(event.likeCount ?? 0)
  const [liking, setLiking] = useState(false)
  const [localCmtCount, setLocalCmtCount] = useState(event.commentCount)

  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const poster = event.taggedPersons[0]
  const colors = EVENT_GRADIENT[event.type] ?? EVENT_GRADIENT.CUSTOM
  const label = EVENT_LABEL[event.type] ?? 'Event'
  const hasMedia = event.media.length > 0

  // Relationship-aware narration — the same memory reads differently per viewer,
  // computed live from the BFS engine's output rather than any stored label.
  const posterIsMe = !!(poster && myPersonId && poster.id === myPersonId)
  const posterRelation = poster
    ? myRelatives?.find((r) => r.person.id === poster.id)?.relationship
    : undefined
  const narratedSub = posterIsMe
    ? `Your ${label}`
    : posterRelation
      ? `Your ${posterRelation}'s ${label}`
      : label

  const posterHandle = poster?.linkedUser?.username
    ? `@${poster.linkedUser.username}`
    : poster
      ? `${poster.firstName.toLowerCase()}_${poster.lastName.toLowerCase()}`
      : 'khan_family'

  async function handleLike() {
    if (liking) return
    const prevLiked = liked
    const prevCount = likeCount
    setLiking(true)
    try {
      const res = await eventApi.like(treeId, event.id)
      setLiked(res.liked)
      setLikeCount((c) => (res.liked ? c + 1 : Math.max(0, c - 1)))
    } catch {
      setLiked(prevLiked)
      setLikeCount(prevCount)
    } finally {
      setLiking(false)
    }
  }

  async function handleOpenComments() {
    if (showComments) {
      setShowComments(false)
      return
    }
    setShowComments(true)
    if (comments.length > 0) return
    setCommentsLoading(true)
    try {
      const res = await eventApi.listComments(treeId, event.id)
      setComments(res.items)
    } catch {
    } finally {
      setCommentsLoading(false)
    }
  }

  async function handlePostComment() {
    const text = commentText.trim()
    if (!text || posting) return
    setPosting(true)
    try {
      const res = await eventApi.addComment(treeId, event.id, text)
      setComments((prev) => [
        ...prev,
        {
          id: res.id,
          text: res.text,
          createdAt: res.createdAt,
          user: res.user ?? { username: 'me', profilePicUrl: null },
        },
      ])
      setLocalCmtCount((c) => c + 1)
      setCommentText('')
    } catch {
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await eventApi.delete(treeId, event.id)
      onDelete?.(event.id)
    } catch {
    } finally {
      setDeleting(false)
    }
  }

  // Both event date and created date (req 7)
  const eventDate = new Date(event.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const createdDate = (event as any).createdAt
    ? new Date((event as any).createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <View style={styles.card}>
      {/* ── Date row: type badge + event date + created date ── */}
      <View style={styles.dateRow}>
        <View
          style={[
            styles.typeBadge,
            {
              // @ts-ignore
              background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            },
          ]}
        >
          <Text style={styles.typeBadgeText}>{label}</Text>
        </View>
        <View style={styles.dateGroup}>
          <Text style={styles.eventDateLabel}>{eventDate}</Text>
          {createdDate && <Text style={styles.createdDateLabel}>Posted {createdDate}</Text>}
        </View>
        {(onEdit || onDelete) && (
          <TouchableOpacity
            style={styles.headerDots}
            onPress={() => setShowMenu(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="More options"
            // @ts-ignore
            cursor="pointer"
          >
            <Text style={styles.dotsText}>•••</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Poster header ── */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => poster && navigateTo({ name: 'person', personId: poster.id })}
        activeOpacity={0.8}
      >
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            {poster?.profilePicUrl ? (
              <Image source={{ uri: poster.profilePicUrl }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{poster?.firstName[0] ?? 'F'}</Text>
              </View>
            )}
          </View>
        </View>
        <View>
          <Text style={styles.headerHandle}>{posterHandle}</Text>
          <Text style={styles.headerSub}>{narratedSub}</Text>
        </View>
      </TouchableOpacity>

      {/* ── Caption above media (Instagram-style) ── */}
      {(event.title || event.description) && (
        <View style={styles.captionRow}>
          <Text style={styles.captionTitle}>{event.title}</Text>
          {event.description && <Text style={styles.captionDesc}>{event.description}</Text>}
        </View>
      )}

      {/* ── Media: full gallery if photos exist, gradient banner otherwise ── */}
      {hasMedia ? (
        <PhotoGallery media={event.media} onOpen={(i) => setLightboxIdx(i)} />
      ) : (
        <View
          style={[
            styles.bannerBg,
            {
              // @ts-ignore
              background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
            },
          ]}
        >
          <Text style={styles.bannerTypeLabel}>{label.toUpperCase()}</Text>
          <Text style={styles.bannerTitle}>{event.title}</Text>
          {event.taggedPersons.length > 0 && (
            <Text style={styles.bannerPeople}>
              {event.taggedPersons.map((p) => p.firstName).join(' · ')}
            </Text>
          )}
        </View>
      )}

      {/* ── Action row ── */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            onPress={handleLike}
            style={styles.actionBtn}
            activeOpacity={0.7}
            disabled={liking}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Unlike' : 'Like'}
          >
            <Text style={[styles.actionIcon, liked && styles.likedIcon]}>{liked ? '❤️' : '♡'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={handleOpenComments}
            accessibilityRole="button"
            accessibilityLabel="Comment"
          >
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>
        </View>
        {event.media.length > 0 && (
          <TouchableOpacity
            style={styles.viewPhotosBtn}
            onPress={() => setLightboxIdx(0)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewPhotosText}>
              {event.media.length} {event.media.length === 1 ? 'photo' : 'photos'} ›
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Likes */}
      {likeCount > 0 && (
        <Text style={styles.likes}>
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </Text>
      )}

      {/* Tagged */}
      {event.taggedPersons.length > 0 && (
        <View style={styles.taggedRow}>
          {event.taggedPersons.slice(0, 4).map((p, i) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => navigateTo({ name: 'person', personId: p.id })}
              activeOpacity={0.8}
            >
              <View style={[styles.tagAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                {p.profilePicUrl ? (
                  <Image source={{ uri: p.profilePicUrl }} style={styles.tagAvatarImg} />
                ) : (
                  <View style={[styles.tagAvatarImg, styles.tagAvatarFallback]}>
                    <Text style={styles.tagInitial}>{p.firstName?.[0] ?? '?'}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
          <Text style={styles.tagText}>
            {' '}
            {event.taggedPersons
              .slice(0, 3)
              .map((p) => p.firstName)
              .join(', ')}
            {event.taggedPersons.length > 3 ? ` +${event.taggedPersons.length - 3}` : ''}
          </Text>
        </View>
      )}

      {/* Comments trigger */}
      {localCmtCount > 0 && (
        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenComments}>
          <Text style={styles.commentsLink}>
            {showComments ? 'Hide comments' : `View all ${localCmtCount} comments`}
          </Text>
        </TouchableOpacity>
      )}

      {showComments && (
        <View style={styles.commentsSection}>
          {commentsLoading ? (
            <ActivityIndicator size="small" color={C.accent} style={{ marginVertical: 8 }} />
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <Text style={styles.commentAuthor}>@{c.user.username} </Text>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            ))
          )}
          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentTextInput}
              placeholder="Add a comment…"
              placeholderTextColor={C.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handlePostComment}
              returnKeyType="send"
            />
            {posting ? (
              <ActivityIndicator size="small" color={C.accent} />
            ) : (
              <TouchableOpacity onPress={handlePostComment} disabled={!commentText.trim()}>
                <Text style={[styles.postBtn, !commentText.trim() && styles.postBtnDisabled]}>
                  Post
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {poster ? `${poster.firstName} ${poster.lastName}` : 'Family'}
        </Text>
        <Text style={styles.footerMeta}>{timeAgo(event.date)}</Text>
      </View>

      {/* Three-dot action sheet */}
      <ActionSheet
        visible={showMenu}
        title={event.title}
        actions={[
          ...(onEdit ? [{ label: 'Edit Event', icon: '✏️', onPress: () => onEdit(event) }] : []),
          ...(onDelete
            ? [
                {
                  label: 'Delete Event',
                  icon: '🗑️',
                  destructive: true,
                  onPress: () => setConfirmDelete(true),
                },
              ]
            : []),
        ]}
        onClose={() => setShowMenu(false)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this memory?"
        body={`"${event.title}" and all its photos will be permanently removed.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => {
          setConfirmDelete(false)
          handleDelete()
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Full-screen photo lightbox */}
      {lightboxIdx !== null && (
        <PhotoLightbox
          media={event.media}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: shadow.card,
  },

  // ── Date row ──
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  typeBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(20,10,0,0.75)',
    letterSpacing: 0.3,
  },
  dateGroup: { flex: 1 },
  eventDateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
    fontStyle: 'italic',
  },
  createdDateLabel: { fontSize: 10, color: C.textSecondary, marginTop: 1 },
  headerDots: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dotsText: { fontSize: 18, color: C.textSecondary, letterSpacing: 1.5 },

  // ── Poster header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    // @ts-ignore
    cursor: 'pointer',
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 10,
    padding: 2,
    // @ts-ignore
    background: `linear-gradient(135deg, var(--fo-accent) 0%, var(--fo-accent-soft) 100%)`,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.surface,
    overflow: 'hidden',
    backgroundColor: C.accentBg,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { backgroundColor: C.accentBg, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 14, fontWeight: '700', color: C.accent },
  headerHandle: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  headerSub: { fontSize: 11, color: C.accentSoft, marginTop: 1, fontWeight: '600' },

  // ── Caption ──
  captionRow: { paddingHorizontal: 14, paddingBottom: 10, gap: 3 },
  captionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
    lineHeight: 20,
    // @ts-ignore
    fontFamily: F.serif,
  },
  captionDesc: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },

  // ── Gradient banner (no photos) ──
  bannerBg: {
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  bannerTypeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(26,22,17,0.4)',
    letterSpacing: 2.5,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1611',
    textAlign: 'center',
    lineHeight: 32,
    // @ts-ignore
    fontFamily: F.serif,
  },
  bannerPeople: {
    fontSize: 13,
    color: 'rgba(26,22,17,0.5)',
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Actions ──
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  actionIcon: { fontSize: 24, lineHeight: 28, color: C.textSecondary },
  likedIcon: { color: '#B03A2E' },
  viewPhotosBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: C.accentBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  viewPhotosText: { fontSize: 11, fontWeight: '700', color: C.accent },

  likes: {
    paddingHorizontal: 14,
    paddingTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },

  taggedRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 6 },
  tagAvatar: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.surface,
    overflow: 'hidden',
    backgroundColor: C.accentBg,
  },
  tagAvatarImg: { width: '100%', height: '100%' },
  tagAvatarFallback: {
    backgroundColor: C.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagInitial: { fontSize: 9, fontWeight: '700', color: C.accent },
  tagText: { fontSize: 12, color: C.textSecondary, marginLeft: 6, flexShrink: 1 },

  commentsLink: {
    paddingHorizontal: 14,
    paddingTop: 4,
    fontSize: 13,
    color: C.textSecondary,
    // @ts-ignore
    cursor: 'pointer',
  },
  commentsSection: {
    paddingHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
    marginTop: 6,
  },
  commentRow: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 3 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  commentText: { fontSize: 13, color: C.textPrimary, flex: 1 },
  commentInput: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, gap: 10 },
  commentTextInput: {
    flex: 1,
    fontSize: 13,
    color: C.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 4,
    // @ts-ignore
    outlineStyle: 'none',
  },
  postBtn: { fontSize: 13, fontWeight: '700', color: C.accent },
  postBtnDisabled: { color: C.accentSoft, opacity: 0.5 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
    marginTop: 4,
  },
  footerText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  footerMeta: { fontSize: 11, color: C.inMemoriam, letterSpacing: 0.2 },
})
