import type { FastifyPluginAsync } from 'fastify'
import { storyService } from './story.service.js'
import { requestStoryUploadSchema, confirmStoryUploadSchema } from '@familyos/shared'

// Flat routes: POST /api/v1/stories/upload-url|confirm|:id/view
const storyRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] }

  fastify.post('/upload-url', { ...guard }, async (req) => {
    const body = requestStoryUploadSchema.parse(req.body)
    return storyService.requestUploadUrl(req.user.sub, body)
  })

  fastify.post('/confirm', { ...guard }, async (req, reply) => {
    const body = confirmStoryUploadSchema.parse(req.body)
    const story = await storyService.confirmUpload(req.user.sub, body)
    return reply.code(201).send(story)
  })

  fastify.post<{ Params: { id: string } }>('/:id/view', { ...guard }, async (req) => {
    return storyService.recordView(req.user.sub, req.params.id)
  })
}

export default storyRoutes
