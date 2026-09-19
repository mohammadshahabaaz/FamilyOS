import { randomBytes } from 'crypto'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@familyos/shared'
import { redis } from '../../lib/redis.js'
import { treeLinkRepository } from './tree-link.repository.js'
import { familyRepository } from '../family/family.repository.js'
import { personRepository } from '../person/person.repository.js'
import type { RequestTreeLinkInput } from '@familyos/shared'

const CODE_TTL = 7 * 24 * 60 * 60 // 7 days, matches the family invite-code precedent

function treeLinkCodeKey(code: string) {
  return `treelink-invite:${code}`
}

function isAdminRole(role: string) {
  return ['SUPER_ADMIN', 'ADMIN'].includes(role)
}

async function requireAdmin(userId: string, treeId: string) {
  const membership = await familyRepository.getMembership(userId, treeId)
  if (!membership || !isAdminRole(membership.role)) {
    throw new ForbiddenError('Only admins can perform this action')
  }
  return membership
}

export const treeLinkService = {
  // Deliberately a separate code namespace from family.service.ts's member-join invite
  // codes — this identifies a tree for cross-tree linking, not a role to join it with,
  // and the two must never be interchangeable.
  async generateInviteCode(userId: string, treeId: string) {
    await requireAdmin(userId, treeId)
    const code = randomBytes(4).toString('hex').toUpperCase()
    await redis.set(treeLinkCodeKey(code), treeId, 'EX', CODE_TTL)
    return { code, expiresInHours: 168 }
  },

  async request(userId: string, input: RequestTreeLinkInput) {
    const personA = await personRepository.getTreeId(input.treeAPersonId)
    if (!personA) throw new NotFoundError('Person not found')
    const treeAId = personA.familyTreeId

    await requireAdmin(userId, treeAId)

    const treeBId = await redis.get(treeLinkCodeKey(input.targetTreeInviteCode.toUpperCase()))
    if (!treeBId) throw new ValidationError('Invalid or expired tree-link invite code')

    if (treeBId === treeAId) {
      throw new ValidationError('Cannot link a tree to itself')
    }

    // Existence-only boundary check — never select or return Tree B's person fields
    // (name, photo, DOB, ...) to Tree A. This confirms the id is real without leaking data.
    const personBExists = await personRepository.personBelongsToTree(input.treeBPersonId, treeBId)
    if (!personBExists) throw new NotFoundError('Target person not found in that tree')

    const existing = await treeLinkRepository.findActiveBetweenPersons(
      input.treeAPersonId,
      input.treeBPersonId,
    )
    if (existing) throw new ConflictError('A link request already exists between these persons')

    const link = await treeLinkRepository.create({
      treeAId,
      treeAPersonId: input.treeAPersonId,
      treeBId,
      treeBPersonId: input.treeBPersonId,
      linkType: input.linkType,
      requestedById: userId,
      approvedByTreeAAdminId: userId, // the requester IS Tree A's admin, consenting by requesting
    })

    await redis.del(treeLinkCodeKey(input.targetTreeInviteCode.toUpperCase()))

    return link
  },

  async approve(userId: string, treeLinkId: string) {
    const link = await treeLinkRepository.findById(treeLinkId)
    if (!link) throw new NotFoundError('TreeLink not found')
    await requireAdmin(userId, link.treeBId)

    const result = await treeLinkRepository.transitionStatus(treeLinkId, 'PENDING', 'APPROVED', {
      approvedByTreeBAdminId: userId,
    })
    if (result.count === 0) throw new ConflictError('TreeLink is not in PENDING state')

    return treeLinkRepository.findById(treeLinkId)
  },

  async reject(userId: string, treeLinkId: string) {
    const link = await treeLinkRepository.findById(treeLinkId)
    if (!link) throw new NotFoundError('TreeLink not found')
    await requireAdmin(userId, link.treeBId)

    const result = await treeLinkRepository.transitionStatus(treeLinkId, 'PENDING', 'REJECTED', {
      rejectedById: userId,
    })
    if (result.count === 0) throw new ConflictError('TreeLink is not in PENDING state')

    return treeLinkRepository.findById(treeLinkId)
  },

  async listForMyTrees(userId: string) {
    const trees = await familyRepository.getTreesByUser(userId)
    const treeIds = trees.map((t) => t.id)
    if (treeIds.length === 0) return []
    return treeLinkRepository.listForTrees(treeIds)
  },
}
