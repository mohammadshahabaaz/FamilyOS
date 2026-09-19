import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import type { Job } from 'bullmq'
import { r2, R2_BUCKET } from '../lib/r2.js'
import { db } from '../lib/db.js'

export interface ThumbnailJobData {
  mediaId: string
  r2Key: string
  type: 'PHOTO' | 'VIDEO'
}

const THUMBNAIL_MAX_DIMENSION = 800

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}

export async function processThumbnail(job: Job<ThumbnailJobData>) {
  const { mediaId, r2Key, type } = job.data

  // Video frame extraction needs ffmpeg, not wired yet — mark ready without a
  // thumbnail so the upload flow isn't blocked on an unimplemented step.
  if (type === 'VIDEO') {
    await db.media.update({ where: { id: mediaId }, data: { status: 'READY' } })
    return { mediaId, skipped: 'video' }
  }

  const original = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: r2Key }))
  const buffer = await streamToBuffer(original.Body as NodeJS.ReadableStream)

  const thumbnailBuffer = await sharp(buffer)
    .resize(THUMBNAIL_MAX_DIMENSION, THUMBNAIL_MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer()

  const thumbnailR2Key = r2Key.replace(/\.\w+$/, '') + '-thumb.jpg'

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: thumbnailR2Key,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
    }),
  )

  await db.media.update({
    where: { id: mediaId },
    data: { thumbnailR2Key, status: 'READY' },
  })

  return { mediaId, thumbnailR2Key }
}
