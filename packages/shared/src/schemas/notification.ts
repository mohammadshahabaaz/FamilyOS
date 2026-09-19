import { z } from 'zod'

export const pushPlatformSchema = z.enum(['ios', 'android', 'web'])

export const registerPushTokenSchema = z.object({
  token: z.string().min(1),
  platform: pushPlatformSchema,
})

export const listNotificationsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PushPlatform = z.infer<typeof pushPlatformSchema>
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>
export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>
