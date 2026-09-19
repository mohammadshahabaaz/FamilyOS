// Standalone worker process — the Zomato/WhatsApp pattern: API handles HTTP,
// this handles async work. Started via `npm run worker`, independently of the
// API process. Never import this file from app.ts / index.ts.
import { Worker } from 'bullmq'
import { redis } from './lib/redis.js'
import { memoryRecallQueue, storyExpiryQueue } from './lib/queues.js'
import { processThumbnail } from './jobs/thumbnail.job.js'
import { processMemoryRecall } from './jobs/memory-recall.job.js'
import { processNotificationFanout } from './jobs/notification-fanout.job.js'
import { processStoryExpiry } from './jobs/story-expiry.job.js'

const connection = { connection: redis }

const workers = [
  new Worker('thumbnail', processThumbnail, connection),
  new Worker('memory-recall', processMemoryRecall, connection),
  new Worker('notif-fanout', processNotificationFanout, connection),
  new Worker('story-expiry', processStoryExpiry, connection),
]

for (const worker of workers) {
  worker.on('completed', (job) => {
    console.error(`[worker:${worker.name}] job ${job.id} completed`)
  })
  worker.on('failed', (job, err) => {
    console.error(`[worker:${worker.name}] job ${job?.id} failed`, err)
  })
}

// Repeatable job — fires daily at 08:00 Asia/Karachi, matching FamilyTree's default timezone.
await memoryRecallQueue.add('daily', {}, { repeat: { pattern: '0 8 * * *', tz: 'Asia/Karachi' } })

// Repeatable job — sweeps expired stories every hour.
await storyExpiryQueue.add('hourly', {}, { repeat: { pattern: '0 * * * *' } })

console.error(`[worker] started, listening on queues: ${workers.map((w) => w.name).join(', ')}`)

async function shutdown() {
  console.error('[worker] shutting down...')
  await Promise.all(workers.map((w) => w.close()))
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown()
})
process.on('SIGTERM', () => {
  void shutdown()
})
