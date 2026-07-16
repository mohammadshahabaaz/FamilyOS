import { z } from 'zod'

export const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER'])

// dateOfBirth accepts both YYYY-MM-DD (mobile date picker) and full ISO datetimes
const dateOfBirthSchema = z.string()
  .refine(s => !isNaN(Date.parse(s)), { message: 'Invalid date — use YYYY-MM-DD or ISO 8601' })
  .optional()

export const createPersonSchema = z.object({
  firstName:     z.string().min(1).max(50),
  lastName:      z.string().min(1).max(50),
  gender:        genderSchema,
  dateOfBirth:   dateOfBirthSchema,
  isDeceased:    z.boolean().default(false),
  profilePicUrl: z.string().url().optional(),
})

export const updatePersonSchema = createPersonSchema.partial()

export const relationTypeSchema = z.enum(['PARENT', 'SPOUSE', 'SIBLING'])

export const createEdgeSchema = z.object({
  fromPersonId: z.string().min(1),
  toPersonId:   z.string().min(1),
  relationType: relationTypeSchema,
})

export const deleteEdgeSchema = z.object({
  fromPersonId: z.string().min(1),
  toPersonId:   z.string().min(1),
  relationType: relationTypeSchema,
})

export type Gender            = z.infer<typeof genderSchema>
export type CreatePersonInput = z.infer<typeof createPersonSchema>
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>
export type RelationType      = z.infer<typeof relationTypeSchema>
export type CreateEdgeInput   = z.infer<typeof createEdgeSchema>
