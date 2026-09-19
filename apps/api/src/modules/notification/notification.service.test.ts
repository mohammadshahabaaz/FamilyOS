import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('expo-server-sdk', () => ({
  Expo: {
    isExpoPushToken: vi.fn((t: string) => t.startsWith('ExponentPushToken')),
  },
}))

vi.mock('../../lib/push.js', () => ({
  expo: {
    chunkPushNotifications: vi.fn((messages: unknown[]) => [messages]),
    sendPushNotificationsAsync: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('./notification.repository.js', () => ({
  notificationRepository: {
    create: vi.fn(),
    listForUser: vi.fn(),
    markAllRead: vi.fn(),
  },
}))

vi.mock('../push-token/push-token.repository.js', () => ({
  pushTokenRepository: {
    listForUser: vi.fn(),
  },
}))

import { expo } from '../../lib/push.js'
import { notificationRepository } from './notification.repository.js'
import { pushTokenRepository } from '../push-token/push-token.repository.js'
import { notificationService } from './notification.service.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('notificationService.create', () => {
  it('normalizes undefined related-ids to null before persisting', async () => {
    vi.mocked(notificationRepository.create).mockResolvedValue({ id: 'notif-1' } as never)

    await notificationService.create({ treeId: 'tree-1', userId: 'user-1', type: 'EVENT_CREATED' })

    expect(vi.mocked(notificationRepository.create)).toHaveBeenCalledWith({
      treeId: 'tree-1',
      userId: 'user-1',
      type: 'EVENT_CREATED',
      relatedEventId: null,
      relatedProfileRequestId: null,
      relatedTreeLinkId: null,
      relatedStoryId: null,
    })
  })

  it('passes through provided related-ids', async () => {
    vi.mocked(notificationRepository.create).mockResolvedValue({ id: 'notif-1' } as never)

    await notificationService.create({
      treeId: 'tree-1',
      userId: 'user-1',
      type: 'STORY_CREATED',
      relatedStoryId: 'story-1',
    })

    expect(vi.mocked(notificationRepository.create)).toHaveBeenCalledWith(
      expect.objectContaining({ relatedStoryId: 'story-1', relatedEventId: null }),
    )
  })
})

describe('notificationService.listForUser', () => {
  it('reports hasMore and nextCursor when more rows exist than the limit', async () => {
    vi.mocked(notificationRepository.listForUser).mockResolvedValue([
      { id: 'n1' },
      { id: 'n2' },
    ] as never)

    const result = await notificationService.listForUser('user-1', undefined, 1)
    expect(result.items).toHaveLength(1)
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBe('n1')
  })

  it('reports no more when rows fit within the limit', async () => {
    vi.mocked(notificationRepository.listForUser).mockResolvedValue([{ id: 'n1' }] as never)

    const result = await notificationService.listForUser('user-1', undefined, 20)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeUndefined()
  })
})

describe('notificationService.markAllRead', () => {
  it('delegates to the repository', async () => {
    await notificationService.markAllRead('user-1')
    expect(vi.mocked(notificationRepository.markAllRead)).toHaveBeenCalledWith('user-1')
  })
})

describe('notificationService.sendPush', () => {
  it('does nothing when the user has no push tokens', async () => {
    vi.mocked(pushTokenRepository.listForUser).mockResolvedValue([])

    await notificationService.sendPush('user-1', 'Title', 'Body')
    expect(vi.mocked(expo.sendPushNotificationsAsync)).not.toHaveBeenCalled()
  })

  it('filters out tokens that are not valid Expo push tokens', async () => {
    vi.mocked(pushTokenRepository.listForUser).mockResolvedValue([
      { token: 'not-a-real-token', platform: 'ios' },
      { token: 'ExponentPushToken[abc]', platform: 'ios' },
    ] as never)

    await notificationService.sendPush('user-1', 'Title', 'Body')

    expect(vi.mocked(expo.chunkPushNotifications)).toHaveBeenCalledWith([
      expect.objectContaining({ to: 'ExponentPushToken[abc]', title: 'Title', body: 'Body' }),
    ])
  })

  it('does not throw when the push provider fails (fire-and-forget contract)', async () => {
    vi.mocked(pushTokenRepository.listForUser).mockResolvedValue([
      { token: 'ExponentPushToken[abc]', platform: 'ios' },
    ] as never)
    vi.mocked(expo.sendPushNotificationsAsync).mockRejectedValue(new Error('provider down'))

    await expect(notificationService.sendPush('user-1', 'Title', 'Body')).resolves.toBeUndefined()
  })
})
