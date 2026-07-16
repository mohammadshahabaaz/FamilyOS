import { db } from '../../lib/db.js'

export const authRepository = {
  findByMobile(mobileNumber: string) {
    return db.user.findUnique({ where: { mobileNumber } })
  },

  findById(id: string) {
    return db.user.findUnique({ where: { id } })
  },

  findByUsername(username: string) {
    return db.user.findUnique({ where: { username } })
  },

  createUser(data: {
    mobileNumber: string
    passwordHash: string
    username:     string
    uniqueUserId: string
  }) {
    return db.user.create({ data })
  },

  updateProfilePic(userId: string, profilePicUrl: string) {
    return db.user.update({ where: { id: userId }, data: { profilePicUrl } })
  },
}
