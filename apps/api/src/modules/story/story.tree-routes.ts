import type { FastifyPluginAsync } from 'fastify'
import { storyService } from './story.service.js'

// Mounted at /api/v1/trees/:treeId/stories
const storyTreeRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] }

  fastify.get<{ Params: { treeId: string } }>('/', { ...guard }, async (req) => {
    return storyService.listForTree(req.user.sub, req.params.treeId)
  })
}

export default storyTreeRoutes
