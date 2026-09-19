import { z } from 'zod'

export const signupSchema = z.object({
  mobileNumber: z.string().min(7).max(20),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers and _ only'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
})

export const loginSchema = z.object({
  mobileNumber: z.string().min(7).max(20),
  password: z.string().min(1),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
