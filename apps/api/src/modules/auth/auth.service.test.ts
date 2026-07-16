import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock external deps before importing service
vi.mock('../../lib/db.js', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
  },
}))

vi.mock('../../lib/redis.js', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock('argon2', () => ({
  default: {
    hash:   vi.fn().mockResolvedValue('$argon2id$hashed'),
    verify: vi.fn(),
  },
}))

import argon2 from 'argon2'
import { db } from '../../lib/db.js'
import { redis } from '../../lib/redis.js'
import { buildAuthService } from './auth.service.js'

const mockJwt = {
  sign:   vi.fn().mockReturnValue('mock.jwt.token'),
  verify: vi.fn(),
}

const mockFastify = {
  jwt: mockJwt,
} as never

const authService = buildAuthService(mockFastify)

const baseUser = {
  id:           'user-1',
  mobileNumber: '+919876543210',
  passwordHash: '$argon2id$hashed',
  username:     'tariq',
  uniqueUserId: 'tariq',
  profilePicUrl: null,
  createdAt:    new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authService.signup', () => {
  it('creates a user and returns tokens', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)  // mobile not taken
    vi.mocked(db.user.create).mockResolvedValue(baseUser as never)

    const result = await authService.signup({
      mobileNumber: '+919876543210',
      password:     'password123',
      username:     'tariq',
      firstName:    'Tariq',
      lastName:     'Khan',
    })

    expect(result.user.id).toBe('user-1')
    expect(result.user.username).toBe('tariq')
    expect(result.accessToken).toBe('mock.jwt.token')
    expect(result.refreshToken).toBe('mock.jwt.token')
    expect(vi.mocked(argon2.hash)).toHaveBeenCalledWith('password123')
    expect(vi.mocked(redis.set)).toHaveBeenCalled()
  })

  it('throws 409 if mobile number is already registered', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(baseUser as never)

    await expect(authService.signup({
      mobileNumber: '+919876543210',
      password:     'password123',
      username:     'tariq',
      firstName:    'Tariq',
      lastName:     'Khan',
    })).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('already registered') })
  })

  it('throws 409 if username is already taken', async () => {
    // First findUnique (mobile) returns null, second (username) returns user
    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(baseUser as never)

    await expect(authService.signup({
      mobileNumber: '+919123456789',
      password:     'password123',
      username:     'tariq',
      firstName:    'Another',
      lastName:     'Person',
    })).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('Username') })
  })
})

describe('authService.login', () => {
  it('returns tokens for valid credentials', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(baseUser as never)
    vi.mocked(argon2.verify).mockResolvedValue(true)

    const result = await authService.login({
      mobileNumber: '+919876543210',
      password:     'password123',
    })

    expect(result.user.id).toBe('user-1')
    expect(result.accessToken).toBe('mock.jwt.token')
  })

  it('throws 401 for unknown mobile number', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)

    await expect(authService.login({
      mobileNumber: '+919000000000',
      password:     'any',
    })).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 for wrong password', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(baseUser as never)
    vi.mocked(argon2.verify).mockResolvedValue(false)

    await expect(authService.login({
      mobileNumber: '+919876543210',
      password:     'wrongpassword',
    })).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('authService.refresh', () => {
  it('issues new tokens when refresh token is valid and in Redis', async () => {
    vi.mocked(mockJwt.verify).mockReturnValue({
      sub: 'user-1', uniqueUserId: 'tariq', tokenId: 'tok-123', type: 'refresh',
    })
    vi.mocked(redis.get).mockResolvedValue('1')

    const result = await authService.refresh('valid.refresh.token')

    expect(result.accessToken).toBe('mock.jwt.token')
    expect(vi.mocked(redis.del)).toHaveBeenCalled()
    expect(vi.mocked(redis.set)).toHaveBeenCalled()
  })

  it('throws 401 when refresh token is revoked (not in Redis)', async () => {
    vi.mocked(mockJwt.verify).mockReturnValue({
      sub: 'user-1', uniqueUserId: 'tariq', tokenId: 'tok-123', type: 'refresh',
    })
    vi.mocked(redis.get).mockResolvedValue(null)

    await expect(authService.refresh('revoked.token')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when token is not a refresh token', async () => {
    vi.mocked(mockJwt.verify).mockReturnValue({
      sub: 'user-1', uniqueUserId: 'tariq', type: 'access',
    })

    await expect(authService.refresh('access.token.used.as.refresh')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when token signature is invalid', async () => {
    vi.mocked(mockJwt.verify).mockImplementation(() => { throw new Error('invalid signature') })

    await expect(authService.refresh('tampered.token')).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('authService.logout', () => {
  it('deletes refresh token from Redis', async () => {
    vi.mocked(mockJwt.verify).mockReturnValue({
      sub: 'user-1', tokenId: 'tok-123', type: 'refresh',
    })

    await authService.logout('valid.refresh.token')
    expect(vi.mocked(redis.del)).toHaveBeenCalledWith('refresh:user-1:tok-123')
  })

  it('does not throw when token is already invalid', async () => {
    vi.mocked(mockJwt.verify).mockImplementation(() => { throw new Error('expired') })

    await expect(authService.logout('expired.token')).resolves.not.toThrow()
  })
})

describe('authService.getMe', () => {
  it('returns user profile', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(baseUser as never)

    const result = await authService.getMe('user-1')
    expect(result.id).toBe('user-1')
    expect(result.username).toBe('tariq')
  })

  it('throws 404 when user does not exist', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)

    await expect(authService.getMe('nonexistent')).rejects.toMatchObject({ statusCode: 404 })
  })
})
