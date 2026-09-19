import { Expo } from 'expo-server-sdk'
import { notificationRepository } from './notification.repository.js'
import { pushTokenRepository } from '../push-token/push-token.repository.js'
import { expo } from '../../lib/push.js'
import type { NotificationType, Notification } from '@prisma/client'

export interface CreateNotificationInput {
  treeId: string
  userId: string
  type: NotificationType
  relatedEventId?: string
  relatedProfileRequestId?: string
  relatedTreeLinkId?: string
  relatedStoryId?: string
}

export interface PaginatedResult<T> {
  items: T[]
  nextCursor?: string
  hasMore: boolean
}

export const notificationService = {
  async create(payload: CreateNotificationInput): Promise<Notification> {
    return notificationRepository.create({
      treeId: payload.treeId,
      userId: payload.userId,
      type: payload.type,
      relatedEventId: payload.relatedEventId ?? null,
      relatedProfileRequestId: payload.relatedProfileRequestId ?? null,
      relatedTreeLinkId: payload.relatedTreeLinkId ?? null,
      relatedStoryId: payload.relatedStoryId ?? null,
    })
  },

  async listForUser(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResult<Notification>> {
    const rows = await notificationRepository.listForUser(userId, { cursor, limit })
    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    return { items, nextCursor: hasMore ? items[items.length - 1].id : undefined, hasMore }
  },

  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId)
  },

  // Fire-and-forget by contract: callers never await failure handling here —
  // a push provider outage must never fail the request that triggered the notification.
  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const tokens = await pushTokenRepository.listForUser(userId)
      const messages = tokens
        .filter((t) => Expo.isExpoPushToken(t.token))
        .map((t) => ({ to: t.token, sound: 'default' as const, title, body, data }))

      if (messages.length === 0) return

      for (const chunk of expo.chunkPushNotifications(messages)) {
        await expo.sendPushNotificationsAsync(chunk)
      }
    } catch (err) {
      console.error('[notificationService.sendPush] failed', { userId, err })
    }
  },
}
