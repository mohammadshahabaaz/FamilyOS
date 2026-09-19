import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/r2.js', () => ({
  R2_PUBLIC_URL: 'https://media.test',
}))

vi.mock('../../lib/media-presign.js', () => ({
  presignUpload: vi.fn(),
}))

vi.mock('../../lib/queues.js', () => ({
  thumbnailQueue: { add: vi.fn() },
  notificationFanout: { add: vi.fn() },
}))

vi.mock('./story.repository.js', () => ({
  storyRepository: {
    create: vi.fn(),
    createMedia: vi.fn(),
    listNonExpired: vi.fn(),
    findById: vi.fn(),
    recordView: vi.fn(),
  },
}))

vi.mock('../family/family.repository.js', () => ({
  familyRepository: {
    getMembership: vi.fn(),
  },
}))

vi.mock('../memory/memory.repository.js', () => ({
  memoryRepository: {
    getTreeStorageUsed: vi.fn(),
    incrementStorageUsedIfWithinLimit: vi.fn(),
  },
}))

import { presignUpload } from '../../lib/media-presign.js'
import { thumbnailQueue, notificationFanout } from '../../lib/queues.js'
import { storyRepository } from './story.repository.js'
import { familyRepository } from '../family/family.repository.js'
import { memoryRepository } from '../memory/memory.repository.js'
import { storyService } from './story.service.js'

const MEMBERSHIP = { userId: 'user-1', treeId: 'tree-1', role: 'MEMBER' }

const BASE_STORY = {
  id: 'story-1',
  treeId: 'tree-1',
  r2Key: 'trees/tree-1/stories/a.jpg',
  thumbnailR2Key: null,
  type: 'PHOTO',
  caption: null,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 86400000),
  createdBy: { id: 'user-1', username: 'tariq', profilePicUrl: null },
  media: [],
  _count: { views: 0 },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(familyRepository.getMembership).mockResolvedValue(MEMBERSHIP as never)
})

describe('storyService.requestUploadUrl', () => {
  const input = { treeId: 'tree-1', mimeType: 'image/jpeg', sizeBytes: 1000 }

  it('throws 403 when user is not a member', async () => {
    vi.mocked(familyRepository.getMembership).mockResolvedValue(null)

    await expect(storyService.requestUploadUrl('user-1', input)).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws NotFoundError when the tree does not exist', async () => {
    vi.mocked(memoryRepository.getTreeStorageUsed).mockResolvedValue(null)

    await expect(storyService.requestUploadUrl('user-1', input)).rejects.toThrow('Tree not found')
  })

  it('throws 413 when the upload would exceed the storage quota', async () => {
    vi.mocked(memoryRepository.getTreeStorageUsed).mockResolvedValue({
      storageUsedBytes: 990n,
      storageLimitBytes: 1000n,
    })

    await expect(storyService.requestUploadUrl('user-1', input)).rejects.toMatchObject({
      statusCode: 413,
    })
    expect(vi.mocked(presignUpload)).not.toHaveBeenCalled()
  })

  it('presigns when within quota', async () => {
    vi.mocked(memoryRepository.getTreeStorageUsed).mockResolvedValue({
      storageUsedBytes: 0n,
      storageLimitBytes: 1000n,
    })
    vi.mocked(presignUpload).mockResolvedValue({
      uploadUrl: 'https://upload',
      r2Key: 'k',
      type: 'PHOTO',
      expiresIn: 600,
    } as never)

    const result = await storyService.requestUploadUrl('user-1', input)
    expect(result.uploadUrl).toBe('https://upload')
    expect(vi.mocked(presignUpload)).toHaveBeenCalledWith('trees/tree-1/stories', input)
  })
})

