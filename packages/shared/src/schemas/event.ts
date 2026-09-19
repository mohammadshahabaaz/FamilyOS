import { z } from 'zod'

export const eventTypeSchema = z.enum([
  'BIRTHDAY',
  'ANNIVERSARY',
  'WEDDING',
  'TRIP',
  'GATHERING',
  'ACHIEVEMENT',
  'OTHER',
])

export const visibilitySchema = z.enum(['FAMILY', 'BRANCH'])

export const notifyGroupSchema = z.enum([
  'all',
  'close',
  'paternal',
  'maternal',
  'internal',
  'extended',
])

export const createEventSchema = z.object({
  type: eventTypeSchema,
  title: z.string().min(1).max(200),
  date: z.string().datetime(),
  description: z.string().max(2000).optional(),
  visibility: visibilitySchema.default('FAMILY'),
  branchLabel: z.string().max(50).optional(),
  taggedPersonIds: z.array(z.string()).default([]),
  notifyGroup: notifyGroupSchema.default('all'),
})

export const updateEventSchema = createEventSchema.partial()

export const listEventsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  year: z.coerce.number().int().optional(),
})

export type EventType = z.infer<typeof eventTypeSchema>
export type Visibility = z.infer<typeof visibilitySchema>
export type NotifyGroup = z.infer<typeof notifyGroupSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type ListEventsInput = z.infer<typeof listEventsSchema>
