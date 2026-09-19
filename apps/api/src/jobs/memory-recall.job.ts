import type { Job } from 'bullmq'
import { db } from '../lib/db.js'
import { notificationService } from '../modules/notification/notification.service.js'

interface MatchingEvent {
  id: string
  treeId: string
  title: string
  date: Date
}

export async function processMemoryRecall(_job: Job) {
  // Event.date is always stored as a UTC instant (the mobile client sends
  // `${date}T00:00:00.000Z`), and Postgres EXTRACT() below reads that raw stored
  // value with no timezone conversion — so "today" must be computed in UTC too,
  // or the comparison drifts by a day for part of every day on a non-UTC server.
  const now = new Date()
  const month = now.getUTCMonth() + 1
  const day = now.getUTCDate()
  const year = now.getUTCFullYear()

  const events = await db.$queryRaw<MatchingEvent[]>`
    SELECT id, "treeId", title, date
    FROM "Event"
    WHERE EXTRACT(MONTH FROM date) = ${month}
      AND EXTRACT(DAY FROM date) = ${day}
      AND EXTRACT(YEAR FROM date) < ${year}
  `

  let notificationsSent = 0
  for (const event of events) {
    const members = await db.familyMember.findMany({
      where: { treeId: event.treeId },
      select: { userId: true },
    })
    const yearsAgo = year - event.date.getUTCFullYear()
    const body = `${event.title} — ${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago today`

    for (const member of members) {
      await notificationService.create({
        treeId: event.treeId,
        userId: member.userId,
        type: 'MEMORY_RECALL',
        relatedEventId: event.id,
      })
      await notificationService.sendPush(member.userId, 'On this day', body, {
        eventId: event.id,
        treeId: event.treeId,
      })
      notificationsSent++
    }
  }

  return { eventsMatched: events.length, notificationsSent }
}
