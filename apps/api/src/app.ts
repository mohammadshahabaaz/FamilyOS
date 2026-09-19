import { randomUUID } from 'crypto'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import { env } from './lib/env.js'
import errorHandlerPlugin from './plugins/errorHandler.js'
import authGuardPlugin from './plugins/authGuard.js'

// Phase 0 read-only demo routes (no auth, used by existing mobile UI)
import treeRoutes from './modules/tree/tree.routes.js'

// Phase 1+ authenticated routes
import authRoutes from './modules/auth/auth.routes.js'
import familyRoutes from './modules/family/family.routes.js'
import personRoutes from './modules/person/person.routes.js'
import eventRoutes from './modules/event/event.routes.js'
import memoryRoutes from './modules/memory/memory.routes.js'
import pushTokenRoutes from './modules/push-token/push-token.routes.js'
import notificationRoutes from './modules/notification/notification.routes.js'
import storyRoutes from './modules/story/story.routes.js'
import storyTreeRoutes from './modules/story/story.tree-routes.js'
import treeLinkRoutes from './modules/tree-link/tree-link.routes.js'
import profileRequestRoutes from './modules/profile-request/profile-request.routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
      serializers: {
        req: (req) => ({ method: req.method, url: req.url, userId: req.user?.sub }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    },
    // A per-request traceId, attached to every log line for that request (including
    // the ones the error handler emits) — the minimum viable observability for
    // on-call to correlate a report against logs without OTel.
    genReqId: () => randomUUID(),
    // Deprecated in favor of `logController` but still fully supported in Fastify 5;
    // revisit if/when upgrading to Fastify 6.
    requestIdLogLabel: 'traceId',
  })

  await app.register(cors, { origin: true })
  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(jwt, { secret: env.JWT_SECRET })
  await app.register(errorHandlerPlugin)
  await app.register(authGuardPlugin)

  app.get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }))

  // ── Phase 0 — read-only demo (no auth) ──────────────────────────────────
  // GET /api/trees, /api/trees/:id, /:id/persons, /:id/events, /:id/relatives
  await app.register(treeRoutes, { prefix: '/api/trees' })

  // ── Phase 1+ — authenticated CRUD ───────────────────────────────────────
  // All new routes live under /api/v1 to avoid conflict with Phase 0 paths

  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(familyRoutes, { prefix: '/api/v1/families' })
  await app.register(pushTokenRoutes, { prefix: '/api/v1/push-tokens' })
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' })
  await app.register(storyRoutes, { prefix: '/api/v1/stories' })
  await app.register(treeLinkRoutes, { prefix: '/api/v1/tree-links' })

  // Persons + edges: /api/v1/trees/:treeId/persons[/edges]
  await app.register(
    async (sub) => {
      await sub.register(personRoutes, { prefix: '/:treeId/persons' })
    },
    { prefix: '/api/v1/trees' },
  )

  // Events: /api/v1/trees/:treeId/events
  await app.register(
    async (sub) => {
      await sub.register(eventRoutes, { prefix: '/:treeId/events' })
    },
    { prefix: '/api/v1/trees' },
  )

  // Media + comments: /api/v1/trees/:treeId/events/:eventId/...
  await app.register(
    async (sub) => {
      await sub.register(memoryRoutes, { prefix: '/:treeId/events/:eventId' })
    },
    { prefix: '/api/v1/trees' },
  )

  // Stories: /api/v1/trees/:treeId/stories
  await app.register(
    async (sub) => {
      await sub.register(storyTreeRoutes, { prefix: '/:treeId/stories' })
    },
    { prefix: '/api/v1/trees' },
  )

  // Profile requests: /api/v1/trees/:treeId/profile-requests
  await app.register(
    async (sub) => {
      await sub.register(profileRequestRoutes, { prefix: '/:treeId/profile-requests' })
    },
    { prefix: '/api/v1/trees' },
  )

  return app
}
