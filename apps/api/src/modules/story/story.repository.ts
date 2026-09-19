import { db } from '../../lib/db.js'

const STORY_SELECT = {
  id: true,
  treeId: true,
  r2Key: true,
  thumbnailR2Key: true,
  type: true,
  caption: true,
  createdAt: true,
  expiresAt: true,
  visibility: true,
  branchLabel: true,
  createdBy: { select: { id: true, username: true, profilePicUrl: true } },
  media: { select: { id: true, r2Key: true, thumbnailR2Key: true, type: true } },
  _count: { select: { views: true } },
}

export const storyRepository = {
  create(data: {
    treeId: string
    createdById: string
    r2Key: string
    type: 'PHOTO' | 'VIDEO'
    caption?: string | null
    expiresAt: Date
    thumbnailR2Key?: string | null
  }) {
    return db.story.create({
      data: {
        treeId: data.treeId,
        createdById: data.createdById,
        r2Key: data.r2Key,
        type: data.type,
        caption: data.caption ?? null,
        expiresAt: data.expiresAt,
        thumbnailR2Key: data.thumbnailR2Key ?? null,
      },
      select: STORY_SELECT,
    })
  },

  createMedia(data: {
    storyId: string
    uploadedById: string
    r2Key: string
    type: 'PHOTO' | 'VIDEO'
    sizeBytes: bigint
    thumbnailR2Key?: string | null
    status?: 'PENDING' | 'READY'
  }) {
    return db.media.create({ data })
  },

  listNonExpired(treeId: string) {
    return db.story.findMany({
      where: { treeId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: STORY_SELECT,
    })
  },

  findById(storyId: string) {
    return db.story.findUnique({ where: { id: storyId }, select: STORY_SELECT })
  },

  storyBelongsToTree(storyId: string, treeId: string) {
    return db.story.findFirst({
      where: { id: storyId, treeId },
      select: { id: true, expiresAt: true },
    })
  },

  recordView(storyId: string, userId: string) {
    return db.storyView.upsert({
      where: { storyId_userId: { storyId, userId } },
      create: { storyId, userId },
      update: { viewedAt: new Date() },
    })
  },
}
