import { z } from 'zod'

export const mediaTypeSchema = z.enum(['PHOTO', 'VIDEO'])

export const requestUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  type: mediaTypeSchema,
  caption: z.string().max(500).optional(),
})

export const confirmUploadSchema = z.object({
  mediaId: z.string().min(1),
})

export type MediaType = z.infer<typeof mediaTypeSchema>
export type RequestUploadInput = z.infer<typeof requestUploadSchema>
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>
