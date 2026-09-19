import type { FastifyPluginAsync } from 'fastify'
import { notificationService } from './notification.service.js'
import { listNotificationsSchema } from '@familyos/shared'

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] }

  // GET /api/v1/notifications
  fastify.get<{ Querystring: Record<string, string> }>('/', { ...guard }, async (req) => {
    const query = listNotificationsSchema.parse(req.query)
    return notificationService.listForUser(req.user.sub, query.cursor, query.limit)
  })

  // PATCH /api/v1/notifications/read
  fastify.patch('/read', { ...guard }, async (req, reply) => {
    await notificationService.markAllRead(req.user.sub)
    return reply.code(204).send()
  })
}

export default notificationRoutes
