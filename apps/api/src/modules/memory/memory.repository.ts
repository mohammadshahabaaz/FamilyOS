import { db } from '../../lib/db.js'
import { R2_PUBLIC_URL } from '../../lib/r2.js'

function r2Url(key: string) { return `${R2_PUBLIC_URL}/${key}` }

export const memoryRepository = {
  // Media
  createMedia(data: {
    eventId:      string
    uploadedById: string
    r2Key:        string
    type:         'PHOTO' | 'VIDEO'
    caption?:     string | null
    sizeBytes:    bigint
  }) {
    return db.media.create({ data })
  },

  getMedia(mediaId: string) {
    return db.media.findUnique({ where: { id: mediaId } })
  },

  deleteMedia(mediaId: string) {
    return db.media.delete({ where: { id: mediaId } })
  },

  updateMediaThumbnail(mediaId: string, thumbnailR2Key: string) {
    return db.media.update({ where: { id: mediaId }, data: { thumbnailR2Key } })
  },

  getTreeStorageUsed(treeId: string) {
    return db.familyTree.findUnique({
      where: { id: treeId },
      select: { storageUsedBytes: true, storageLimitBytes: true },
    })
  },

  incrementStorageUsed(treeId: string, bytesDelta: bigint) {
    return db.familyTree.update({
      where: { id: treeId },
      data: { storageUsedBytes: { increment: bytesDelta } },
      select: { storageUsedBytes: true, storageLimitBytes: true },
    })
  },

  decrementStorageUsed(treeId: string, bytesDelta: bigint) {
    return db.familyTree.update({
      where: { id: treeId },
      data: { storageUsedBytes: { decrement: bytesDelta } },
      select: { storageUsedBytes: true },
    })
  },

  // Comments — Comment.userId not authorId
  createComment(data: { eventId: string; userId: string; text: string }) {
    return db.comment.create({
      data,
      select: {
        id: true, text: true, createdAt: true,
        user: { select: { id: true, username: true, profilePicUrl: true } },
      },
    })
  },

  listComments(eventId: string, opts: { cursor?: string; limit: number }) {
    return db.comment.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      take: opts.limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      select: {
        id: true, text: true, createdAt: true, eventId: true,
        user: { select: { id: true, username: true, profilePicUrl: true } },
      },
    })
  },

  getComment(commentId: string) {
    return db.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true, text: true, createdAt: true, eventId: true, userId: true,
        user: { select: { id: true, username: true, profilePicUrl: true } },
      },
    })
  },

  deleteComment(commentId: string) {
    return db.comment.delete({ where: { id: commentId } })
  },
}
