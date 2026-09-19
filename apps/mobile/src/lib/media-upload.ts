// Shared by CreateEventScreen and CreateStoryScreen — compress once client-side,
// then PUT straight to the presigned R2 URL each screen's own API call obtained.

export async function compressImage(file: File): Promise<Blob> {
  const MAX_PX = 1920
  const QUALITY = 0.82
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image() as HTMLImageElement
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(objectUrl)
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('canvas failed'))),
        'image/jpeg',
        QUALITY,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('load failed'))
    }
    img.src = objectUrl
  })
}

export async function uploadToPresignedUrl(uploadUrl: string, blob: Blob, mimeType: string) {
  await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': mimeType },
  })
}

// Opens the browser's file picker and resolves with the first picked file, or null
// if the user cancels. Mirrors the input-element pattern already used across the app
// (CreateEventScreen, ProfileScreen) — this is a web-only app for now.
export function pickMediaFile(): Promise<File | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null)
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0] ?? null
      resolve(file)
    }
    input.click()
  })
}

// Extracts a JPEG frame from a video file entirely client-side (off-DOM <video> +
// canvas — no server-side ffmpeg needed). Seeks a little past the start since the
// very first frame of many videos is black/blank.
export function extractVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    function cleanup() {
      URL.revokeObjectURL(objectUrl)
    }

    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 4)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        cleanup()
        reject(new Error('canvas context unavailable'))
        return
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      cleanup()
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas failed'))), 'image/jpeg', 0.8)
    }
    video.onerror = () => {
      cleanup()
      reject(new Error('video load failed'))
    }
    video.src = objectUrl
  })
}
