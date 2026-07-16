import { personRepository } from './person.repository.js'
import { familyRepository } from '../family/family.repository.js'
import { computeAllRelationships } from '../relationship/relationship.engine.js'
import type { CreatePersonInput, UpdatePersonInput, CreateEdgeInput } from '@familyos/shared'

async function assertMember(userId: string, treeId: string) {
  const m = await familyRepository.getMembership(userId, treeId)
  if (!m) throw Object.assign(new Error('Not a member of this family'), { statusCode: 403 })
  return m
}

async function assertPersonInTree(personId: string, treeId: string) {
  const p = await personRepository.personBelongsToTree(personId, treeId)
  if (!p) throw Object.assign(new Error('Person not found'), { statusCode: 404 })
  return p
}

export const personService = {
  async listPersons(userId: string, treeId: string) {
    await assertMember(userId, treeId)
    return personRepository.listByTree(treeId)
  },

  async getPerson(userId: string, treeId: string, personId: string) {
    await assertMember(userId, treeId)
    await assertPersonInTree(personId, treeId)
    return personRepository.findById(personId)
  },

  async createPerson(userId: string, treeId: string, input: CreatePersonInput) {
    await assertMember(userId, treeId)
    return personRepository.create({
      familyTreeId:  treeId,
      createdById:   userId,
      firstName:     input.firstName,
      lastName:      input.lastName,
      gender:        input.gender,
      dateOfBirth:   input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      isDeceased:    input.isDeceased ?? false,
      profilePicUrl: input.profilePicUrl ?? null,
    })
  },

  async updatePerson(userId: string, treeId: string, personId: string, input: UpdatePersonInput) {
    await assertMember(userId, treeId)
    await assertPersonInTree(personId, treeId)
    return personRepository.update(personId, {
      ...input,
      dateOfBirth: input.dateOfBirth !== undefined ? new Date(input.dateOfBirth!) : undefined,
    })
  },

  async deletePerson(userId: string, treeId: string, personId: string) {
    const membership = await assertMember(userId, treeId)
    await assertPersonInTree(personId, treeId)
    if (!['SUPER_ADMIN', 'ADMIN'].includes(membership.role)) {
      throw Object.assign(new Error('Only admins can delete persons'), { statusCode: 403 })
    }
    await personRepository.delete(personId)
  },

  async linkUserToPerson(userId: string, treeId: string, personId: string, targetUserId: string) {
    const membership = await assertMember(userId, treeId)
    await assertPersonInTree(personId, treeId)
    if (!['SUPER_ADMIN', 'ADMIN'].includes(membership.role)) {
      throw Object.assign(new Error('Only admins can link users'), { statusCode: 403 })
    }
    return personRepository.linkUser(personId, targetUserId)
  },

  async addEdge(userId: string, treeId: string, input: CreateEdgeInput) {
    await assertMember(userId, treeId)
    await assertPersonInTree(input.fromPersonId, treeId)
    await assertPersonInTree(input.toPersonId, treeId)
    return personRepository.createEdge(treeId, input.fromPersonId, input.toPersonId, input.relationType)
  },

  async removeEdge(userId: string, treeId: string, input: CreateEdgeInput) {
    await assertMember(userId, treeId)
    return personRepository.deleteEdge(treeId, input.fromPersonId, input.toPersonId, input.relationType)
  },

  async listEdges(userId: string, treeId: string) {
    await assertMember(userId, treeId)
    return personRepository.listEdges(treeId)
  },

  async getRelatives(userId: string, treeId: string, personId: string) {
    await assertMember(userId, treeId)
    await assertPersonInTree(personId, treeId)

    const [persons, edges] = await Promise.all([
      personRepository.listByTree(treeId),
      personRepository.listEdges(treeId),
    ])

    const genderMap = new Map(
      persons.map(p => [p.id, p.gender as 'MALE' | 'FEMALE' | 'OTHER']),
    )
    const allIds = persons.map(p => p.id)
    const relMap = computeAllRelationships(personId, allIds, edges, genderMap)

    return persons
      .filter(p => p.id !== personId)
      .map(p => {
        const rel = relMap.get(p.id) ?? { label: 'Not related', path: '' }
        return { person: p, relationship: rel.label }
      })
      .filter(r => r.relationship !== 'Not related')
  },
}
