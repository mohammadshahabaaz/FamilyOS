import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '../../lib/r2.js'
import { memoryRepository } from './memory.repository.js'
import { familyRepository } from '../family/family.repository.js'
import { eventRepository } from '../event/event.repository.js'

const PRESIGN_TTL = 600

async function assertMember(userId: string, treeId: string) {
  const m = await familyRepository.getMembership(userId, treeId)
  if (!m) throw Object.assign(new Error('Not a member of this family'), { statusCode: 403 })
  return m
}

async function assertEventInTree(eventId: string, treeId: string) {
  const ev = await eventRepository.eventBelongsToTree(eventId, treeId)
  if (!ev) throw Object.assign(new Error('Event not found'), { statusCode: 404 })
  return ev
}

export const memoryService = {
  async requestUploadUrl(userId: string, treeId: string, eventId: string, opts: {
    mimeType:  string
    sizeBytes: number
  }) {
    await assertMember(userId, treeId)
    await assertEventInTree(eventId, treeId)

    const storage = await memoryRepository.getTreeStorageUsed(treeId)
    if (!storage) throw Object.assign(new Error('Tree not found'), { statusCode: 404 })

    const remaining = storage.storageLimitBytes - storage.storageUsedBytes
    if (BigInt(opts.sizeBytes) > remaining) {
      throw Object.assign(new Error('Storage quota exceeded'), { statusCode: 413 })
    }

    const ext = opts.mimeType.startsWith('video/') ? 'mp4'
      : opts.mimeType === 'image/webp' ? 'webp'
      : opts.mimeType === 'image/png'  ? 'png'
      : 'jpg'

    const r2Key = `trees/${treeId}/events/${eventId}/${randomUUID()}.${ext}`
    const type: 'PHOTO' | 'VIDEO' = opts.mimeType.startsWith('video/') ? 'VIDEO' : 'PHOTO'

    const command = new PutObjectCommand({
      Bucket:        R2_BUCKET,
      Key:           r2Key,
      ContentType:   opts.mimeType,
      ContentLength: opts.sizeBytes,
    })

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: PRESIGN_TTL })
    return { uploadUrl, r2Key, type, expiresIn: PRESIGN_TTL }
  },

  async confirmUpload(userId: string, treeId: string, eventId: string, opts: {
    r2Key:     string
    type:      'PHOTO' | 'VIDEO'
    sizeBytes: number
    caption?:  string
  }) {
    await assertMember(userId, treeId)
    await assertEventInTree(eventId, treeId)

    const media = await memoryRepository.createMedia({
      eventId,
      uploadedById: userId,
      r2Key:        opts.r2Key,
      type:         opts.type,
      caption:      opts.caption ?? null,
      sizeBytes:    BigInt(opts.sizeBytes),
    })

    await memoryRepository.incrementStorageUsed(treeId, BigInt(opts.sizeBytes))

    return {
      id:           media.id,
      type:         media.type,
      caption:      media.caption,
      url:          `${R2_PUBLIC_URL}/${opts.r2Key}`,
      thumbnailUrl: null,
    }
  },

  async deleteMedia(userId: string, treeId: string, eventId: string, mediaId: string) {
    await assertMember(userId, treeId)
    await assertEventInTree(eventId, treeId)

    const media = await memoryRepository.getMedia(mediaId)
    if (!media || media.eventId !== eventId) {
      throw Object.assign(new Error('Media not found'), { statusCode: 404 })
    }
    if (media.uploadedById !== userId) {
      throw Object.assign(new Error('Not authorised'), { statusCode: 403 })
    }

    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: media.r2Key }))
    } catch { /* orphaned R2 object — recoverable */ }

    await memoryRepository.deleteMedia(mediaId)
    await memoryRepository.decrementStorageUsed(treeId, media.sizeBytes)
  },

  async addComment(userId: string, treeId: string, eventId: string, text: string) {
    await assertMember(userId, treeId)
    await assertEventInTree(eventId, treeId)
    return memoryRepository.createComment({ eventId, userId, text })
  },

  async listComments(userId: string, treeId: string, eventId: string, opts: { cursor?: string; limit: number }) {
    await assertMember(userId, treeId)
    await assertEventInTree(eventId, treeId)

    const rows = await memoryRepository.listComments(eventId, opts)
    const hasMore = rows.length > opts.limit
    const items = hasMore ? rows.slice(0, opts.limit) : rows
    return { items, nextCursor: hasMore ? items[items.length - 1].id : undefined, hasMore }
  },

  async deleteComment(userId: string, treeId: string, eventId: string, commentId: string) {
    await assertMember(userId, treeId)
    await assertEventInTree(eventId, treeId)

    const comment = await memoryRepository.getComment(commentId)
    if (!comment || comment.eventId !== eventId) {
      throw Object.assign(new Error('Comment not found'), { statusCode: 404 })
    }
    if (comment.userId !== userId) {
      throw Object.assign(new Error('Not authorised'), { statusCode: 403 })
    }
    return memoryRepository.deleteComment(commentId)
  },
}
