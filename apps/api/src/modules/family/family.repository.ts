import { db } from '../../lib/db.js'

export const familyRepository = {
  createTree(data: { name: string; rootPersonId?: string }) {
    return db.familyTree.create({
      data: {
        name:             data.name,
        rootPersonId:     data.rootPersonId ?? null,
        storageUsedBytes: BigInt(0),
        storageLimitBytes: BigInt(5_368_709_120),
      },
      select: {
        id: true, name: true, rootPersonId: true, timezone: true, createdAt: true,
        _count: { select: { persons: true, members: true, events: true } },
      },
    })
  },

  addMember(userId: string, treeId: string, role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER' = 'MEMBER') {
    return db.familyMember.create({
      data: { userId, treeId, role },
    })
  },

  setRootPerson(treeId: string, rootPersonId: string) {
    return db.familyTree.update({
      where: { id: treeId },
      data:  { rootPersonId },
    })
  },

  getTreesByUser(userId: string) {
    return db.familyTree.findMany({
      where: { members: { some: { userId } } },
      select: {
        id: true, name: true, rootPersonId: true, timezone: true, createdAt: true,
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
        id: true, name: true, rootPersonId: true, timezone: true, createdAt: true,
        _count: { select: { persons: true, members: true, events: true } },
        members: {
          select: {
            role: true, joinedAt: true,
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
