import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native'
import { eventApi, mediaApi } from '../lib/api'
import { ApiError } from '../lib/api'
import { EVENT_GRADIENT } from '../lib/types'
import type { FamilyEvent, FamilyCircle } from '../lib/types'
import type { Person } from '../lib/types'
import { C } from '../lib/theme'
import { compressImage, extractVideoThumbnail } from '../lib/media-upload'

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifyGroup = 'all' | FamilyCircle
const NOTIFY_GROUPS: { key: NotifyGroup; label: string; desc: string }[] = [
  { key: 'all', label: 'Everyone', desc: 'All family members' },
  { key: 'close', label: 'Close', desc: 'Immediate family only' },
  { key: 'paternal', label: "Father's Side", desc: 'Paternal relatives' },
  { key: 'maternal', label: "Mother's Side", desc: 'Maternal relatives' },
  { key: 'internal', label: 'Internal', desc: 'Blood relatives' },
  { key: 'extended', label: 'Extended', desc: 'Full family' },
]

const EVENT_TYPES = [
  'BIRTHDAY',
  'ANNIVERSARY',
  'WEDDING',
  'TRIP',
  'GATHERING',
  'ACHIEVEMENT',
  'OTHER',
] as const

type EventType = (typeof EVENT_TYPES)[number]

const TYPE_LABELS: Record<EventType, string> = {
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary',
  WEDDING: 'Wedding',
  TRIP: 'Trip',
  GATHERING: 'Gathering',
  ACHIEVEMENT: 'Achievement',
  OTHER: 'Other',
}

interface PendingPhoto {
  previewUrl: string
  blob?: Blob
  thumbBlob?: Blob // VIDEO only — extracted frame, uploaded alongside the video
  mediaType: 'PHOTO' | 'VIDEO'
  mimeType: string
  compressing: boolean
  error?: boolean
}

interface Props {
  treeId: string
  persons: Person[]
  onSave: (event: FamilyEvent) => void
  onCancel: () => void
  // When present: edit mode — prefill fields, call PATCH instead of POST
  initialEvent?: FamilyEvent
}

