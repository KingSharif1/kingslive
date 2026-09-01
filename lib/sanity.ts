import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

/**
 * Browser/server Sanity client for public blog reads.
 * Always prefer NEXT_PUBLIC_SANITY_* env vars; sanity/env.ts holds the real project fallback.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  stega: { enabled: false },
  perspective: 'published',
})

export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  perspective: 'previewDrafts',
  stega: { enabled: false },
})

export { projectId, dataset, apiVersion }
export { sanityImageSrc } from '@/lib/sanity-image'

/** ISR / client cache window (seconds) */
export const REVALIDATE_TIME = 60
