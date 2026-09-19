import { db } from '../../lib/db.js'

const REQUEST_SELECT = {
  id: true,
  treeId: true,
  requestedById: true,
  firstName: true,
  lastName: true,
  mobileNumber: true,
  profilePicUrl: true,
  gender: true,
  claimedRelationType: true,
  claimedRelatedToPersonId: true,
  branchLabel: true,
  status: true,
  possibleDuplicateOfPersonId: true,
  reviewedById: true,
  reviewedAt: true,
  rejectionReason: true,
  createdAt: true,
  requestedBy: { select: { id: true, username: true, profilePicUrl: true } },
  claimedRelatedTo: { select: { id: true, firstName: true, lastName: true } },
}

export const profileRequestRepository = {
  create(data: {
    treeId: string
    requestedById: string
    firstName: string
    lastName: string
    mobileNumber: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    profilePicUrl?: string | null
    claimedRelationType: 'PARENT' | 'SPOUSE' | 'SIBLING'
    claimedRelatedToPersonId: string
    branchLabel: 'DADIYAL' | 'NANIYAL' | 'IMMEDIATE' | 'EXTENDED'
  }) {
    return db.profileRequest.create({ data, select: REQUEST_SELECT })
  },

  findById(id: string) {
    return db.profileRequest.findUnique({ where: { id }, select: REQUEST_SELECT })
  },

  listPendingByTree(treeId: string) {
    return db.profileRequest.findMany({
      where: { treeId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: REQUEST_SELECT,
    })
  },

  findPendingByRequester(treeId: string, userId: string) {
    return db.profileRequest.findFirst({
      where: { treeId, requestedById: userId, status: 'PENDING' },
    })
  },

  approve(id: string, reviewedById: string) {
    return db.profileRequest.update({
      where: { id },
      data: { status: 'APPROVED', reviewedById, reviewedAt: new Date() },
      select: REQUEST_SELECT,
    })
  },

  reject(id: string, reviewedById: string, reason?: string) {
    return db.profileRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason: reason ?? null,
      },
      select: REQUEST_SELECT,
    })
  },
}
