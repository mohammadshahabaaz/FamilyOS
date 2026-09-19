import { z } from 'zod'
import { genderSchema, relationTypeSchema } from './person.js'

export const branchLabelSchema = z.enum(['DADIYAL', 'NANIYAL', 'IMMEDIATE', 'EXTENDED'])

export const createProfileRequestSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  mobileNumber: z.string().min(7).max(20),
  gender: genderSchema,
  profilePicUrl: z.string().url().optional(),
  claimedRelationType: relationTypeSchema,
  claimedRelatedToPersonId: z.string().min(1),
  branchLabel: branchLabelSchema,
})

export const rejectProfileRequestSchema = z.object({
  reason: z.string().max(500).optional(),
})

export type BranchLabel = z.infer<typeof branchLabelSchema>
export type CreateProfileRequestInput = z.infer<typeof createProfileRequestSchema>
export type RejectProfileRequestInput = z.infer<typeof rejectProfileRequestSchema>
