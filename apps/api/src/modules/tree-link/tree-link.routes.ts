import type { FastifyPluginAsync } from 'fastify'
import { treeLinkService } from './tree-link.service.js'
import { requestTreeLinkSchema, generateTreeLinkCodeSchema } from '@familyos/shared'

const treeLinkRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] }

  // POST /api/v1/tree-links/invite-code — generate a code identifying this tree
  // for an external tree admin to request a link against.
  fastify.post('/invite-code', { ...guard }, async (req, reply) => {
    const body = generateTreeLinkCodeSchema.parse(req.body)
    const result = await treeLinkService.generateInviteCode(req.user.sub, body.treeId)
    return reply.code(201).send(result)
  })

  // POST /api/v1/tree-links/request
  fastify.post('/request', { ...guard }, async (req, reply) => {
    const body = requestTreeLinkSchema.parse(req.body)
    const link = await treeLinkService.request(req.user.sub, body)
    return reply.code(201).send(link)
  })

  // POST /api/v1/tree-links/:id/approve
  fastify.post<{ Params: { id: string } }>('/:id/approve', { ...guard }, async (req) => {
    return treeLinkService.approve(req.user.sub, req.params.id)
  })

  // POST /api/v1/tree-links/:id/reject
  fastify.post<{ Params: { id: string } }>('/:id/reject', { ...guard }, async (req) => {
    return treeLinkService.reject(req.user.sub, req.params.id)
  })

  // GET /api/v1/tree-links — pending/approved links across all of my trees
  fastify.get('/', { ...guard }, async (req) => {
    return treeLinkService.listForMyTrees(req.user.sub)
  })
}

export default treeLinkRoutes
