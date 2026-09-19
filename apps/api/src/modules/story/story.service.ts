import { ConflictError, NotFoundError } from '@familyos/shared'
import { R2_PUBLIC_URL } from '../../lib/r2.js'
import { presignUpload } from '../../lib/media-presign.js'
import { thumbnailQueue, notificationFanout } from '../../lib/queues.js'
import { storyRepository } from './story.repository.js'
import { familyRepository } from '../family/family.repository.js'
import { memoryRepository } from '../memory/memory.repository.js'
import type { RequestStoryUploadInput, ConfirmStoryUploadInput } from '@familyos/shared'

const STORY_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours, matches ephemeral story semantics

async function assertMember(userId: string, treeId: string) {
  const m = await familyRepository.getMembership(userId, treeId)
  if (!m) throw Object.assign(new Error('Not a member of this family'), { statusCode: 403 })
  return m
}

function toUrl(key: string) {
  return `${R2_PUBLIC_URL}/${key}`
}

function transform(raw: NonNullable<Awaited<ReturnType<typeof storyRepository.findById>>>) {
  return {
    id: raw.id,
    treeId: raw.treeId,
    type: raw.type,
    caption: raw.caption,
    url: toUrl(raw.r2Key),
    thumbnailUrl: raw.thumbnailR2Key
      ? toUrl(raw.thumbnailR2Key)
      : raw.media[0]?.thumbnailR2Key
        ? toUrl(raw.media[0].thumbnailR2Key)
        : null,
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
    createdBy: raw.createdBy,
    viewCount: raw._count.views,
  }
}

export const storyService = {
  async requestUploadUrl(userId: string, input: RequestStoryUploadInput) {
    await assertMember(userId, input.treeId)

    const storage = await memoryRepository.getTreeStorageUsed(input.treeId)
    if (!storage) throw new NotFoundError('Tree not found')

    const remaining = storage.storageLimitBytes - storage.storageUsedBytes
    if (BigInt(input.sizeBytes) > remaining) {
      throw Object.assign(new Error('Storage quota exceeded'), { statusCode: 413 })
    }

    return presignUpload(`trees/${input.treeId}/stories`, input)
  },

  async confirmUpload(userId: string, input: ConfirmStoryUploadInput) {
    await assertMember(userId, input.treeId)

    // Stories consume the same tree-wide storage quota as event media — reserved
    // atomically for the same reason as memory.service.ts's confirmUpload.
    const withinLimit = await memoryRepository.incrementStorageUsedIfWithinLimit(
      input.treeId,
      BigInt(input.sizeBytes),
    )
    if (!withinLimit) {
      throw new ConflictError('Storage quota exceeded')
    }

    const story = await storyRepository.create({
      treeId: input.treeId,
      createdById: userId,
      r2Key: input.r2Key,
      type: input.type,
      caption: input.caption ?? null,
      expiresAt: new Date(Date.now() + STORY_TTL_MS),
      thumbnailR2Key: input.thumbnailR2Key ?? null,
    })

    const media = await storyRepository.createMedia({
      storyId: story.id,
      uploadedById: userId,
      r2Key: input.r2Key,
      type: input.type,
      sizeBytes: BigInt(input.sizeBytes),
      thumbnailR2Key: input.thumbnailR2Key ?? null,
      status: input.thumbnailR2Key ? 'READY' : 'PENDING',
    })

    // Fire-and-forget: a queue outage must never fail or roll back story creation —
    // same contract as event.service.ts's fan-out. Stories have no notify-group picker
    // in the UI, so 'all' matches the existing "notify everyone" default for events.
    try {
      await notificationFanout.add('fanout', {
        treeId: input.treeId,
        storyId: story.id,
        actorUserId: userId,
        notifyGroup: 'all',
        title: 'New story',
        body: `${story.createdBy.username} shared a new story`,
        type: 'STORY_CREATED',
      })
    } catch (err) {
      console.error('[storyService.confirmUpload] failed to enqueue notification fan-out', {
        storyId: story.id,
        err,
      })
    }

    // Video thumbnails are extracted client-side (see media-upload.ts) — only fall
    // back to the server-side job when the client didn't already supply one.
    if (!input.thumbnailR2Key) {
      await thumbnailQueue.add('generate', {
        mediaId: media.id,
        r2Key: input.r2Key,
        type: input.type,
      })
    }

    const raw = await storyRepository.findById(story.id)
    return transform(raw!)
  },

  async listForTree(userId: string, treeId: string) {
    await assertMember(userId, treeId)
    const rows = await storyRepository.listNonExpired(treeId)
    return rows.map(transform)
  },

  async recordView(userId: string, storyId: string) {
    const story = await storyRepository.findById(storyId)
    if (!story) throw new NotFoundError('Story not found')
    await assertMember(userId, story.treeId)
    await storyRepository.recordView(storyId, userId)
    return { viewed: true }
  },
}
