import type { FastifyPluginAsync } from 'fastify'
import { personService } from './person.service.js'
import { createPersonSchema, updatePersonSchema, createEdgeSchema } from '@familyos/shared'

const personRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] }

  // All routes are scoped under /trees/:treeId/persons

  // GET /trees/:treeId/persons
  fastify.get<{ Params: { treeId: string } }>('/', { ...guard }, async (req) => {
    return personService.listPersons(req.user.sub, req.params.treeId)
  })

  // GET /trees/:treeId/persons/:personId
  fastify.get<{ Params: { treeId: string; personId: string } }>(
    '/:personId',
    { ...guard },
    async (req) => {
      return personService.getPerson(req.user.sub, req.params.treeId, req.params.personId)
    },
  )

  // POST /trees/:treeId/persons
  fastify.post<{ Params: { treeId: string } }>('/', { ...guard }, async (req, reply) => {
    const body = createPersonSchema.parse(req.body)
    const person = await personService.createPerson(req.user.sub, req.params.treeId, body)
    return reply.code(201).send(person)
  })

  // PATCH /trees/:treeId/persons/:personId
  fastify.patch<{ Params: { treeId: string; personId: string } }>(
    '/:personId',
    { ...guard },
    async (req) => {
      const body = updatePersonSchema.parse(req.body)
      return personService.updatePerson(req.user.sub, req.params.treeId, req.params.personId, body)
    },
  )

  // DELETE /trees/:treeId/persons/:personId
  fastify.delete<{ Params: { treeId: string; personId: string } }>(
    '/:personId',
    { ...guard },
    async (req, reply) => {
      await personService.deletePerson(req.user.sub, req.params.treeId, req.params.personId)
      return reply.code(204).send()
    },
  )

  // POST /trees/:treeId/persons/:personId/link-user
  fastify.post<{ Params: { treeId: string; personId: string } }>(
    '/:personId/link-user',
    { ...guard },
    async (req) => {
      const { userId } = req.body as { userId: string }
      return personService.linkUserToPerson(
        req.user.sub,
        req.params.treeId,
        req.params.personId,
        userId,
      )
    },
  )

  // POST /trees/:treeId/edges
  fastify.post<{ Params: { treeId: string } }>('/edges', { ...guard }, async (req, reply) => {
    const body = createEdgeSchema.parse(req.body)
    const edge = await personService.addEdge(req.user.sub, req.params.treeId, body)
    return reply.code(201).send(edge)
  })

  // DELETE /trees/:treeId/edges
  fastify.delete<{ Params: { treeId: string } }>('/edges', { ...guard }, async (req, reply) => {
    const body = createEdgeSchema.parse(req.body)
    await personService.removeEdge(req.user.sub, req.params.treeId, body)
    return reply.code(204).send()
  })

  // GET /trees/:treeId/edges
  fastify.get<{ Params: { treeId: string } }>('/edges', { ...guard }, async (req) => {
    return personService.listEdges(req.user.sub, req.params.treeId)
  })

  // GET /trees/:treeId/persons/:personId/relatives
  fastify.get<{ Params: { treeId: string; personId: string } }>(
    '/:personId/relatives',
    { ...guard },
    async (req) => {
      return personService.getRelatives(req.user.sub, req.params.treeId, req.params.personId)
    },
  )
}

export default personRoutes
