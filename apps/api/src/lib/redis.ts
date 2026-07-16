// ioredis exports a class both as default and as `Redis` named export;
// import the class explicitly to satisfy both ESM and CJS resolution.
import { Redis } from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck:     false,
})
