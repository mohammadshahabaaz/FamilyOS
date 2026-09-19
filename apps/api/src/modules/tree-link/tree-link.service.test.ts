import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/redis.js', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock('./tree-link.repository.js', () => ({
  treeLinkRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    listForTrees: vi.fn(),
    findActiveBetweenPersons: vi.fn(),
    transitionStatus: vi.fn(),
  },
}))

vi.mock('../family/family.repository.js', () => ({
  familyRepository: {
    getMembership: vi.fn(),
    getTreesByUser: vi.fn(),
  },
}))

vi.mock('../person/person.repository.js', () => ({
  personRepository: {
    getTreeId: vi.fn(),
    personBelongsToTree: vi.fn(),
  },
}))

import { redis } from '../../lib/redis.js'
import { treeLinkRepository } from './tree-link.repository.js'
import { familyRepository } from '../family/family.repository.js'
import { personRepository } from '../person/person.repository.js'
import { treeLinkService } from './tree-link.service.js'

const ADMIN_MEMBERSHIP = { userId: 'admin-1', treeId: 'tree-a', role: 'ADMIN' }
const MEMBER_MEMBERSHIP = { userId: 'user-1', treeId: 'tree-a', role: 'MEMBER' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(redis.set).mockResolvedValue('OK')
})

describe('treeLinkService.generateInviteCode', () => {
  it('throws 403 when the caller is not an admin', async () => {
    vi.mocked(familyRepository.getMembership).mockResolvedValue(MEMBER_MEMBERSHIP as never)

    await expect(treeLinkService.generateInviteCode('user-1', 'tree-a')).rejects.toMatchObject({
      statusCode: 403,
    })
    expect(vi.mocked(redis.set)).not.toHaveBeenCalled()
  })

  it('generates and stores a code with a 7-day TTL when the caller is an admin', async () => {
    vi.mocked(familyRepository.getMembership).mockResolvedValue(ADMIN_MEMBERSHIP as never)

    const result = await treeLinkService.generateInviteCode('admin-1', 'tree-a')

    expect(result.code).toMatch(/^[0-9A-F]{8}$/)
    expect(result.expiresInHours).toBe(168)
    expect(vi.mocked(redis.set)).toHaveBeenCalledWith(
      expect.stringContaining('treelink-invite:'),
      'tree-a',
      'EX',
      7 * 24 * 60 * 60,
    )
  })
})

describe('treeLinkService.request', () => {
  const input = {
    treeAPersonId: 'person-a',
    treeBPersonId: 'person-b',
    targetTreeInviteCode: 'abc123',
    linkType: 'MARRIAGE' as const,
  }

  it('throws NotFoundError when the Tree A person does not exist', async () => {
    vi.mocked(personRepository.getTreeId).mockResolvedValue(null)

    await expect(treeLinkService.request('admin-1', input)).rejects.toThrow('Person not found')
  })

  it('throws 403 when the requester is not an admin of Tree A', async () => {
    vi.mocked(personRepository.getTreeId).mockResolvedValue({ familyTreeId: 'tree-a' })
    vi.mocked(familyRepository.getMembership).mockResolvedValue(MEMBER_MEMBERSHIP as never)

    await expect(treeLinkService.request('user-1', input)).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws ValidationError when the invite code is invalid or expired', async () => {
    vi.mocked(personRepository.getTreeId).mockResolvedValue({ familyTreeId: 'tree-a' })
    vi.mocked(familyRepository.getMembership).mockResolvedValue(ADMIN_MEMBERSHIP as never)
    vi.mocked(redis.get).mockResolvedValue(null)

    await expect(treeLinkService.request('admin-1', input)).rejects.toThrow(
      'Invalid or expired tree-link invite code',
    )
  })

  it("throws ValidationError when the code resolves to the requester's own tree", async () => {
    vi.mocked(personRepository.getTreeId).mockResolvedValue({ familyTreeId: 'tree-a' })
    vi.mocked(familyRepository.getMembership).mockResolvedValue(ADMIN_MEMBERSHIP as never)
    vi.mocked(redis.get).mockResolvedValue('tree-a')

    await expect(treeLinkService.request('admin-1', input)).rejects.toThrow(
      'Cannot link a tree to itself',
    )
  })

  it('throws NotFoundError when the target person does not belong to Tree B', async () => {
    vi.mocked(personRepository.getTreeId).mockResolvedValue({ familyTreeId: 'tree-a' })
    vi.mocked(familyRepository.getMembership).mockResolvedValue(ADMIN_MEMBERSHIP as never)
    vi.mocked(redis.get).mockResolvedValue('tree-b')
    vi.mocked(personRepository.personBelongsToTree).mockResolvedValue(null)

    await expect(treeLinkService.request('admin-1', input)).rejects.toThrow(
      'Target person not found in that tree',
    )
  })

  it('throws ConflictError when an active link already exists between these persons', async () => {
    vi.mocked(personRepository.getTreeId).mockResolvedValue({ familyTreeId: 'tree-a' })
    vi.mocked(familyRepository.getMembership).mockResolvedValue(ADMIN_MEMBERSHIP as never)
    vi.mocked(redis.get).mockResolvedValue('tree-b')
    vi.mocked(personRepository.personBelongsToTree).mockResolvedValue({ id: 'person-b' } as never)
    vi.mocked(treeLinkRepository.findActiveBetweenPersons).mockResolvedValue({ id: 'link-1' })

    await expect(treeLinkService.request('admin-1', input)).rejects.toMatchObject({
      statusCode: 409,
    })
  })

  it('creates the link and burns the invite code on success', async () => {
    vi.mocked(personRepository.getTreeId).mockResolvedValue({ familyTreeId: 'tree-a' })
    vi.mocked(familyRepository.getMembership).mockResolvedValue(ADMIN_MEMBERSHIP as never)
    vi.mocked(redis.get).mockResolvedValue('tree-b')
    vi.mocked(personRepository.personBelongsToTree).mockResolvedValue({ id: 'person-b' } as never)
    vi.mocked(treeLinkRepository.findActiveBetweenPersons).mockResolvedValue(null)
    vi.mocked(treeLinkRepository.create).mockResolvedValue({ id: 'link-1' } as never)

    const result = await treeLinkService.request('admin-1', input)

    expect(result.id).toBe('link-1')
    expect(vi.mocked(treeLinkRepository.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        treeAId: 'tree-a',
        treeBId: 'tree-b',
        approvedByTreeAAdminId: 'admin-1',
      }),
    )
    expect(vi.mocked(redis.del)).toHaveBeenCalledWith(expect.stringContaining('treelink-invite:'))
  })
})

