import { db } from '../../lib/db.js'

export const familyRepository = {
  // Tree + owner membership + optional self-person must all land together —
  // wrapped in a transaction so a failure partway through leaves no orphaned rows.
  createFamilyWithOwner(
    userId: string,
    name: string,
    self?: {
      firstName: string
      lastName: string
      gender: 'MALE' | 'FEMALE' | 'OTHER'
    },
  ) {
    return db.$transaction(async (tx) => {
      const tree = await tx.familyTree.create({
        data: {
          name,
          storageUsedBytes: BigInt(0),
          storageLimitBytes: BigInt(5_368_709_120),
        },
        select: { id: true },
      })

      await tx.familyMember.create({
        data: { userId, treeId: tree.id, role: 'SUPER_ADMIN' },
      })

      if (self) {
        const person = await tx.person.create({
          data: {
            familyTreeId: tree.id,
            firstName: self.firstName,
            lastName: self.lastName,
            gender: self.gender,
            isDeceased: false,
            linkedUserId: userId,
            createdById: userId,
          },
        })
        await tx.familyTree.update({
          where: { id: tree.id },
          data: { rootPersonId: person.id },
        })
      }

      return tree.id
    })
  },

  addMember(userId: string, treeId: string, role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER' = 'MEMBER') {
    return db.familyMember.create({
      data: { userId, treeId, role },
    })
  },

  getTreesByUser(userId: string) {
    return db.familyTree.findMany({
      where: { members: { some: { userId } } },
      select: {
        id: true,
        name: true,
        rootPersonId: true,
        timezone: true,
        createdAt: true,
        _count: { select: { persons: true, members: true, events: true } },
        members: {
          where: { userId },
          select: { role: true, joinedAt: true },
        },
      },
    })
  },

  getMembership(userId: string, treeId: string) {
    return db.familyMember.findUnique({
      where: { userId_treeId: { userId, treeId } },
    })
  },

  getTreeWithMembers(treeId: string) {
    return db.familyTree.findUnique({
      where: { id: treeId },
      select: {
        id: true,
        name: true,
        rootPersonId: true,
        timezone: true,
        createdAt: true,
        _count: { select: { persons: true, members: true, events: true } },
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: { select: { id: true, username: true, profilePicUrl: true } },
          },
        },
      },
    })
  },

  updateMemberRole(userId: string, treeId: string, role: 'ADMIN' | 'MEMBER') {
    return db.familyMember.update({
      where: { userId_treeId: { userId, treeId } },
      data: { role },
    })
  },

  removeMember(userId: string, treeId: string) {
    return db.familyMember.delete({
      where: { userId_treeId: { userId, treeId } },
    })
  },
}
