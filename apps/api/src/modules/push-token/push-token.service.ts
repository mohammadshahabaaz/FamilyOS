import { pushTokenRepository } from './push-token.repository.js'
import type { RegisterPushTokenInput } from '@familyos/shared'

export const pushTokenService = {
  async register(userId: string, input: RegisterPushTokenInput) {
    const row = await pushTokenRepository.upsert(userId, input.token, input.platform)
    return { id: row.id, platform: row.platform, createdAt: row.createdAt }
  },
}
