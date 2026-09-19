import type { Job } from 'bullmq'
import { db } from '../lib/db.js'
import { deleteMediaObject } from '../lib/media-presign.js'
import { memoryRepository } from '../modules/memory/memory.repository.js'

export async function processStoryExpiry(_job: Job) {
  const expired = await db.story.findMany({
    where: { expiresAt: { lt: new Date() } },
    select: {
      id: true,
      treeId: true,
      r2Key: true,
      thumbnailR2Key: true,
      media: { select: { r2Key: true, thumbnailR2Key: true, sizeBytes: true } },
    },
  })

  for (const story of expired) {
    // R2 delete first, logged but not fatal — an orphaned object is recoverable,
    // an un-cleaned-up DB row that keeps re-matching this query is not.
    try {
      await deleteMediaObject(story.r2Key)
      if (story.thumbnailR2Key) await deleteMediaObject(story.thumbnailR2Key)
      for (const media of story.media) {
        await deleteMediaObject(media.r2Key)
        if (media.thumbnailR2Key) await deleteMediaObject(media.thumbnailR2Key)
      }
    } catch (err) {
      console.error('[story-expiry] R2 delete failed', { storyId: story.id, err })
    }

    // Release the tree-wide storage quota this story reserved on upload — otherwise
    // every expired story permanently leaks quota, since it's gone but never billed back.
    const reclaimedBytes = story.media.reduce((sum, m) => sum + m.sizeBytes, 0n)
    if (reclaimedBytes > 0n) {
      await memoryRepository.decrementStorageUsed(story.treeId, reclaimedBytes)
    }

    // Story.media (onDelete: Cascade) and StoryView (onDelete: Cascade) both cascade
    // from this single delete — Postgres enforces that atomically at the FK level.
    await db.story.delete({ where: { id: story.id } })
  }

  return { expiredCount: expired.length }
}
