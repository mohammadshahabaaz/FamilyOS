import { S3Client } from '@aws-sdk/client-s3'
import { env } from './env.js'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  // Path-style (bucket in the URL path, not a subdomain) works uniformly against
  // both MinIO in local dev and Cloudflare R2 in production — virtual-hosted style
  // would require *.localhost subdomain resolution for MinIO.
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET = env.R2_BUCKET
export const R2_PUBLIC_URL = env.R2_PUBLIC_URL
export const STORAGE_LIMIT_BYTES = env.STORAGE_LIMIT_BYTES
