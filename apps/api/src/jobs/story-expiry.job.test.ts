import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/db.js', () => ({
  db: {
    story: { findMany: vi.fn(), delete: vi.fn() },
  },
}))

vi.mock('../lib/media-presign.js', () => ({
  deleteMediaObject: vi.fn(),
}))

vi.mock('../modules/memory/memory.repository.js', () => ({
  memoryRepository: {
    decrementStorageUsed: vi.fn(),
  },
}))

import { db } from '../lib/db.js'
import { deleteMediaObject } from '../lib/media-presign.js'
import { memoryRepository } from '../modules/memory/memory.repository.js'
import { processStoryExpiry } from './story-expiry.job.js'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(deleteMediaObject).mockResolvedValue(undefined)
})

describe('processStoryExpiry', () => {
  it('does nothing when no stories have expired', async () => {
    vi.mocked(db.story.findMany).mockResolvedValue([])

    const result = await processStoryExpiry({} as never)

    expect(result).toEqual({ expiredCount: 0 })
    expect(vi.mocked(db.story.delete)).not.toHaveBeenCalled()
    expect(vi.mocked(memoryRepository.decrementStorageUsed)).not.toHaveBeenCalled()
  })

  it("deletes the story's own R2 object, thumbnail, and every media item's objects", async () => {
    vi.mocked(db.story.findMany).mockResolvedValue([
      {
        id: 'story-1',
        treeId: 'tree-1',
        r2Key: 'story.jpg',
        thumbnailR2Key: 'story-thumb.jpg',
        media: [{ r2Key: 'media1.jpg', thumbnailR2Key: 'media1-thumb.jpg', sizeBytes: 100n }],
      },
    ] as never)

    await processStoryExpiry({} as never)

    expect(vi.mocked(deleteMediaObject)).toHaveBeenCalledWith('story.jpg')
    expect(vi.mocked(deleteMediaObject)).toHaveBeenCalledWith('story-thumb.jpg')
    expect(vi.mocked(deleteMediaObject)).toHaveBeenCalledWith('media1.jpg')
    expect(vi.mocked(deleteMediaObject)).toHaveBeenCalledWith('media1-thumb.jpg')
  })

  it('reclaims the tree storage quota by the sum of the media sizes', async () => {
    vi.mocked(db.story.findMany).mockResolvedValue([
      {
        id: 'story-1',
        treeId: 'tree-1',
        r2Key: 'story.jpg',
        thumbnailR2Key: null,
        media: [
          { r2Key: 'a.jpg', thumbnailR2Key: null, sizeBytes: 100n },
          { r2Key: 'b.jpg', thumbnailR2Key: null, sizeBytes: 250n },
        ],
      },
    ] as never)

    await processStoryExpiry({} as never)

    expect(vi.mocked(memoryRepository.decrementStorageUsed)).toHaveBeenCalledWith('tree-1', 350n)
  })

  it('skips the quota decrement when the story has no media (nothing to reclaim)', async () => {
    vi.mocked(db.story.findMany).mockResolvedValue([
      { id: 'story-1', treeId: 'tree-1', r2Key: 'story.jpg', thumbnailR2Key: null, media: [] },
    ] as never)

    await processStoryExpiry({} as never)

    expect(vi.mocked(memoryRepository.decrementStorageUsed)).not.toHaveBeenCalled()
  })

  it('still deletes the DB row when the R2 delete fails (logged, not fatal)', async () => {
    vi.mocked(db.story.findMany).mockResolvedValue([
      { id: 'story-1', treeId: 'tree-1', r2Key: 'story.jpg', thumbnailR2Key: null, media: [] },
    ] as never)
    vi.mocked(deleteMediaObject).mockRejectedValue(new Error('R2 unreachable'))

    await processStoryExpiry({} as never)

    expect(vi.mocked(db.story.delete)).toHaveBeenCalledWith({ where: { id: 'story-1' } })
  })

  it('processes multiple expired stories and reports the correct count', async () => {
    vi.mocked(db.story.findMany).mockResolvedValue([
      { id: 'story-1', treeId: 'tree-1', r2Key: 'a.jpg', thumbnailR2Key: null, media: [] },
      { id: 'story-2', treeId: 'tree-1', r2Key: 'b.jpg', thumbnailR2Key: null, media: [] },
    ] as never)

    const result = await processStoryExpiry({} as never)

    expect(result).toEqual({ expiredCount: 2 })
    expect(vi.mocked(db.story.delete)).toHaveBeenCalledTimes(2)
  })
})
