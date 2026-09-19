import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/db.js', () => ({
  db: {
    familyMember: { findMany: vi.fn() },
  },
}))

vi.mock('../modules/notification/notification.service.js', () => ({
  notificationService: {
    create: vi.fn(),
    sendPush: vi.fn(),
  },
}))

import { db } from '../lib/db.js'
import { notificationService } from '../modules/notification/notification.service.js'
import { processNotificationFanout } from './notification-fanout.job.js'
import type { NotificationFanoutJobData } from './notification-fanout.job.js'

// The mock replaces the DB call entirely, so it must return what Postgres would give
// back AFTER applying the `userId: { not: actorUserId }` filter — resolveRecipients
// does no client-side filtering of its own, it trusts the WHERE clause.
const OTHER_MEMBERS = [{ userId: 'user-2' }, { userId: 'user-3' }]

function job(data: Partial<NotificationFanoutJobData> = {}) {
  return {
    data: {
      treeId: 'tree-1',
      actorUserId: 'actor',
      notifyGroup: 'all',
      title: 'Title',
      body: 'Body',
      type: 'EVENT_CREATED',
      ...data,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.familyMember.findMany).mockResolvedValue(OTHER_MEMBERS as never)
})

describe('processNotificationFanout', () => {
  it('excludes the actor from recipients', async () => {
    const result = await processNotificationFanout(job({ eventId: 'event-1' }) as never)

    expect(result.recipientCount).toBe(2)
    expect(vi.mocked(db.familyMember.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { treeId: 'tree-1', userId: { not: 'actor' } } }),
    )
  })

  it('notifies every other member with the correct type and relatedEventId', async () => {
    await processNotificationFanout(job({ eventId: 'event-1', type: 'EVENT_CREATED' }) as never)

    expect(vi.mocked(notificationService.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-2',
        type: 'EVENT_CREATED',
        relatedEventId: 'event-1',
        relatedStoryId: undefined,
      }),
    )
    expect(vi.mocked(notificationService.create)).toHaveBeenCalledTimes(2)
  })

  it('uses relatedStoryId (not relatedEventId) for STORY_CREATED', async () => {
    await processNotificationFanout(job({ storyId: 'story-1', type: 'STORY_CREATED' }) as never)

    expect(vi.mocked(notificationService.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'STORY_CREATED',
        relatedStoryId: 'story-1',
        relatedEventId: undefined,
      }),
    )
  })

  it('sends a push to every recipient with the event/story ids in data', async () => {
    await processNotificationFanout(job({ eventId: 'event-1' }) as never)

    expect(vi.mocked(notificationService.sendPush)).toHaveBeenCalledWith(
      'user-2',
      'Title',
      'Body',
      { eventId: 'event-1', storyId: undefined, treeId: 'tree-1' },
    )
  })

  it('returns zero recipients for paternal/maternal notify groups (not yet implemented)', async () => {
    const paternal = await processNotificationFanout(job({ notifyGroup: 'paternal' }) as never)
    const maternal = await processNotificationFanout(job({ notifyGroup: 'maternal' }) as never)

    expect(paternal.recipientCount).toBe(0)
    expect(maternal.recipientCount).toBe(0)
    expect(vi.mocked(db.familyMember.findMany)).not.toHaveBeenCalled()
  })

  it('returns zero recipients when the tree has no other members', async () => {
    vi.mocked(db.familyMember.findMany).mockResolvedValue([] as never)

    const result = await processNotificationFanout(job() as never)
    expect(result.recipientCount).toBe(0)
    expect(vi.mocked(notificationService.create)).not.toHaveBeenCalled()
  })
})