describe('storyService.confirmUpload', () => {
  const input = {
    treeId: 'tree-1',
    r2Key: 'trees/tree-1/stories/a.jpg',
    type: 'PHOTO' as const,
    sizeBytes: 1000,
  }

  it('throws ConflictError when the quota increment fails', async () => {
    vi.mocked(memoryRepository.incrementStorageUsedIfWithinLimit).mockResolvedValue(false)

    await expect(storyService.confirmUpload('user-1', input)).rejects.toMatchObject({
      statusCode: 409,
    })
    expect(vi.mocked(storyRepository.create)).not.toHaveBeenCalled()
  })

  it('creates the story, media, thumbnail job, and a STORY_CREATED fan-out job', async () => {
    vi.mocked(memoryRepository.incrementStorageUsedIfWithinLimit).mockResolvedValue(true)
    vi.mocked(storyRepository.create).mockResolvedValue(BASE_STORY as never)
    vi.mocked(storyRepository.createMedia).mockResolvedValue({ id: 'media-1' } as never)
    vi.mocked(storyRepository.findById).mockResolvedValue(BASE_STORY as never)

    const result = await storyService.confirmUpload('user-1', input)

    expect(result.id).toBe('story-1')
    expect(vi.mocked(thumbnailQueue.add)).toHaveBeenCalledWith(
      'generate',
      expect.objectContaining({ mediaId: 'media-1' }),
    )
    expect(vi.mocked(notificationFanout.add)).toHaveBeenCalledWith(
      'fanout',
      expect.objectContaining({
        treeId: 'tree-1',
        storyId: 'story-1',
        actorUserId: 'user-1',
        notifyGroup: 'all',
        type: 'STORY_CREATED',
      }),
    )
  })

  it('still creates the story even if the fan-out enqueue throws', async () => {
    vi.mocked(memoryRepository.incrementStorageUsedIfWithinLimit).mockResolvedValue(true)
    vi.mocked(storyRepository.create).mockResolvedValue(BASE_STORY as never)
    vi.mocked(storyRepository.createMedia).mockResolvedValue({ id: 'media-1' } as never)
    vi.mocked(storyRepository.findById).mockResolvedValue(BASE_STORY as never)
    vi.mocked(notificationFanout.add).mockRejectedValue(new Error('queue down'))

    await expect(storyService.confirmUpload('user-1', input)).resolves.toMatchObject({
      id: 'story-1',
    })
  })
})

describe('storyService.listForTree', () => {
  it('throws 403 when user is not a member', async () => {
    vi.mocked(familyRepository.getMembership).mockResolvedValue(null)

    await expect(storyService.listForTree('user-1', 'tree-1')).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('returns transformed stories', async () => {
    vi.mocked(storyRepository.listNonExpired).mockResolvedValue([BASE_STORY as never])

    const result = await storyService.listForTree('user-1', 'tree-1')
    expect(result).toHaveLength(1)
    expect(result[0].url).toBe('https://media.test/trees/tree-1/stories/a.jpg')
  })
})

describe('storyService.recordView', () => {
  it('throws NotFoundError when the story does not exist', async () => {
    vi.mocked(storyRepository.findById).mockResolvedValue(null)

    await expect(storyService.recordView('user-1', 'nonexistent')).rejects.toThrow(
      'Story not found',
    )
  })

  it("throws 403 when user is not a member of the story's tree", async () => {
    vi.mocked(storyRepository.findById).mockResolvedValue(BASE_STORY as never)
    vi.mocked(familyRepository.getMembership).mockResolvedValue(null)

    await expect(storyService.recordView('user-1', 'story-1')).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('records the view when the user is a member', async () => {
    vi.mocked(storyRepository.findById).mockResolvedValue(BASE_STORY as never)
    vi.mocked(storyRepository.recordView).mockResolvedValue({} as never)

    const result = await storyService.recordView('user-1', 'story-1')
    expect(result.viewed).toBe(true)
    expect(vi.mocked(storyRepository.recordView)).toHaveBeenCalledWith('story-1', 'user-1')
  })
})
