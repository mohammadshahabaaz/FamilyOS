import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { familyService } from './family.service.js'
import { createFamilySchema, updateMemberSchema } from '@familyos/shared'
import { genderSchema } from '@familyos/shared'

const auth = { preHandler: [] as unknown[] }

const familyRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] }

  // POST /families — create a family tree (and optionally add yourself as Person)
  fastify.post('/', { ...guard }, async (req, reply) => {
    const body = z.object({
      name:      z.string().min(1).max(100),
      firstName: z.string().min(1).max(50).optional(),
      lastName:  z.string().min(1).max(50).optional(),
      gender:    genderSchema.optional(),
    }).parse(req.body)

    const self = body.firstName && body.lastName && body.gender
      ? { firstName: body.firstName, lastName: body.lastName, gender: body.gender }
      : undefined

    const tree = await familyService.createFamily(req.user.sub, body.name, self)
    return reply.code(201).send(tree)
  })

  // GET /families — list my families
  fastify.get('/', { ...guard }, async (req) => {
    return familyService.getMyFamilies(req.user.sub)
  })

  // GET /families/:treeId
  fastify.get<{ Params: { treeId: string } }>('/:treeId', { ...guard }, async (req) => {
    return familyService.getFamily(req.user.sub, req.params.treeId)
  })

  // POST /families/:treeId/invites — generate invite code
  fastify.post<{ Params: { treeId: string } }>('/:treeId/invites', { ...guard }, async (req, reply) => {
    const { role } = z.object({
      role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
    }).parse(req.body ?? {})
    const result = await familyService.generateInviteCode(req.user.sub, req.params.treeId, role)
    return reply.code(201).send(result)
  })

  // POST /families/join — join via invite code
  fastify.post('/join', { ...guard }, async (req, reply) => {
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body)
    const tree = await familyService.joinViaCode(req.user.sub, code)
    return reply.code(201).send(tree)
  })

  // PATCH /families/:treeId/members/:userId — update role
  fastify.patch<{ Params: { treeId: string; userId: string } }>(
    '/:treeId/members/:userId',
    { ...guard },
    async (req) => {
      const { role } = updateMemberSchema.parse(req.body)
      if (!role) throw Object.assign(new Error('role is required'), { statusCode: 400 })
      return familyService.updateMemberRole(req.user.sub, req.params.treeId, req.params.userId, role)
    },
  )

  // DELETE /families/:treeId/members/:userId
  fastify.delete<{ Params: { treeId: string; userId: string } }>(
    '/:treeId/members/:userId',
    { ...guard },
    async (req, reply) => {
      await familyService.removeMember(req.user.sub, req.params.treeId, req.params.userId)
      return reply.code(204).send()
    },
  )
}

export default familyRoutes
