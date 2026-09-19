import { eventRepository } from './event.repository.js'
import { personRepository } from '../person/person.repository.js'
import { familyRepository } from '../family/family.repository.js'
import { R2_PUBLIC_URL } from '../../lib/r2.js'
import { notificationFanout } from '../../lib/queues.js'
import type { CreateEventInput, UpdateEventInput, ListEventsInput } from '@familyos/shared'

type RawEvent = Awaited<ReturnType<typeof eventRepository.findById>>

function toUrl(key: string) {
  return key.startsWith('http') ? key : `${R2_PUBLIC_URL}/${key}`
}

function transform(raw: NonNullable<RawEvent>, likeCount = 0, likedByMe = false) {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    description: raw.description,
    date: raw.date,
    visibility: raw.visibility,
    branchLabel: raw.branchLabel,
    createdAt: raw.createdAt,
    createdBy: raw.createdBy,
    taggedPersons: raw.taggedPersons.map((ep) => ep.person),
    media: raw.media.map((m) => ({
      id: m.id,
      type: m.type,
      caption: m.caption,
      url: toUrl(m.r2Key),
      thumbnail: m.thumbnailR2Key ? toUrl(m.thumbnailR2Key) : toUrl(m.r2Key),
    })),
    commentCount: raw._count.comments,
    likeCount,
    likedByMe,
  }
}

async function assertMember(userId: string, treeId: string) {
  const m = await familyRepository.getMembership(userId, treeId)
  if (!m) throw Object.assign(new Error('Not a member of this family'), { statusCode: 403 })
  return m
}

async function assertEventInTree(eventId: string, treeId: string) {
  const ev = await eventRepository.eventBelongsToTree(eventId, treeId)
  if (!ev) throw Object.assign(new Error('Event not found'), { statusCode: 404 })
  return ev
}

export const eventService = {
  async createEvent(userId: string, treeId: string, input: CreateEventInput) {
    await assertMember(userId, treeId)

    if (input.taggedPersonIds?.length) {
      const count = await personRepository.countPersonsInTree(input.taggedPersonIds, treeId)
      if (count !== input.taggedPersonIds.length) {
        throw Object.assign(new Error('Tagged persons must all belong to this tree'), {
          statusCode: 422,
        })
      }
    }

    const raw = await eventRepository.create({
      treeId,
      createdById: userId,
      type: input.type,
      title: input.title,
      date: new Date(input.date),
      description: input.description ?? null,
      visibility: input.visibility,
      branchLabel: input.branchLabel ?? null,
      taggedPersonIds: input.taggedPersonIds ?? [],
    })

    // Fire-and-forget: a queue outage must never fail or roll back event creation.
    try {
      await notificationFanout.add('fanout', {
        treeId,
        eventId: raw.id,
        actorUserId: userId,
        notifyGroup: input.notifyGroup,
        title: 'New memory added',
        body: `${raw.createdBy.username} added "${raw.title}"`,
        type: 'EVENT_CREATED',
      })
    } catch (err) {
      console.error('[eventService.createEvent] failed to enqueue notification fan-out', {
        eventId: raw.id,
        err,
      })
    }

    return transform(raw, 0, false)
  },

  async listEvents(userId: string, treeId: string, query: ListEventsInput) {
    await assertMember(userId, treeId)
    const rows = await eventRepository.listByTree(treeId, {
      cursor: query.cursor,
      limit: query.limit,
      year: query.year,
    })

    const hasMore = rows.length > query.limit
    const items = hasMore ? rows.slice(0, query.limit) : rows
    const nextCursor = hasMore ? items[items.length - 1].id : undefined

    const eventIds = items.map((e) => e.id)
    const [likeMap, likedSet] = await Promise.all([
      eventRepository.countLikesForEvents(eventIds),
      eventRepository.getUserLikedSet(userId, eventIds),
    ])
    return {
      items: items.map((e) => transform(e, likeMap.get(e.id) ?? 0, likedSet.has(e.id))),
      nextCursor,
      hasMore,
    }
  },

  async getOnThisDay(userId: string, treeId: string) {
    await assertMember(userId, treeId)
    const now = new Date()
    const month = now.getUTCMonth() + 1
    const day = now.getUTCDate()
    const year = now.getUTCFullYear()

    const rows = await eventRepository.findOnThisDay(treeId, month, day, year)
    if (rows.length === 0) return []

    const eventIds = rows.map((e) => e.id)
    const [likeMap, likedSet] = await Promise.all([
      eventRepository.countLikesForEvents(eventIds),
      eventRepository.getUserLikedSet(userId, eventIds),
    ])
    return rows.map((e) => ({
      ...transform(e, likeMap.get(e.id) ?? 0, likedSet.has(e.id)),
      yearsAgo: year - e.date.getUTCFullYear(),
    }))
  },

  async getEvent(userId: string, treeId: string, eventId: string) {
    await assertMember(userId, treeId)
    await assertEventInTree(eventId, treeId)
    const raw = await eventRepository.findById(eventId)
    if (!raw) throw Object.assign(new Error('Event not found'), { statusCode: 404 })
    const [likeCount, userLike] = await Promise.all([
      eventRepository.countLikes(raw.id),
      eventRepository.getLike(userId, raw.id),
    ])
    return transform(raw, likeCount, !!userLike)
  },

  async updateEvent(userId: string, treeId: string, eventId: string, input: UpdateEventInput) {
    await assertMember(userId, treeId)
    const ev = await assertEventInTree(eventId, treeId)
    if (ev.createdById !== userId) {
      throw Object.assign(new Error('Only the creator can edit this event'), { statusCode: 403 })
    }

    const { taggedPersonIds, ...rest } = input as UpdateEventInput & { taggedPersonIds?: string[] }

    if (taggedPersonIds?.length) {
      const count = await personRepository.countPersonsInTree(taggedPersonIds, treeId)
      if (count !== taggedPersonIds.length) {
        throw Object.assign(new Error('Tagged persons must all belong to this tree'), {
          statusCode: 422,
        })
      }
    }

    await eventRepository.update(eventId, {
      ...rest,
      date: rest.date ? new Date(rest.date) : undefined,
    })

    if (taggedPersonIds !== undefined) {
      await eventRepository.updateTaggedPersons(eventId, taggedPersonIds)
    }

    const raw = await eventRepository.findById(eventId)
    if (!raw) throw Object.assign(new Error('Event not found'), { statusCode: 404 })
    const [likeCount, userLike] = await Promise.all([
      eventRepository.countLikes(raw.id),
      eventRepository.getLike(userId, raw.id),
    ])
    return transform(raw, likeCount, !!userLike)
  },

  async deleteEvent(userId: string, treeId: string, eventId: string) {
    await assertMember(userId, treeId)
    const ev = await assertEventInTree(eventId, treeId)
    if (ev.createdById !== userId) {
      throw Object.assign(new Error('Only the creator can delete this event'), { statusCode: 403 })
    }
    return eventRepository.delete(eventId)
  },

  async toggleLike(userId: string, treeId: string, eventId: string) {
    await assertMember(userId, treeId)
    await assertEventInTree(eventId, treeId)

    const existing = await eventRepository.getLike(userId, eventId)
    if (existing) {
      await eventRepository.removeLike(userId, eventId)
      return { liked: false }
    }
    await eventRepository.addLike(userId, eventId)
    return { liked: true }
  },
}
