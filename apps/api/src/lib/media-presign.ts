import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { r2, R2_BUCKET } from './r2.js'

export const PRESIGN_TTL = 600

export function mediaExtAndType(mimeType: string): { ext: string; type: 'PHOTO' | 'VIDEO' } {
  const ext = mimeType.startsWith('video/')
    ? 'mp4'
    : mimeType === 'image/webp'
      ? 'webp'
      : mimeType === 'image/png'
        ? 'png'
        : 'jpg'
  const type: 'PHOTO' | 'VIDEO' = mimeType.startsWith('video/') ? 'VIDEO' : 'PHOTO'
  return { ext, type }
}

export async function presignUpload(
  keyPrefix: string,
  opts: { mimeType: string; sizeBytes: number },
) {
  const { ext, type } = mediaExtAndType(opts.mimeType)
  const r2Key = `${keyPrefix}/${randomUUID()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    ContentType: opts.mimeType,
    ContentLength: opts.sizeBytes,
  })

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: PRESIGN_TTL })
  return { uploadUrl, r2Key, type, expiresIn: PRESIGN_TTL }
}

export async function deleteMediaObject(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
}
