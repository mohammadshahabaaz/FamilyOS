import { z } from 'zod'

export const requestStoryUploadSchema = z.object({
  treeId: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
})

export const confirmStoryUploadSchema = z.object({
  treeId: z.string().min(1),
  r2Key: z.string().min(1),
  type: z.enum(['PHOTO', 'VIDEO']),
  sizeBytes: z.number().int().positive(),
  caption: z.string().max(500).optional(),
  thumbnailR2Key: z.string().min(1).optional(),
})

export type RequestStoryUploadInput = z.infer<typeof requestStoryUploadSchema>
export type ConfirmStoryUploadInput = z.infer<typeof confirmStoryUploadSchema>
