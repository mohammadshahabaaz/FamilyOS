import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../family/family.repository.js', () => ({
  familyRepository: {
    getMembership: vi.fn(),
  },
}))

vi.mock('./event.repository.js', () => ({
  eventRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    listByTree: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateTaggedPersons: vi.fn(),
    eventBelongsToTree: vi.fn(),
    getLike: vi.fn(),
    addLike: vi.fn(),
    removeLike: vi.fn(),
    countLikes: vi.fn().mockResolvedValue(0),
    countLikesForEvents: vi.fn().mockResolvedValue(new Map()),
    getUserLikedSet: vi.fn().mockResolvedValue(new Set()),
  },
}))

vi.mock('../../lib/queues.js', () => ({
  notificationFanout: { add: vi.fn() },
}))

import { familyRepository } from '../family/family.repository.js'
import { eventRepository } from './event.repository.js'
import { notificationFanout } from '../../lib/queues.js'
import { eventService } from './event.service.js'

const MEMBERSHIP = { userId: 'user-1', treeId: 'tree-1', role: 'MEMBER' }

const BASE_EVENT = {
  id: 'event-1',
  type: 'BIRTHDAY',
  title: 'Tariq Birthday',
  description: null,
  date: new Date('2024-01-01'),
  visibility: 'FAMILY',
  branchLabel: null,
  createdAt: new Date(),
  createdById: 'user-1',
  createdBy: { id: 'user-1', username: 'tariq', profilePicUrl: null },
  taggedPersons: [],
  media: [],
  _count: { comments: 0, likes: 0 },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(familyRepository.getMembership).mockResolvedValue(MEMBERSHIP as never)
  vi.mocked(eventRepository.eventBelongsToTree).mockResolvedValue({
    id: 'event-1',
    createdById: 'user-1',
  })
})

describe('eventService.createEvent', () => {
  it('creates and returns event', async () => {
    vi.mocked(eventRepository.create).mockResolvedValue(BASE_EVENT as never)

    const result = await eventService.createEvent('user-1', 'tree-1', {
      type: 'BIRTHDAY',
      title: 'Tariq Birthday',
      date: new Date('2024-01-01').toISOString(),
      visibility: 'FAMILY',
      taggedPersonIds: [],
      notifyGroup: 'all',
    })

    expect(result.title).toBe('Tariq Birthday')
    expect(vi.mocked(eventRepository.create)).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'BIRTHDAY', title: 'Tariq Birthday', treeId: 'tree-1' }),
    )
    expect(vi.mocked(notificationFanout.add)).toHaveBeenCalledWith(
      'fanout',
      expect.objectContaining({ treeId: 'tree-1', eventId: 'event-1', notifyGroup: 'all' }),
    )
  })

  it('throws 403 when user is not a member', async () => {
    vi.mocked(familyRepository.getMembership).mockResolvedValue(null)

    await expect(
      eventService.createEvent('stranger', 'tree-1', {
        type: 'BIRTHDAY',
        title: 'Test',
        date: new Date().toISOString(),
        visibility: 'FAMILY',
        taggedPersonIds: [],
        notifyGroup: 'all',
      }),
    ).rejects.toMatchObject({ statusCode: 403 })
  })
})

describe('eventService.listEvents', () => {
  it('returns paginated events', async () => {
    vi.mocked(eventRepository.listByTree).mockResolvedValue([
      BASE_EVENT as never,
      BASE_EVENT as never,
    ])

    const result = await eventService.listEvents('user-1', 'tree-1', { limit: 1 })
    expect(result.items).toHaveLength(1)
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBe('event-1')
  })

  it('returns empty list when no events exist', async () => {
    vi.mocked(eventRepository.listByTree).mockResolvedValue([])

    const result = await eventService.listEvents('user-1', 'tree-1', { limit: 20 })
    expect(result.items).toHaveLength(0)
    expect(result.hasMore).toBe(false)
  })
})

describe('eventService.updateEvent', () => {
  it('updates event when user is creator', async () => {
    const updated = { ...BASE_EVENT, title: 'Updated Title' }
    vi.mocked(eventRepository.update).mockResolvedValue(updated as never)
    vi.mocked(eventRepository.findById).mockResolvedValue(updated as never)

    const result = await eventService.updateEvent('user-1', 'tree-1', 'event-1', {
      title: 'Updated Title',
    })
    expect(result?.title).toBe('Updated Title')
  })

  it('throws 403 when user is not the event creator', async () => {
    vi.mocked(eventRepository.eventBelongsToTree).mockResolvedValue({
      id: 'event-1',
      createdById: 'other-user',
    })

    await expect(
      eventService.updateEvent('user-1', 'tree-1', 'event-1', { title: 'X' }),
    ).rejects.toMatchObject({ statusCode: 403 })
  })
})

describe('eventService.deleteEvent', () => {
  it('deletes event when user is creator', async () => {
    vi.mocked(eventRepository.delete).mockResolvedValue(BASE_EVENT as never)

    await expect(eventService.deleteEvent('user-1', 'tree-1', 'event-1')).resolves.not.toThrow()
    expect(vi.mocked(eventRepository.delete)).toHaveBeenCalledWith('event-1')
  })

  it('throws 403 when user is not the event creator', async () => {
    vi.mocked(eventRepository.eventBelongsToTree).mockResolvedValue({
      id: 'event-1',
      createdById: 'other-user',
    })

    await expect(eventService.deleteEvent('user-1', 'tree-1', 'event-1')).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws 404 when event does not exist in this tree', async () => {
    vi.mocked(eventRepository.eventBelongsToTree).mockResolvedValue(null)

    await expect(eventService.deleteEvent('user-1', 'tree-1', 'nonexistent')).rejects.toMatchObject(
      { statusCode: 404 },
    )
  })
})

describe('eventService.toggleLike', () => {
  it('adds like when not already liked', async () => {
    vi.mocked(eventRepository.getLike).mockResolvedValue(null)
    vi.mocked(eventRepository.addLike).mockResolvedValue({} as never)

    const result = await eventService.toggleLike('user-1', 'tree-1', 'event-1')
    expect(result.liked).toBe(true)
  })

  it('removes like when already liked', async () => {
    vi.mocked(eventRepository.getLike).mockResolvedValue({ id: 'like-1' } as never)
    vi.mocked(eventRepository.removeLike).mockResolvedValue({ count: 1 })

    const result = await eventService.toggleLike('user-1', 'tree-1', 'event-1')
    expect(result.liked).toBe(false)
  })
})
