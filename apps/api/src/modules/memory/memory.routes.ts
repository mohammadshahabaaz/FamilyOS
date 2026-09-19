import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { memoryService } from './memory.service.js'

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
])

const memoryRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] }

  // All routes scoped under /trees/:treeId/events/:eventId

  // POST /trees/:treeId/events/:eventId/media/upload-url
  fastify.post<{ Params: { treeId: string; eventId: string } }>(
    '/media/upload-url',
    { ...guard },
    async (req, reply) => {
      const body = z
        .object({
          mimeType: z.string().refine((m) => ALLOWED_MIME.has(m), 'Unsupported file type'),
          sizeBytes: z
            .number()
            .int()
            .positive()
            .max(200 * 1024 * 1024), // max 200 MB
        })
        .parse(req.body)

      const result = await memoryService.requestUploadUrl(
        req.user.sub,
        req.params.treeId,
        req.params.eventId,
        body,
      )
      return reply.code(201).send(result)
    },
  )

  // POST /trees/:treeId/events/:eventId/media/confirm
  fastify.post<{ Params: { treeId: string; eventId: string } }>(
    '/media/confirm',
    { ...guard },
    async (req, reply) => {
      const body = z
        .object({
          r2Key: z.string().min(1),
          type: z.enum(['PHOTO', 'VIDEO']),
          sizeBytes: z.number().int().positive(),
          caption: z.string().max(500).optional(),
          thumbnailR2Key: z.string().min(1).optional(),
        })
        .parse(req.body)

      const media = await memoryService.confirmUpload(
        req.user.sub,
        req.params.treeId,
        req.params.eventId,
        body,
      )
      return reply.code(201).send(media)
    },
  )

  // DELETE /trees/:treeId/events/:eventId/media/:mediaId
  fastify.delete<{ Params: { treeId: string; eventId: string; mediaId: string } }>(
    '/media/:mediaId',
    { ...guard },
    async (req, reply) => {
      await memoryService.deleteMedia(
        req.user.sub,
        req.params.treeId,
        req.params.eventId,
        req.params.mediaId,
      )
      return reply.code(204).send()
    },
  )

  // POST /trees/:treeId/events/:eventId/comments
  fastify.post<{ Params: { treeId: string; eventId: string } }>(
    '/comments',
    { ...guard },
    async (req, reply) => {
      const { text } = z.object({ text: z.string().min(1).max(1000) }).parse(req.body)
      const comment = await memoryService.addComment(
        req.user.sub,
        req.params.treeId,
        req.params.eventId,
        text,
      )
      return reply.code(201).send(comment)
    },
  )

  // GET /trees/:treeId/events/:eventId/comments
  fastify.get<{ Params: { treeId: string; eventId: string }; Querystring: Record<string, string> }>(
    '/comments',
    { ...guard },
    async (req) => {
      const query = z
        .object({
          cursor: z.string().optional(),
          limit: z.coerce.number().int().min(1).max(50).default(20),
        })
        .parse(req.query)

      return memoryService.listComments(req.user.sub, req.params.treeId, req.params.eventId, query)
    },
  )

  // DELETE /trees/:treeId/events/:eventId/comments/:commentId
  fastify.delete<{ Params: { treeId: string; eventId: string; commentId: string } }>(
    '/comments/:commentId',
    { ...guard },
    async (req, reply) => {
      await memoryService.deleteComment(
        req.user.sub,
        req.params.treeId,
        req.params.eventId,
        req.params.commentId,
      )
      return reply.code(204).send()
    },
  )
}

export default memoryRoutes
