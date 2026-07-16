import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import errorHandlerPlugin from './plugins/errorHandler.js'
import authGuardPlugin from './plugins/authGuard.js'

// Phase 0 read-only demo routes (no auth, used by existing mobile UI)
import treeRoutes from './modules/tree/tree.routes.js'

// Phase 1+ authenticated routes
import authRoutes   from './modules/auth/auth.routes.js'
import familyRoutes from './modules/family/family.routes.js'
import personRoutes from './modules/person/person.routes.js'
import eventRoutes  from './modules/event/event.routes.js'
import memoryRoutes from './modules/memory/memory.routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      ...(process.env.NODE_ENV === 'development' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    },
  })

  await app.register(cors, { origin: true })
  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(jwt, { secret: process.env.JWT_SECRET! })
  await app.register(errorHandlerPlugin)
  await app.register(authGuardPlugin)

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }))

  // ── Phase 0 — read-only demo (no auth) ──────────────────────────────────
  // GET /api/trees, /api/trees/:id, /:id/persons, /:id/events, /:id/relatives
  await app.register(treeRoutes, { prefix: '/api/trees' })

  // ── Phase 1+ — authenticated CRUD ───────────────────────────────────────
  // All new routes live under /api/v1 to avoid conflict with Phase 0 paths

  await app.register(authRoutes,   { prefix: '/api/v1/auth' })
  await app.register(familyRoutes, { prefix: '/api/v1/families' })

  // Persons + edges: /api/v1/trees/:treeId/persons[/edges]
  await app.register(async (sub) => {
    await sub.register(personRoutes, { prefix: '/:treeId/persons' })
  }, { prefix: '/api/v1/trees' })

  // Events: /api/v1/trees/:treeId/events
  await app.register(async (sub) => {
    await sub.register(eventRoutes, { prefix: '/:treeId/events' })
  }, { prefix: '/api/v1/trees' })

  // Media + comments: /api/v1/trees/:treeId/events/:eventId/...
  await app.register(async (sub) => {
    await sub.register(memoryRoutes, { prefix: '/:treeId/events/:eventId' })
  }, { prefix: '/api/v1/trees' })

  return app
}