describe('treeLinkService.approve / reject', () => {
  const LINK = { id: 'link-1', treeAId: 'tree-a', treeBId: 'tree-b' }

  it('approve throws NotFoundError when the link does not exist', async () => {
    vi.mocked(treeLinkRepository.findById).mockResolvedValue(null)

    await expect(treeLinkService.approve('admin-1', 'link-1')).rejects.toThrow('TreeLink not found')
  })

  it('approve throws 403 when the caller is not an admin of Tree B', async () => {
    vi.mocked(treeLinkRepository.findById).mockResolvedValue(LINK as never)
    vi.mocked(familyRepository.getMembership).mockResolvedValue(MEMBER_MEMBERSHIP as never)

    await expect(treeLinkService.approve('user-1', 'link-1')).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('approve throws ConflictError when the link is not still PENDING (lost the race)', async () => {
    vi.mocked(treeLinkRepository.findById).mockResolvedValue(LINK as never)
    vi.mocked(familyRepository.getMembership).mockResolvedValue({
      userId: 'admin-2',
      treeId: 'tree-b',
      role: 'ADMIN',
    } as never)
    vi.mocked(treeLinkRepository.transitionStatus).mockResolvedValue({ count: 0 })

    await expect(treeLinkService.approve('admin-2', 'link-1')).rejects.toMatchObject({
      statusCode: 409,
    })
  })

  it('approve transitions PENDING to APPROVED on success', async () => {
    vi.mocked(treeLinkRepository.findById).mockResolvedValue(LINK as never)
    vi.mocked(familyRepository.getMembership).mockResolvedValue({
      userId: 'admin-2',
      treeId: 'tree-b',
      role: 'ADMIN',
    } as never)
    vi.mocked(treeLinkRepository.transitionStatus).mockResolvedValue({ count: 1 })

    await treeLinkService.approve('admin-2', 'link-1')

    expect(vi.mocked(treeLinkRepository.transitionStatus)).toHaveBeenCalledWith(
      'link-1',
      'PENDING',
      'APPROVED',
      { approvedByTreeBAdminId: 'admin-2' },
    )
  })

  it('reject transitions PENDING to REJECTED on success', async () => {
    vi.mocked(treeLinkRepository.findById).mockResolvedValue(LINK as never)
    vi.mocked(familyRepository.getMembership).mockResolvedValue({
      userId: 'admin-2',
      treeId: 'tree-b',
      role: 'ADMIN',
    } as never)
    vi.mocked(treeLinkRepository.transitionStatus).mockResolvedValue({ count: 1 })

    await treeLinkService.reject('admin-2', 'link-1')

    expect(vi.mocked(treeLinkRepository.transitionStatus)).toHaveBeenCalledWith(
      'link-1',
      'PENDING',
      'REJECTED',
      { rejectedById: 'admin-2' },
    )
  })
})

describe('treeLinkService.listForMyTrees', () => {
  it('returns an empty array when the user belongs to no trees', async () => {
    vi.mocked(familyRepository.getTreesByUser).mockResolvedValue([])

    const result = await treeLinkService.listForMyTrees('user-1')
    expect(result).toEqual([])
    expect(vi.mocked(treeLinkRepository.listForTrees)).not.toHaveBeenCalled()
  })

  it("lists links across all of the user's trees", async () => {
    vi.mocked(familyRepository.getTreesByUser).mockResolvedValue([
      { id: 'tree-a' },
      { id: 'tree-b' },
    ] as never)
    vi.mocked(treeLinkRepository.listForTrees).mockResolvedValue([{ id: 'link-1' }] as never)

    const result = await treeLinkService.listForMyTrees('user-1')
    expect(result).toHaveLength(1)
    expect(vi.mocked(treeLinkRepository.listForTrees)).toHaveBeenCalledWith(['tree-a', 'tree-b'])
  })
})
