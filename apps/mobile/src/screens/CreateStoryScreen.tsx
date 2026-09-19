import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native'
import { storyApi, ApiError } from '../lib/api'
import type { StoryItem } from '../lib/api'
import {
  compressImage,
  extractVideoThumbnail,
  uploadToPresignedUrl,
  pickMediaFile,
} from '../lib/media-upload'
import { C } from '../lib/theme'

interface Props {
  treeId: string
  onSave: (story: StoryItem) => void
  onCancel: () => void
}

export default function CreateStoryScreen({ treeId, onSave, onCancel }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [thumbBlob, setThumbBlob] = useState<Blob | null>(null)
  const [mediaType, setMediaType] = useState<'PHOTO' | 'VIDEO'>('PHOTO')
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [picking, setPicking] = useState(false)
  const [caption, setCaption] = useState('')
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePick() {
    setError(null)
    const file = await pickMediaFile()
    if (!file) return
    setPicking(true)
    try {
      if (file.type.startsWith('video/')) {
        const thumb = await extractVideoThumbnail(file)
        setMediaType('VIDEO')
        setMimeType(file.type || 'video/mp4')
        setBlob(file)
        setThumbBlob(thumb)
        setPreviewUrl(URL.createObjectURL(thumb))
      } else {
        const compressed = await compressImage(file)
        setMediaType('PHOTO')
        setMimeType('image/jpeg')
        setBlob(compressed)
        setThumbBlob(null)
        setPreviewUrl(URL.createObjectURL(compressed))
      }
    } catch {
      setError('Could not process that file — try another one.')
    } finally {
      setPicking(false)
    }
  }

  async function handleShare() {
    if (!blob) {
      setError('Add a photo or video first.')
      return
    }
    setSharing(true)
    setError(null)
    try {
      let thumbnailR2Key: string | undefined
      if (mediaType === 'VIDEO' && thumbBlob) {
        const thumb = await storyApi.requestUploadUrl({
          treeId,
          mimeType: 'image/jpeg',
          sizeBytes: thumbBlob.size,
        })
        await uploadToPresignedUrl(thumb.uploadUrl, thumbBlob, 'image/jpeg')
        thumbnailR2Key = thumb.r2Key
      }

      const { uploadUrl, r2Key, type } = await storyApi.requestUploadUrl({
        treeId,
        mimeType,
        sizeBytes: blob.size,
      })
      await uploadToPresignedUrl(uploadUrl, blob, mimeType)
      const story = await storyApi.confirmUpload({
        treeId,
        r2Key,
        type,
        sizeBytes: blob.size,
        caption: caption.trim() || undefined,
        thumbnailR2Key,
      })
      onSave(story)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to share story.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Story</Text>
        <TouchableOpacity
          onPress={handleShare}
          disabled={!blob || sharing}
          style={[styles.shareBtn, (!blob || sharing) && styles.shareBtnDisabled]}
        >
          {sharing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.shareText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.body}>
        {previewUrl ? (
          <TouchableOpacity style={styles.previewWrap} onPress={handlePick} activeOpacity={0.9}>
            <Image source={{ uri: previewUrl }} style={styles.preview} resizeMode="cover" />
            {mediaType === 'VIDEO' && (
              <View style={styles.videoBadge}>
                <Text style={styles.videoBadgeIcon}>▶</Text>
              </View>
            )}
            <View style={styles.changeBadge}>
              <Text style={styles.changeBadgeText}>
                Change {mediaType === 'VIDEO' ? 'video' : 'photo'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pickTile}
            onPress={handlePick}
            activeOpacity={0.7}
            disabled={picking}
          >
            {picking ? (
              <ActivityIndicator color={C.accent} size="large" />
            ) : (
              <>
                <Text style={styles.pickIcon}>+</Text>
                <Text style={styles.pickLabel}>Add a photo or video</Text>
                <Text style={styles.pickHint}>Disappears after 24 hours</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption…"
          placeholderTextColor={C.textSecondary}
          value={caption}
          onChangeText={setCaption}
          maxLength={500}
        />
      </View>
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
  shareBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
  },
  shareBtnDisabled: { opacity: 0.5 },
  shareText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  error: {
    backgroundColor: '#FEF2F2',
    color: C.danger,
    padding: 12,
    margin: 16,
    borderRadius: 8,
    fontSize: 13,
    textAlign: 'center',
  },

  body: { flex: 1, padding: 16, gap: 16 },

  pickTile: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.accentBg,
    // @ts-ignore
    cursor: 'pointer',
    minHeight: 320,
  },
  pickIcon: { fontSize: 40, color: C.accent, fontWeight: '300' },
  pickLabel: { fontSize: 15, color: C.accent, fontWeight: '700' },
  pickHint: { fontSize: 12, color: C.accentSoft },

  previewWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 320,
    // @ts-ignore
    cursor: 'pointer',
  },
  preview: { width: '100%', height: '100%' },
  changeBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  changeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  videoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadgeIcon: { fontSize: 12, color: '#FFFFFF' },

  captionInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textPrimary,
    backgroundColor: C.surfaceEl,
  },
})
