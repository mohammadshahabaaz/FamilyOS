import type { FastifyPluginAsync } from 'fastify'
import { pushTokenService } from './push-token.service.js'
import { registerPushTokenSchema } from '@familyos/shared'

const pushTokenRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] }

  // POST /api/v1/push-tokens
  fastify.post('/', { ...guard }, async (req, reply) => {
    const body = registerPushTokenSchema.parse(req.body)
    const result = await pushTokenService.register(req.user.sub, body)
    return reply.code(201).send(result)
  })
}

export default pushTokenRoutes
