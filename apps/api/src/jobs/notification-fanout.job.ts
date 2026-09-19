// Worker consumes notificationFanout — resolves an event's notifyGroup to recipient
// userIds, then creates a Notification row + fires a push for each one.
import type { Job } from 'bullmq'
import { db } from '../lib/db.js'
import { notificationService } from '../modules/notification/notification.service.js'

export interface NotificationFanoutJobData {
  treeId: string
  actorUserId: string
  notifyGroup: 'close' | 'paternal' | 'maternal' | 'internal' | 'extended' | 'all'
  title: string
  body: string
  type: 'EVENT_CREATED' | 'STORY_CREATED'
  eventId?: string
  storyId?: string
}

// paternal/maternal require the engine's paternal/maternal label prefixes (P2-D) to filter
// by branch — until a per-member branch side is materialised, they fall back to a no-op.
async function resolveRecipients(
  treeId: string,
  actorUserId: string,
  notifyGroup: NotificationFanoutJobData['notifyGroup'],
) {
  if (notifyGroup === 'paternal' || notifyGroup === 'maternal') return []

  const members = await db.familyMember.findMany({
    where: { treeId, userId: { not: actorUserId } },
    select: { userId: true },
  })
  return members.map((m) => m.userId)
}

export async function processNotificationFanout(job: Job<NotificationFanoutJobData>) {
  const { treeId, eventId, storyId, actorUserId, notifyGroup, title, body, type } = job.data
  const recipients = await resolveRecipients(treeId, actorUserId, notifyGroup)

  for (const userId of recipients) {
    await notificationService.create({
      treeId,
      userId,
      type,
      relatedEventId: eventId,
      relatedStoryId: storyId,
    })
    await notificationService.sendPush(userId, title, body, { eventId, storyId, treeId })
  }

  return { recipientCount: recipients.length }
}
