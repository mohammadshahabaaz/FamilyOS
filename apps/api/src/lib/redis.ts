// ioredis exports a class both as default and as `Redis` named export;
// import the class explicitly to satisfy both ESM and CJS resolution.
import { Redis } from 'ioredis'
import { env } from './env.js'

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})
