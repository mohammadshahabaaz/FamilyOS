import { db } from '../../lib/db.js'
import type { NotificationType } from '@prisma/client'

export const notificationRepository = {
  create(data: {
    treeId: string
    userId: string
    type: NotificationType
    relatedEventId?: string | null
    relatedProfileRequestId?: string | null
    relatedTreeLinkId?: string | null
    relatedStoryId?: string | null
  }) {
    return db.notification.create({ data })
  },

  listForUser(userId: string, opts: { cursor?: string; limit: number }) {
    return db.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: opts.limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    })
  },

  markAllRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, openedAt: null },
      data: { openedAt: new Date() },
    })
  },
}
