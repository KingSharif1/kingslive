import { projectId, dataset } from '@/sanity/env'

export type BlogVideoSource = { src: string; caption?: string }

/** Resolve a Sanity `noteVideo` value (uploaded file or pasted URL) to a playable src. */
export function toBlogVideo(value: unknown): BlogVideoSource | null {
  const v = value as {
    file?: { asset?: { url?: string; _ref?: string } }
    url?: string
    caption?: string
  } | null
  if (!v) return null
  const fileRef = v.file?.asset?.url || v.file?.asset?._ref
  let src: string | null = null
  if (fileRef) src = sanityFileSrc(fileRef)
  else if (typeof v.url === 'string' && v.url.trim()) src = v.url.trim()
  if (!src) return null
  return { src, caption: v.caption }
}

/** `file-<hash>-<ext>` → https://cdn.sanity.io/files/<pid>/<ds>/<hash>.<ext> */
export function sanityFileSrc(ref: string): string | null {
  if (ref.startsWith('http')) return ref
  const pid = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || projectId
  const ds = process.env.NEXT_PUBLIC_SANITY_DATASET || dataset
  const m = ref.match(/^file-(.+)-([a-z0-9]+)$/i)
  if (!m) return null
  return `https://cdn.sanity.io/files/${pid}/${ds}/${m[1]}.${m[2]}`
}

export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/
  )
  return m ? m[1] : null
}

export function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? m[1] : null
}

/** YouTube/Vimeo → embed URL (their own player). Direct files → null (custom player). */
export function embedUrl(src: string): string | null {
  const yt = youtubeId(src)
  if (yt) return `https://www.youtube.com/embed/${yt}?rel=0`
  const vm = vimeoId(src)
  if (vm) return `https://player.vimeo.com/video/${vm}`
  return null
}

export function fmtTime(t: number): string {
  if (!Number.isFinite(t) || t < 0) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
