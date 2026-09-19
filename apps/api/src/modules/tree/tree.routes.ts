import type { FastifyPluginAsync } from 'fastify'
import { treeService } from './tree.service.js'

const treeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => treeService.listTrees())

  fastify.get<{ Params: { treeId: string } }>('/:treeId', async (req) => {
    return treeService.getTree(req.params.treeId)
  })

  fastify.get<{ Params: { treeId: string } }>('/:treeId/persons', async (req) => {
    return treeService.listPersons(req.params.treeId)
  })

  fastify.get<{ Params: { treeId: string; personId: string } }>(
    '/:treeId/persons/:personId',
    async (req) => treeService.getPersonDetail(req.params.personId),
  )

  fastify.get<{ Params: { treeId: string; personId: string } }>(
    '/:treeId/persons/:personId/relatives',
    async (req) => treeService.getRelatives(req.params.treeId, req.params.personId),
  )

  fastify.get<{ Params: { treeId: string } }>('/:treeId/events', async (req) => {
    return treeService.listEvents(req.params.treeId)
  })
}

export default treeRoutes
