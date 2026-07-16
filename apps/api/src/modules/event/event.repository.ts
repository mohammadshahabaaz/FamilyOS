import type { EventType, Visibility } from '@prisma/client'
import { db } from '../../lib/db.js'

const EVENT_SELECT = {
  id: true, type: true, title: true, description: true, date: true,
  visibility: true, branchLabel: true, createdAt: true,
  createdBy: { select: { id: true, username: true, profilePicUrl: true } },
  taggedPersons: {
    select: {
      person: {
        select: { id: true, firstName: true, lastName: true, profilePicUrl: true, gender: true },
      },
    },
  },
  media: {
    select: { id: true, r2Key: true, thumbnailR2Key: true, type: true, caption: true },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: { select: { comments: true } },
}

export const eventRepository = {
  create(data: {
    treeId:          string
    createdById:     string
    type:            string
    title:           string
    date:            Date
    description?:    string | null
    visibility:      string
    branchLabel?:    string | null
    taggedPersonIds: string[]
  }) {
    return db.event.create({
      data: {
        treeId:      data.treeId,
        createdById: data.createdById,
        type:        data.type as EventType,
        title:       data.title,
        date:        data.date,
        description: data.description ?? null,
        visibility:  data.visibility as Visibility,
        branchLabel: data.branchLabel ?? null,
        taggedPersons: data.taggedPersonIds.length > 0
          ? { create: data.taggedPersonIds.map((personId) => ({ personId })) }
          : undefined,
      },
      select: EVENT_SELECT,
    })
  },

  findById(eventId: string) {
    return db.event.findUnique({ where: { id: eventId }, select: EVENT_SELECT })
  },

  listByTree(treeId: string, opts: { cursor?: string; limit: number; year?: number }) {
    return db.event.findMany({
      where: {
        treeId,
        ...(opts.year ? {
          date: {
            gte: new Date(`${opts.year}-01-01`),
            lt:  new Date(`${opts.year + 1}-01-01`),
          },
        } : {}),
      },
      orderBy: { date: 'desc' },
      take: opts.limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      select: EVENT_SELECT,
    })
  },

  update(eventId: string, data: Partial<{
    type:        string
    title:       string
    date:        Date
    description: string | null
    visibility:  string
    branchLabel: string | null
  }>) {
    return db.event.update({
      where: { id: eventId },
      data: {
        ...(data.type        !== undefined && { type:        data.type as EventType }),
        ...(data.title       !== undefined && { title:       data.title }),
        ...(data.date        !== undefined && { date:        data.date }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.visibility  !== undefined && { visibility:  data.visibility as Visibility }),
        ...(data.branchLabel !== undefined && { branchLabel: data.branchLabel }),
      },
      select: EVENT_SELECT,
    })
  },

  delete(eventId: string) {
    return db.$transaction(async (tx) => {
      await tx.like.deleteMany({ where: { targetType: 'EVENT', targetId: eventId } })
      await tx.event.delete({ where: { id: eventId } })
    })
  },

  updateTaggedPersons(eventId: string, personIds: string[]) {
    return db.$transaction(async (tx) => {
      await tx.eventPerson.deleteMany({ where: { eventId } })
      if (personIds.length > 0) {
        await tx.eventPerson.createMany({ data: personIds.map(personId => ({ eventId, personId })) })
      }
    })
  },

  eventBelongsToTree(eventId: string, treeId: string) {
    return db.event.findFirst({ where: { id: eventId, treeId }, select: { id: true, createdById: true } })
  },

  getLike(userId: string, eventId: string) {
    return db.like.findFirst({ where: { targetType: 'EVENT', targetId: eventId, userId } })
  },

  addLike(userId: string, eventId: string) {
    return db.like.create({ data: { userId, targetType: 'EVENT', targetId: eventId } })
  },

  removeLike(userId: string, eventId: string) {
    return db.like.deleteMany({ where: { targetType: 'EVENT', targetId: eventId, userId } })
  },

  countLikes(eventId: string) {
    return db.like.count({ where: { targetType: 'EVENT', targetId: eventId } })
  },

  async countLikesForEvents(eventIds: string[]): Promise<Map<string, number>> {
    if (!eventIds.length) return new Map()
    const rows = await db.like.groupBy({
      by: ['targetId'],
      where: { targetType: 'EVENT', targetId: { in: eventIds } },
      _count: { _all: true },
    })
    return new Map(rows.map(r => [r.targetId, r._count._all]))
  },

  async getUserLikedSet(userId: string, eventIds: string[]): Promise<Set<string>> {
    if (!eventIds.length) return new Set()
    const rows = await db.like.findMany({
      where: { userId, targetType: 'EVENT', targetId: { in: eventIds } },
      select: { targetId: true },
    })
    return new Set(rows.map(r => r.targetId))
  },
}
