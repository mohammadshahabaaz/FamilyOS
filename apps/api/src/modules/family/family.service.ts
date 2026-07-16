import { randomBytes } from 'crypto'
import { familyRepository } from './family.repository.js'
import { redis } from '../../lib/redis.js'
import { db } from '../../lib/db.js'

const INVITE_TTL = 7 * 24 * 60 * 60  // 7 days

interface InvitePayload {
  treeId:    string
  role:      'ADMIN' | 'MEMBER'
  createdBy: string
}

function inviteKey(code: string) {
  return `invite:${code}`
}

export const familyService = {
  async createFamily(userId: string, name: string, self?: {
    firstName: string
    lastName:  string
    gender:    'MALE' | 'FEMALE' | 'OTHER'
  }) {
    // 1. Create the tree
    const tree = await familyRepository.createTree({ name })

    // 2. Add creator as SUPER_ADMIN
    await familyRepository.addMember(userId, tree.id, 'SUPER_ADMIN')

    // 3. Optionally create a Person for the creator
    if (self) {
      const person = await db.person.create({
        data: {
          familyTreeId: tree.id,
          firstName:    self.firstName,
          lastName:     self.lastName,
          gender:       self.gender,
          isDeceased:   false,
          linkedUserId: userId,
          createdById:  userId,
        },
      })
      await familyRepository.setRootPerson(tree.id, person.id)
    }

    return familyRepository.getTreeWithMembers(tree.id)
  },

  async getMyFamilies(userId: string) {
    return familyRepository.getTreesByUser(userId)
  },

  async getFamily(userId: string, treeId: string) {
    const membership = await familyRepository.getMembership(userId, treeId)
    if (!membership) throw Object.assign(new Error('Family not found'), { statusCode: 404 })
    return familyRepository.getTreeWithMembers(treeId)
  },

  async generateInviteCode(userId: string, treeId: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') {
    const membership = await familyRepository.getMembership(userId, treeId)
    if (!membership) throw Object.assign(new Error('Not a member'), { statusCode: 403 })
    if (!['SUPER_ADMIN', 'ADMIN'].includes(membership.role)) {
      throw Object.assign(new Error('Only admins can generate invite codes'), { statusCode: 403 })
    }

    const code = randomBytes(4).toString('hex').toUpperCase()  // 8-char hex e.g. A3F9C12B
    const payload: InvitePayload = { treeId, role, createdBy: userId }
    await redis.set(inviteKey(code), JSON.stringify(payload), 'EX', INVITE_TTL)
    return { code, expiresInHours: 168 }
  },

  async joinViaCode(userId: string, code: string) {
    const raw = await redis.get(inviteKey(code.toUpperCase()))
    if (!raw) throw Object.assign(new Error('Invalid or expired invite code'), { statusCode: 400 })

    const payload = JSON.parse(raw) as InvitePayload

    const existing = await familyRepository.getMembership(userId, payload.treeId)
    if (existing) throw Object.assign(new Error('Already a member'), { statusCode: 409 })

    await familyRepository.addMember(userId, payload.treeId, payload.role)
    await redis.del(inviteKey(code.toUpperCase()))

    return familyRepository.getTreeWithMembers(payload.treeId)
  },

  async updateMemberRole(requesterId: string, treeId: string, targetUserId: string, role: 'ADMIN' | 'MEMBER') {
    const requester = await familyRepository.getMembership(requesterId, treeId)
    if (!requester || !['SUPER_ADMIN', 'ADMIN'].includes(requester.role)) {
      throw Object.assign(new Error('Not authorised'), { statusCode: 403 })
    }
    const target = await familyRepository.getMembership(targetUserId, treeId)
    if (target?.role === 'SUPER_ADMIN') {
      throw Object.assign(new Error('Cannot change the family owner role'), { statusCode: 403 })
    }
    return familyRepository.updateMemberRole(targetUserId, treeId, role)
  },

  async removeMember(requesterId: string, treeId: string, targetUserId: string) {
    const requester = await familyRepository.getMembership(requesterId, treeId)
    if (!requester || !['SUPER_ADMIN', 'ADMIN'].includes(requester.role)) {
      throw Object.assign(new Error('Not authorised'), { statusCode: 403 })
    }
    if (requesterId === targetUserId) {
      throw Object.assign(new Error('Cannot remove yourself'), { statusCode: 400 })
    }
    const target = await familyRepository.getMembership(targetUserId, treeId)
    if (target?.role === 'SUPER_ADMIN') {
      throw Object.assign(new Error('Cannot remove the family owner'), { statusCode: 403 })
    }
    return familyRepository.removeMember(targetUserId, treeId)
  },
}
