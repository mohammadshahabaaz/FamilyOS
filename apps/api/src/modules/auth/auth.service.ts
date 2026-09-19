import argon2 from 'argon2'
import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { authRepository } from './auth.repository.js'
import { redis } from '../../lib/redis.js'
import { env } from '../../lib/env.js'
import type { SignupInput, LoginInput } from '@familyos/shared'

const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

function refreshKey(userId: string, tokenId: string) {
  return `refresh:${userId}:${tokenId}`
}

// Tracks the currently-valid tokenId for a rotation chain ("family"). Every token
// issued by rotating an earlier one shares its family's original familyId — so if a
// stale (already-rotated) token is ever replayed, we can revoke whatever token the
// family has rotated to, not just the stale one, without needing per-device state.
function familyKey(userId: string, familyId: string) {
  return `refresh-family:${userId}:${familyId}`
}

export function buildAuthService(fastify: FastifyInstance) {
  async function issueTokens(
    userId: string,
    uniqueUserId: string,
    familyId: string = randomUUID(),
  ) {
    const tokenId = randomUUID()

    const accessToken = fastify.jwt.sign(
      { sub: userId, uniqueUserId },
      { expiresIn: env.JWT_EXPIRES_IN },
    )

    // fast-jwt accepts extra claims at runtime; TS overload doesn't see them in the narrowed payload type
    const refreshPayload = {
      sub: userId,
      uniqueUserId,
      tokenId,
      familyId,
      type: 'refresh',
    } as unknown as { sub: string; uniqueUserId: string }
    const refreshToken = fastify.jwt.sign(refreshPayload, { expiresIn: env.JWT_REFRESH_EXPIRES_IN })

    await redis.set(refreshKey(userId, tokenId), '1', 'EX', REFRESH_TTL_SECONDS)
    await redis.set(familyKey(userId, familyId), tokenId, 'EX', REFRESH_TTL_SECONDS)

    return { accessToken, refreshToken }
  }

  return {
    async signup(input: SignupInput) {
      const existing = await authRepository.findByMobile(input.mobileNumber)
      if (existing)
        throw Object.assign(new Error('Mobile number already registered'), { statusCode: 409 })

      const usernameTaken = await authRepository.findByUsername(input.username)
      if (usernameTaken)
        throw Object.assign(new Error('Username already taken'), { statusCode: 409 })

      const passwordHash = await argon2.hash(input.password)

      const user = await authRepository.createUser({
        mobileNumber: input.mobileNumber,
        passwordHash,
        username: input.username,
        uniqueUserId: input.username, // same as username initially; user can change later
      })

      const tokens = await issueTokens(user.id, user.uniqueUserId)
      return {
        user: {
          id: user.id,
          username: user.username,
          uniqueUserId: user.uniqueUserId,
          profilePicUrl: user.profilePicUrl,
        },
        ...tokens,
      }
    },

    async login(input: LoginInput) {
      const user = await authRepository.findByMobile(input.mobileNumber)
      if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })

      const valid = await argon2.verify(user.passwordHash, input.password)
      if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })

      const tokens = await issueTokens(user.id, user.uniqueUserId)
      return {
        user: {
          id: user.id,
          username: user.username,
          uniqueUserId: user.uniqueUserId,
          profilePicUrl: user.profilePicUrl,
        },
        ...tokens,
      }
    },

    async refresh(rawToken: string) {
      let payload: {
        sub: string
        uniqueUserId: string
        tokenId: string
        familyId?: string
        type: string
      }
      try {
        payload = fastify.jwt.verify(rawToken)
      } catch {
        throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 })
      }

      if (payload.type !== 'refresh') {
        throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 })
      }

      const key = refreshKey(payload.sub, payload.tokenId)
      const exists = await redis.get(key)

      if (!exists) {
        // This exact tokenId is gone — either already rotated away, or forged.
        // Either way, a legitimate client would never present it, so treat this as
        // theft and revoke the whole family: find whatever token it has rotated to
        // (if any) and kill that too, not just the stale one being replayed.
        if (payload.familyId) {
          const currentTokenId = await redis.get(familyKey(payload.sub, payload.familyId))
          if (currentTokenId) await redis.del(refreshKey(payload.sub, currentTokenId))
          await redis.del(familyKey(payload.sub, payload.familyId))
        }
        throw Object.assign(new Error('Refresh token revoked'), { statusCode: 401 })
      }

      // Rotate: delete old, issue new (same family)
      await redis.del(key)
      return issueTokens(payload.sub, payload.uniqueUserId, payload.familyId)
    },

    async logout(rawToken: string) {
      try {
        // False positive: ESLint's type service resolves fastify.jwt.verify()'s return
        // type more narrowly than tsc does here; removing this breaks `tsc --noEmit`
        // with real "Property does not exist" errors on payload.tokenId/familyId below.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const payload = fastify.jwt.verify(rawToken) as {
          sub: string
          tokenId?: string
          familyId?: string
          type?: string
        }
        if (payload.tokenId) {
          await redis.del(refreshKey(payload.sub, payload.tokenId))
        }
        if (payload.familyId) {
          await redis.del(familyKey(payload.sub, payload.familyId))
        }
      } catch {
        // Token already invalid — treat as success
      }
    },

    async getMe(userId: string) {
      const user = await authRepository.findById(userId)
      if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })
      return {
        id: user.id,
        username: user.username,
        uniqueUserId: user.uniqueUserId,
        mobileNumber: user.mobileNumber,
        profilePicUrl: user.profilePicUrl,
        createdAt: user.createdAt,
      }
    },
  }
}

export type AuthService = ReturnType<typeof buildAuthService>
