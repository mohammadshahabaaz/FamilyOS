import { z } from 'zod'

export const createFamilySchema = z.object({
  name: z.string().min(1).max(100),
})

export const updateFamilySchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

export const createInviteSchema = z.object({
  branchLabel: z.string().max(50).optional(),
})

export const acceptInviteSchema = z.object({
  code: z.string().min(1),
})

export const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  branchLabel: z.string().max(50).nullable().optional(),
})

export type CreateFamilyInput = z.infer<typeof createFamilySchema>
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
