import { dataset, projectId } from '@/sanity/env'

const REF = /^image-([a-f\d]+)-(\d+x\d+)-(\w+)$/

/** Resolve a Sanity image field (expanded asset or `_ref`) to a CDN URL. */
export function sanityImageSrc(value?: {
  asset?: { url?: string; _ref?: string }
}): string | null {
  const raw = value?.asset?.url || value?.asset?._ref
  if (!raw) return null
  if (raw.startsWith('http')) return raw
  const match = raw.match(REF)
  const pid = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || projectId
  const ds = process.env.NEXT_PUBLIC_SANITY_DATASET || dataset
  if (match) {
    const [, hash, dimensions, extension] = match
    return `https://cdn.sanity.io/images/${pid}/${ds}/${hash}-${dimensions}.${extension}`
  }
  return `https://cdn.sanity.io/images/${pid}/${ds}/${raw.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp').replace('-gif', '.gif')}`
}
