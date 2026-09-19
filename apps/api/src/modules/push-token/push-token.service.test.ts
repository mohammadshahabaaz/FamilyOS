import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./push-token.repository.js', () => ({
  pushTokenRepository: {
    upsert: vi.fn(),
  },
}))

import { pushTokenRepository } from './push-token.repository.js'
import { pushTokenService } from './push-token.service.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('pushTokenService.register', () => {
  it('upserts the token and returns only the safe fields', async () => {
    vi.mocked(pushTokenRepository.upsert).mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
      createdAt: new Date('2024-01-01'),
    })

    const result = await pushTokenService.register('user-1', {
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
    })

    expect(result).toEqual({
      id: 'token-1',
      platform: 'ios',
      createdAt: new Date('2024-01-01'),
    })
    expect(vi.mocked(pushTokenRepository.upsert)).toHaveBeenCalledWith(
      'user-1',
      'ExponentPushToken[abc]',
      'ios',
    )
  })
})
