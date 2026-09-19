import { z } from 'zod'

export const generateTreeLinkCodeSchema = z.object({
  treeId: z.string().min(1),
})

export const requestTreeLinkSchema = z.object({
  treeAPersonId: z.string().min(1),
  targetTreeInviteCode: z.string().min(1),
  treeBPersonId: z.string().min(1),
  linkType: z.enum(['MARRIAGE']).default('MARRIAGE'),
})

export type GenerateTreeLinkCodeInput = z.infer<typeof generateTreeLinkCodeSchema>
export type RequestTreeLinkInput = z.infer<typeof requestTreeLinkSchema>
