import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../lib/db.js', () => ({
  db: {
    $queryRaw: vi.fn(),
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
import { processMemoryRecall } from './memory-recall.job.js'

beforeEach(() => {
  vi.clearAllMocks()
  // Pin "today" so getUTCMonth/getUTCDate/getUTCFullYear are deterministic —
  // matches Event.date's storage contract (`${date}T00:00:00.000Z`, UTC instant).
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-17T12:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('processMemoryRecall', () => {
  it("returns zero matched/sent when no events match today's month/day", async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([])

    const result = await processMemoryRecall({} as never)

    expect(result).toEqual({ eventsMatched: 0, notificationsSent: 0 })
    expect(vi.mocked(notificationService.create)).not.toHaveBeenCalled()
  })

  it('computes yearsAgo correctly and notifies every tree member', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([
      { id: 'event-1', treeId: 'tree-1', title: 'Wedding Day', date: new Date('2020-07-17') },
    ])
    vi.mocked(db.familyMember.findMany).mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ] as never)

    const result = await processMemoryRecall({} as never)

    expect(result).toEqual({ eventsMatched: 1, notificationsSent: 2 })
    expect(vi.mocked(notificationService.create)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(notificationService.create)).toHaveBeenCalledWith({
      treeId: 'tree-1',
      userId: 'user-1',
      type: 'MEMORY_RECALL',
      relatedEventId: 'event-1',
    })
    expect(vi.mocked(notificationService.sendPush)).toHaveBeenCalledWith(
      'user-1',
      'On this day',
      'Wedding Day — 6 years ago today',
      { eventId: 'event-1', treeId: 'tree-1' },
    )
  })

  it('uses singular "year" when the event was exactly one year ago', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([
      { id: 'event-1', treeId: 'tree-1', title: 'First Steps', date: new Date('2025-07-17') },
    ])
    vi.mocked(db.familyMember.findMany).mockResolvedValue([{ userId: 'user-1' }] as never)

    await processMemoryRecall({} as never)

    expect(vi.mocked(notificationService.sendPush)).toHaveBeenCalledWith(
      'user-1',
      'On this day',
      'First Steps — 1 year ago today',
      expect.anything(),
    )
  })

  it('sums notificationsSent across multiple matching events', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([
      { id: 'event-1', treeId: 'tree-1', title: 'A', date: new Date('2020-07-17') },
      { id: 'event-2', treeId: 'tree-2', title: 'B', date: new Date('2018-07-17') },
    ])
    vi.mocked(db.familyMember.findMany).mockResolvedValue([{ userId: 'user-1' }] as never)

    const result = await processMemoryRecall({} as never)
    expect(result).toEqual({ eventsMatched: 2, notificationsSent: 2 })
  })
})
