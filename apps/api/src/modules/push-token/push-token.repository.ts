import { db } from '../../lib/db.js'

export const pushTokenRepository = {
  // Idempotent — a device re-registers the same token on every app open.
  upsert(userId: string, token: string, platform: string) {
    return db.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    })
  },

  listForUser(userId: string) {
    return db.pushToken.findMany({ where: { userId } })
  },
}
