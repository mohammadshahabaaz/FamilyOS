import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '@familyos/shared'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; uniqueUserId: string }
    user: { sub: string; uniqueUserId: string }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const authGuardPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      throw new UnauthorizedError('Invalid or expired token')
    }
  })
}

export default fp(authGuardPlugin)
