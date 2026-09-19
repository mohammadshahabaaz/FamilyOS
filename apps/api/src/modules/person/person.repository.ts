import { db } from '../../lib/db.js'

const PERSON_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  dateOfDeath: true,
  isDeceased: true,
  profilePicUrl: true,
  createdAt: true,
  linkedUserId: true,
  linkedUser: { select: { id: true, username: true, profilePicUrl: true } },
}

export const personRepository = {
  create(data: {
    familyTreeId: string
    createdById: string
    firstName: string
    lastName: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    dateOfBirth?: Date | null
    dateOfDeath?: Date | null
    isDeceased?: boolean
    profilePicUrl?: string | null
    linkedUserId?: string | null
  }) {
    return db.person.create({ data, select: PERSON_SELECT })
  },

  findById(personId: string) {
    return db.person.findUnique({ where: { id: personId }, select: PERSON_SELECT })
  },

  listByTree(treeId: string) {
    return db.person.findMany({
      where: { familyTreeId: treeId },
      select: PERSON_SELECT,
      orderBy: [{ isDeceased: 'asc' }, { dateOfBirth: 'asc' }],
    })
  },

  update(
    personId: string,
    data: Partial<{
      firstName: string
      lastName: string
      gender: 'MALE' | 'FEMALE' | 'OTHER'
      dateOfBirth: Date | null
      dateOfDeath: Date | null
      isDeceased: boolean
      profilePicUrl: string | null
      linkedUserId: string | null
    }>,
  ) {
    return db.person.update({ where: { id: personId }, data, select: PERSON_SELECT })
  },

  delete(personId: string) {
    return db.person.delete({ where: { id: personId } })
  },

  findByLinkedUser(treeId: string, userId: string) {
    return db.person.findFirst({ where: { familyTreeId: treeId, linkedUserId: userId } })
  },

  linkUser(personId: string, userId: string) {
    return db.person.update({
      where: { id: personId },
      data: { linkedUserId: userId },
      select: PERSON_SELECT,
    })
  },

  // Edges
  createEdge(
    treeId: string,
    fromPersonId: string,
    toPersonId: string,
    relationType: 'PARENT' | 'SPOUSE' | 'SIBLING',
  ) {
    return db.relationshipEdge.create({
      data: { treeId, fromPersonId, toPersonId, relationType },
    })
  },

  deleteEdge(
    treeId: string,
    fromPersonId: string,
    toPersonId: string,
    relationType: 'PARENT' | 'SPOUSE' | 'SIBLING',
  ) {
    return db.relationshipEdge.deleteMany({
      where: { treeId, fromPersonId, toPersonId, relationType },
    })
  },

  listEdges(treeId: string) {
    return db.relationshipEdge.findMany({ where: { treeId } })
  },

  personBelongsToTree(personId: string, treeId: string) {
    return db.person.findFirst({ where: { id: personId, familyTreeId: treeId } })
  },

  getTreeId(personId: string) {
    return db.person.findUnique({ where: { id: personId }, select: { familyTreeId: true } })
  },

  countPersonsInTree(personIds: string[], treeId: string) {
    return db.person.count({ where: { id: { in: personIds }, familyTreeId: treeId } })
  },
}
