import { Queue } from 'bullmq'
import { redis } from './redis.js'

const connection = { connection: redis }
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnFail: false,
}

export const thumbnailQueue = new Queue('thumbnail', { ...connection, defaultJobOptions })
export const memoryRecallQueue = new Queue('memory-recall', { ...connection, defaultJobOptions })
export const notificationFanout = new Queue('notif-fanout', { ...connection, defaultJobOptions })
export const storyExpiryQueue = new Queue('story-expiry', { ...connection, defaultJobOptions })