async function uploadPhotos(treeId: string, eventId: string, photos: PendingPhoto[]) {
  const ready = photos.filter((p) => p.blob && !p.error)
  let failures = 0
  for (const photo of ready) {
    try {
      // Video thumbnails are extracted client-side (no server-side ffmpeg) — upload
      // the frame first so its r2Key can be attached to the video's confirm call.
      let thumbnailR2Key: string | undefined
      if (photo.mediaType === 'VIDEO' && photo.thumbBlob) {
        const thumb = await mediaApi.requestUploadUrl(treeId, eventId, {
          mimeType: 'image/jpeg',
          sizeBytes: photo.thumbBlob.size,
        })
        await fetch(thumb.uploadUrl, {
          method: 'PUT',
          body: photo.thumbBlob,
          headers: { 'Content-Type': 'image/jpeg' },
        })
        thumbnailR2Key = thumb.r2Key
      }

      const { uploadUrl, r2Key } = await mediaApi.requestUploadUrl(treeId, eventId, {
        mimeType: photo.mimeType,
        sizeBytes: photo.blob!.size,
      })
      await fetch(uploadUrl, {
        method: 'PUT',
        body: photo.blob!,
        headers: { 'Content-Type': photo.mimeType },
      })
      await mediaApi.confirmUpload(treeId, eventId, {
        r2Key,
        type: photo.mediaType,
        sizeBytes: photo.blob!.size,
        thumbnailR2Key,
      })
    } catch {
      failures++
    }
  }
  return { failures, attempted: ready.length }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateEventScreen({
  treeId,
  persons,
  onSave,
  onCancel,
  initialEvent,
}: Props) {
  const isEdit = !!initialEvent

  const [type, setType] = useState<EventType>((initialEvent?.type as EventType) ?? 'BIRTHDAY')
  const [title, setTitle] = useState(initialEvent?.title ?? '')
  const [description, setDescription] = useState(initialEvent?.description ?? '')
  const [date, setDate] = useState(() => {
    if (initialEvent) return initialEvent.date.split('T')[0]
    return new Date().toISOString().split('T')[0]
  })
  const [tagged, setTagged] = useState<Set<string>>(
    new Set(initialEvent?.taggedPersons.map((p) => p.id) ?? []),
  )
  const [notifyGroup, setNotifyGroup] = useState<NotifyGroup>('all')
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTag(personId: string) {
    setTagged((prev) => {
      const next = new Set(prev)
      next.has(personId) ? next.delete(personId) : next.add(personId)
      return next
    })
  }

  // Open file picker for photos + videos
  function handleAddPhotos() {
    if (typeof document === 'undefined') return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.multiple = true
    input.onchange = async (e: Event) => {
      const files = Array.from((e.target as HTMLInputElement).files ?? [])
      if (files.length === 0) return
      // Add pending entries immediately with preview URLs
      const pending: PendingPhoto[] = files.map((f) => {
        const isVideo = f.type.startsWith('video/')
        return {
          previewUrl: URL.createObjectURL(f),
          mediaType: isVideo ? 'VIDEO' : 'PHOTO',
          mimeType: isVideo ? f.type || 'video/mp4' : 'image/jpeg',
          compressing: true,
        }
      })
      setPhotos((prev) => [...prev, ...pending])
      // Compress images / extract video frames in background
      const startIdx = photos.length
      for (let i = 0; i < files.length; i++) {
        const idx = startIdx + i
        try {
          if (pending[i].mediaType === 'VIDEO') {
            const thumbBlob = await extractVideoThumbnail(files[i])
            const thumbUrl = URL.createObjectURL(thumbBlob)
            setPhotos((prev) => {
              const next = [...prev]
              if (next[idx]) {
                URL.revokeObjectURL(next[idx].previewUrl) // raw video URL never rendered
                next[idx] = {
                  ...next[idx],
                  blob: files[i],
                  thumbBlob,
                  previewUrl: thumbUrl,
                  compressing: false,
                }
              }
              return next
            })
          } else {
            const blob = await compressImage(files[i])
            setPhotos((prev) => {
              const next = [...prev]
              if (next[idx]) next[idx] = { ...next[idx], blob, compressing: false }
              return next
            })
          }
        } catch {
          setPhotos((prev) => {
            const next = [...prev]
            if (next[idx]) next[idx] = { ...next[idx], compressing: false, error: true }
            return next
          })
        }
      }
    }
    input.click()
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx]?.previewUrl ?? '')
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!date) {
      setError('Date is required.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      let saved: FamilyEvent
      if (isEdit) {
        saved = await eventApi.update(treeId, initialEvent!.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          taggedPersonIds: Array.from(tagged),
        })
      } else {
        saved = await eventApi.create(treeId, {
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          date: new Date(`${date}T00:00:00.000Z`).toISOString(),
          visibility: 'FAMILY',
          taggedPersonIds: Array.from(tagged),
          notifyGroup,
        })
      }
      // Upload photos before navigating — the event must actually carry its photos
      // when the user sees it next, not just eventually once something re-fetches.
      if (photos.length > 0) {
        const { failures, attempted } = await uploadPhotos(treeId, saved.id, photos)
        if (failures > 0) {
          setError(
            `Saved, but ${failures} of ${attempted} photo${attempted === 1 ? '' : 's'} failed to upload.`,
          )
          setLoading(false)
          return
        }
        // `saved` was captured before the uploads ran, so it still has an empty
        // media[] — refetch so the object handed to the caller actually has photos.
        saved = await eventApi.get(treeId, saved.id)
      }
      onSave(saved)
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : `Failed to ${isEdit ? 'update' : 'create'} event.`,
      )
    } finally {
      setLoading(false)
    }
  }

  const [g0, g1] = EVENT_GRADIENT[type] ?? ['#E5E7EB', '#9CA3AF']
  const anyCompressing = photos.some((p) => p.compressing)

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Memory' : 'New Memory'}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || anyCompressing}
          style={[styles.saveBtn, (loading || anyCompressing) && styles.saveBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveText}>{isEdit ? 'Save' : 'Share'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Event type selector (only in create mode) */}
        {!isEdit && (
          <>
            <Text style={styles.section}>Event type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {EVENT_TYPES.map((t) => {
                const [c0, c1] = EVENT_GRADIENT[t]
                const selected = t === type
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={[
                      styles.typeChip,
                      {
                        // @ts-ignore
                        background: selected
                          ? `linear-gradient(135deg, ${c0}, ${c1})`
                          : C.surfaceEl,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.typeChipText, { color: selected ? '#fff' : C.textPrimary }]}
                    >
                      {TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </>
        )}

        {/* Preview banner */}
        <View
          style={[
            styles.banner,
            {
              // @ts-ignore
              background: `linear-gradient(135deg, ${g0}, ${g1})`,
            },
          ]}
        >
          <Text style={styles.bannerType}>{TYPE_LABELS[type]}</Text>
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {title || 'Event title will appear here'}
          </Text>
        </View>

        {/* ── Photos ── */}
        <Text style={styles.section}>Photos & Videos</Text>
        <Text style={styles.photoHint}>
          {photos.length === 0
            ? 'Add photos or videos from your device · photos auto-optimised before upload'
            : `${photos.filter((p) => p.blob).length}/${photos.length} ready${anyCompressing ? ' · processing…' : ''}`}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoRow}
        >
          {/* + Add tile */}
          <TouchableOpacity
            style={styles.photoAddTile}
            onPress={handleAddPhotos}
            activeOpacity={0.7}
          >
            <Text style={styles.photoAddIcon}>+</Text>
            <Text style={styles.photoAddLabel}>Add</Text>
          </TouchableOpacity>
          {/* Pending photo tiles */}
          {photos.map((p, i) => (
            <View key={i} style={styles.photoTile}>
              <Image source={{ uri: p.previewUrl }} style={styles.photoThumb} resizeMode="cover" />
              {p.mediaType === 'VIDEO' && !p.compressing && !p.error && (
                <View style={styles.videoBadge}>
                  <Text style={styles.videoBadgeIcon}>▶</Text>
                </View>
              )}
              {p.compressing && (
                <View style={styles.photoOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
              {p.error && (
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoError}>✕</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.photoRemoveBtn}
                onPress={() => removePhoto(i)}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Text style={styles.photoRemoveIcon}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Details */}
        <Text style={styles.section}>Details</Text>

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder={`e.g. Tariq's 30th Birthday`}
          placeholderTextColor={C.textSecondary}
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />

        {!isEdit && (
          <>
            <Text style={styles.label}>Event Date *</Text>
            <Text style={styles.dateHint}>
              Can be a past or future date — we'll show both the event date and when you posted it.
            </Text>
            {/* @ts-ignore — web native date picker — NO min/max to allow past and future dates */}
            <input
              type="date"
              value={date}
              onChange={(e: any) => setDate(e.target.value)}
              style={{
                fontSize: 15,
                color: C.textPrimary,
                backgroundColor: C.surfaceEl,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 12px',
                marginBottom: 12,
                boxSizing: 'border-box',
                outline: 'none',
                marginLeft: 16,
                marginRight: 16,
                width: 'calc(100% - 32px)',
              }}
            />
          </>
        )}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Share what happened…"
          placeholderTextColor={C.textSecondary}
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          maxLength={2000}
        />

        {/* Tag people */}
        {persons.length > 0 && (
          <>
            <Text style={styles.section}>Tag family members</Text>
            <View style={styles.tagGrid}>
              {persons.map((p) => {
                const isTagged = tagged.has(p.id)
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.tagChip, isTagged && styles.tagChipActive]}
                    onPress={() => toggleTag(p.id)}
                  >
                    <Text style={[styles.tagChipText, isTagged && styles.tagChipTextActive]}>
                      {p.firstName} {p.lastName}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </>
        )}

        {/* Notify group — create only */}
        {!isEdit && (
          <>
            <Text style={styles.section}>Notify</Text>
            <Text style={styles.notifyHint}>Choose who gets notified about this event</Text>
            <View style={styles.notifyGrid}>
              {NOTIFY_GROUPS.map((g) => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.notifyChip, notifyGroup === g.key && styles.notifyChipActive]}
                  onPress={() => setNotifyGroup(g.key)}
                >
                  <Text
                    style={[
                      styles.notifyChipLabel,
                      notifyGroup === g.key && styles.notifyChipLabelActive,
                    ]}
                  >
                    {g.label}
                  </Text>
                  <Text
                    style={[
                      styles.notifyChipDesc,
                      notifyGroup === g.key && styles.notifyChipDescActive,
                    ]}
                  >
                    {g.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 16, color: C.textSecondary },
  saveBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scroll: { flex: 1 },
  error: {
    backgroundColor: '#FEF2F2',
    color: C.danger,
    padding: 12,
    margin: 16,
    borderRadius: 8,
    fontSize: 13,
    textAlign: 'center',
  },

  section: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textSecondary,
    // @ts-ignore
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },

  typeRow: { paddingHorizontal: 12, marginBottom: 4 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  typeChipText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  banner: {
    marginHorizontal: 16,
    marginVertical: 12,
    height: 120,
    borderRadius: 12,
    justifyContent: 'flex-end',
    padding: 16,
  },
  bannerType: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 4 },

  // Photos
  photoHint: { fontSize: 12, color: C.textSecondary, paddingHorizontal: 16, marginBottom: 10 },
  photoRow: { paddingHorizontal: 12, paddingBottom: 4, gap: 10 },
  photoAddTile: {
    width: 84,
    height: 84,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: C.accentBg,
    // @ts-ignore
    cursor: 'pointer',
  },
  photoAddIcon: { fontSize: 24, color: C.accent, fontWeight: '700' },
  photoAddLabel: { fontSize: 11, color: C.accent, fontWeight: '700' },
  photoTile: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: C.border,
  },
  photoThumb: { width: '100%', height: '100%' },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoError: { fontSize: 22, color: '#FFFFFF', fontWeight: '800' },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadgeIcon: { fontSize: 9, color: '#FFFFFF' },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  photoRemoveIcon: { fontSize: 14, color: '#FFFFFF', lineHeight: 18, fontWeight: '700' },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 4,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  dateHint: {
    fontSize: 11,
    color: C.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textPrimary,
    backgroundColor: C.surfaceEl,
    marginHorizontal: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surfaceEl,
  },
  tagChipActive: { borderColor: C.accent, backgroundColor: C.accentBg },
  tagChipText: { fontSize: 13, color: C.textPrimary, fontWeight: '500' },
  tagChipTextActive: { color: C.accent, fontWeight: '600' },

  notifyHint: { fontSize: 12, color: C.textSecondary, paddingHorizontal: 16, marginBottom: 10 },
  notifyGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  notifyChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surfaceEl,
    minWidth: '30%',
    flexGrow: 1,
  },
  notifyChipActive: { borderColor: C.accent, backgroundColor: C.accentBg },
  notifyChipLabel: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  notifyChipLabelActive: { color: C.accent },
  notifyChipDesc: { fontSize: 10, color: C.textSecondary, marginTop: 1 },
  notifyChipDescActive: { color: C.accentSoft },

  spacer: { height: 60 },
})
