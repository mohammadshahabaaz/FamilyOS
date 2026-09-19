import { db } from '../../lib/db.js'

export const treeRepository = {
  listTrees() {
    return db.familyTree.findMany({
      select: {
        id: true,
        name: true,
        rootPersonId: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { persons: true, members: true, events: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  getTree(treeId: string) {
    return db.familyTree.findUniqueOrThrow({
      where: { id: treeId },
      select: {
        id: true,
        name: true,
        rootPersonId: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        members: {
          include: { user: { select: { id: true, username: true, profilePicUrl: true } } },
        },
        _count: { select: { persons: true, events: true } },
      },
    })
  },

  getPersons(treeId: string) {
    return db.person.findMany({
      where: { familyTreeId: treeId },
      include: {
        linkedUser: { select: { id: true, username: true, uniqueUserId: true } },
      },
      orderBy: [{ isDeceased: 'asc' }, { dateOfBirth: 'asc' }],
    })
  },

  getPerson(personId: string) {
    return db.person.findUniqueOrThrow({
      where: { id: personId },
      include: {
        linkedUser: { select: { id: true, username: true, profilePicUrl: true } },
        eventTags: {
          include: {
            event: { select: { id: true, title: true, type: true, date: true } },
          },
          take: 5,
          orderBy: { event: { date: 'desc' } },
        },
      },
    })
  },

  getEdges(treeId: string) {
    return db.relationshipEdge.findMany({ where: { treeId } })
  },

  getEvents(treeId: string) {
    return db.event.findMany({
      where: { treeId },
      include: {
        createdBy: { select: { id: true, username: true, profilePicUrl: true } },
        media: {
          where: { status: 'READY' },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: { user: { select: { id: true, username: true, profilePicUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        taggedPersons: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicUrl: true,
                gender: true,
              },
            },
          },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { date: 'desc' },
    })
  },
}
