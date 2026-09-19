import type { FastifyPluginAsync } from 'fastify'
import { profileRequestService } from './profile-request.service.js'
import { createProfileRequestSchema, rejectProfileRequestSchema } from '@familyos/shared'

const profileRequestRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] }

  // All routes scoped under /trees/:treeId/profile-requests

  // POST /trees/:treeId/profile-requests — self-service submission
  fastify.post<{ Params: { treeId: string } }>('/', { ...guard }, async (req, reply) => {
    const body = createProfileRequestSchema.parse(req.body)
    const request = await profileRequestService.submitRequest(req.user.sub, req.params.treeId, body)
    return reply.code(201).send(request)
  })

  // GET /trees/:treeId/profile-requests — pending requests, admin-only
  fastify.get<{ Params: { treeId: string } }>('/', { ...guard }, async (req) => {
    return profileRequestService.listPending(req.user.sub, req.params.treeId)
  })

  // POST /trees/:treeId/profile-requests/:requestId/approve — admin-only
  fastify.post<{ Params: { treeId: string; requestId: string } }>(
    '/:requestId/approve',
    { ...guard },
    async (req) => {
      return profileRequestService.approveRequest(
        req.user.sub,
        req.params.treeId,
        req.params.requestId,
      )
    },
  )

  // POST /trees/:treeId/profile-requests/:requestId/reject — admin-only
  fastify.post<{ Params: { treeId: string; requestId: string } }>(
    '/:requestId/reject',
    { ...guard },
    async (req) => {
      const body = rejectProfileRequestSchema.parse(req.body)
      return profileRequestService.rejectRequest(
        req.user.sub,
        req.params.treeId,
        req.params.requestId,
        body.reason,
      )
    },
  )
}

export default profileRequestRoutes
