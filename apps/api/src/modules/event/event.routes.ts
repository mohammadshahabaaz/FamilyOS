import type { FastifyPluginAsync } from 'fastify'
import { eventService } from './event.service.js'
import { createEventSchema, listEventsSchema, updateEventSchema } from '@familyos/shared'

const eventRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] }

  // All routes scoped under /trees/:treeId/events

  // GET /trees/:treeId/events
  fastify.get<{ Params: { treeId: string }; Querystring: Record<string, string> }>(
    '/',
    { ...guard },
    async (req) => {
      const query = listEventsSchema.parse(req.query)
      return eventService.listEvents(req.user.sub, req.params.treeId, query)
    },
  )

  // POST /trees/:treeId/events
  fastify.post<{ Params: { treeId: string } }>('/', { ...guard }, async (req, reply) => {
    const body = createEventSchema.parse(req.body)
    const event = await eventService.createEvent(req.user.sub, req.params.treeId, body)
    return reply.code(201).send(event)
  })

  // GET /trees/:treeId/events/:eventId
  fastify.get<{ Params: { treeId: string; eventId: string } }>('/:eventId', { ...guard }, async (req) => {
    return eventService.getEvent(req.user.sub, req.params.treeId, req.params.eventId)
  })

  // PATCH /trees/:treeId/events/:eventId
  fastify.patch<{ Params: { treeId: string; eventId: string } }>('/:eventId', { ...guard }, async (req) => {
    const body = updateEventSchema.parse(req.body)
    return eventService.updateEvent(req.user.sub, req.params.treeId, req.params.eventId, body)
  })

  // DELETE /trees/:treeId/events/:eventId
  fastify.delete<{ Params: { treeId: string; eventId: string } }>('/:eventId', { ...guard }, async (req, reply) => {
    await eventService.deleteEvent(req.user.sub, req.params.treeId, req.params.eventId)
    return reply.code(204).send()
  })

  // POST /trees/:treeId/events/:eventId/like
  fastify.post<{ Params: { treeId: string; eventId: string } }>('/:eventId/like', { ...guard }, async (req) => {
    return eventService.toggleLike(req.user.sub, req.params.treeId, req.params.eventId)
  })
}

export default eventRoutes
