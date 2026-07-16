import type { FastifyPluginAsync } from 'fastify'
import { buildAuthService } from './auth.service.js'
import { signupSchema, loginSchema, refreshTokenSchema } from '@familyos/shared'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = buildAuthService(fastify)

  // POST /auth/signup
  fastify.post('/signup', async (req, reply) => {
    const body = signupSchema.parse(req.body)
    const result = await authService.signup(body)
    return reply.code(201).send(result)
  })

  // POST /auth/login
  fastify.post('/login', async (req, reply) => {
    const body = loginSchema.parse(req.body)
    const result = await authService.login(body)
    return reply.send(result)
  })

  // POST /auth/refresh
  fastify.post('/refresh', async (req, reply) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body)
    const tokens = await authService.refresh(refreshToken)
    return reply.send(tokens)
  })

  // POST /auth/logout
  fastify.post('/logout', async (req, reply) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body)
    await authService.logout(refreshToken)
    return reply.code(204).send()
  })

  // GET /auth/me  (protected)
  fastify.get('/me', { preHandler: fastify.authenticate }, async (req, reply) => {
    const user = await authService.getMe(req.user.sub)
    return reply.send(user)
  })
}

export default authRoutes
