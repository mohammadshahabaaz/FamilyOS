import { treeRepository } from './tree.repository.js'
import { computeAllRelationships } from '../relationship/relationship.engine.js'

export const treeService = {
  async listTrees() {
    return treeRepository.listTrees()
  },

  async getTree(treeId: string) {
    return treeRepository.getTree(treeId)
  },

  async listPersons(treeId: string) {
    return treeRepository.getPersons(treeId)
  },

  async getPersonDetail(personId: string) {
    return treeRepository.getPerson(personId)
  },

  async getRelatives(treeId: string, fromPersonId: string) {
    const [persons, edges] = await Promise.all([
      treeRepository.getPersons(treeId),
      treeRepository.getEdges(treeId),
    ])

    const genderMap = new Map(
      persons.map((p) => [p.id, p.gender as 'MALE' | 'FEMALE' | 'OTHER']),
    )

    const allIds = persons.map((p) => p.id)
    const relationshipMap = computeAllRelationships(fromPersonId, allIds, edges, genderMap)

    return persons
      .filter((p) => p.id !== fromPersonId)
      .map((p) => {
        const rel = relationshipMap.get(p.id) ?? { label: 'Not related', path: '' }
        return {
          person: {
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            profilePicUrl: p.profilePicUrl,
            gender: p.gender,
            dateOfBirth: p.dateOfBirth,
            isDeceased: p.isDeceased,
            linkedUsername: p.linkedUser?.username ?? null,
          },
          relationship: rel.label,
          pathDebug: rel.path,
        }
      })
  },

  async listEvents(treeId: string) {
    const events = await treeRepository.getEvents(treeId)
    return events.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      date: e.date,
      visibility: e.visibility,
      createdBy: e.createdBy,
      taggedPersons: e.taggedPersons.map((ep) => ep.person),
      media: e.media.map((m) => ({
        id: m.id,
        type: m.type,
        caption: m.caption,
        url: m.r2Key,        // in dev, r2Key holds placeholder URL
        thumbnail: m.thumbnailR2Key ?? m.r2Key,
      })),
      comments: e.comments,
      commentCount: e._count.comments,
    }))
  },
}
