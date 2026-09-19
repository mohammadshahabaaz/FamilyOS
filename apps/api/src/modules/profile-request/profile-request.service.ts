import { ForbiddenError, NotFoundError, ConflictError } from '@familyos/shared'
import { profileRequestRepository } from './profile-request.repository.js'
import { familyRepository } from '../family/family.repository.js'
import { personRepository } from '../person/person.repository.js'
import { notificationService } from '../notification/notification.service.js'
import type { CreateProfileRequestInput } from '@familyos/shared'

function isAdminRole(role: string) {
  return ['SUPER_ADMIN', 'ADMIN'].includes(role)
}

async function requireMember(userId: string, treeId: string) {
  const membership = await familyRepository.getMembership(userId, treeId)
  if (!membership) throw new ForbiddenError('Not a member of this family')
  return membership
}

async function requireAdmin(userId: string, treeId: string) {
  const membership = await requireMember(userId, treeId)
  if (!isAdminRole(membership.role)) {
    throw new ForbiddenError('Only admins can perform this action')
  }
  return membership
}

export const profileRequestService = {
  async submitRequest(userId: string, treeId: string, input: CreateProfileRequestInput) {
    await requireMember(userId, treeId)

    const alreadyLinked = await personRepository.findByLinkedUser(treeId, userId)
    if (alreadyLinked) {
      throw new ConflictError('You are already linked to a person in this family tree')
    }
    const pending = await profileRequestRepository.findPendingByRequester(treeId, userId)
    if (pending) {
      throw new ConflictError('You already have a pending profile request')
    }

    const relatedPerson = await personRepository.personBelongsToTree(
      input.claimedRelatedToPersonId,
      treeId,
    )
    if (!relatedPerson) throw new NotFoundError('Claimed relative not found in this family tree')

    const request = await profileRequestRepository.create({
      treeId,
      requestedById: userId,
      firstName: input.firstName,
      lastName: input.lastName,
      mobileNumber: input.mobileNumber,
      gender: input.gender,
      profilePicUrl: input.profilePicUrl ?? null,
      claimedRelationType: input.claimedRelationType,
      claimedRelatedToPersonId: input.claimedRelatedToPersonId,
      branchLabel: input.branchLabel,
    })

    // Notify admins — fire-and-forget, a notification outage must never fail the request.
    try {
      const tree = await familyRepository.getTreeWithMembers(treeId)
      const admins = (tree?.members ?? []).filter((m) => isAdminRole(m.role))
      for (const admin of admins) {
        if (!admin.user) continue
        await notificationService.create({
          treeId,
          userId: admin.user.id,
          type: 'PROFILE_REQUEST',
          relatedProfileRequestId: request.id,
        })
        await notificationService.sendPush(
          admin.user.id,
          'New profile request',
          `${input.firstName} ${input.lastName} wants to join your family tree`,
          { profileRequestId: request.id, treeId },
        )
      }
    } catch (err) {
      console.error('[profileRequestService.submitRequest] failed to notify admins', {
        requestId: request.id,
        err,
      })
    }

    return request
  },

  async listPending(userId: string, treeId: string) {
    await requireAdmin(userId, treeId)
    return profileRequestRepository.listPendingByTree(treeId)
  },

  async approveRequest(userId: string, treeId: string, requestId: string) {
    await requireAdmin(userId, treeId)
    const request = await profileRequestRepository.findById(requestId)
    if (!request || request.treeId !== treeId) throw new NotFoundError('Profile request not found')
    if (request.status !== 'PENDING') {
      throw new ConflictError('This request has already been reviewed')
    }

    const person = await personRepository.create({
      familyTreeId: treeId,
      createdById: userId,
      firstName: request.firstName,
      lastName: request.lastName,
      gender: request.gender,
      profilePicUrl: request.profilePicUrl,
      linkedUserId: request.requestedById,
    })

    // Same edge direction convention AddPersonScreen already uses: "the claimed
    // relative IS THE [claimedRelationType] OF the new person" — from=existing, to=new.
    await personRepository.createEdge(
      treeId,
      request.claimedRelatedToPersonId,
      person.id,
      request.claimedRelationType,
    )

    const updated = await profileRequestRepository.approve(requestId, userId)

    try {
      await notificationService.create({
        treeId,
        userId: request.requestedById,
        type: 'REQUEST_APPROVED',
        relatedProfileRequestId: requestId,
      })
      await notificationService.sendPush(
        request.requestedById,
        'Request approved',
        `You've been added to the family tree as ${request.firstName} ${request.lastName}`,
        { profileRequestId: requestId, treeId },
      )
    } catch (err) {
      console.error('[profileRequestService.approveRequest] failed to notify requester', {
        requestId,
        err,
      })
    }

    return { request: updated, person }
  },

  async rejectRequest(userId: string, treeId: string, requestId: string, reason?: string) {
    await requireAdmin(userId, treeId)
    const request = await profileRequestRepository.findById(requestId)
    if (!request || request.treeId !== treeId) throw new NotFoundError('Profile request not found')
    if (request.status !== 'PENDING') {
      throw new ConflictError('This request has already been reviewed')
    }

    const updated = await profileRequestRepository.reject(requestId, userId, reason)

    try {
      await notificationService.create({
        treeId,
        userId: request.requestedById,
        type: 'REQUEST_REJECTED',
        relatedProfileRequestId: requestId,
      })
      await notificationService.sendPush(
        request.requestedById,
        'Request declined',
        reason ?? 'Your profile request was declined',
        { profileRequestId: requestId, treeId },
      )
    } catch (err) {
      console.error('[profileRequestService.rejectRequest] failed to notify requester', {
        requestId,
        err,
      })
    }

    return updated
  },
}
