import { createClient } from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'py58y528' // Placeholder, replace after init
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = '2025-12-10' // Updated to match Sanity Studio version

// Client for production reads - uses CDN for fast cached responses
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Enable CDN for faster cached responses
  stega: { enabled: false },
  perspective: 'published',
})

// Client for preview/draft content - bypasses CDN
export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Revalidation time for ISR (in seconds)
export const REVALIDATE_TIME = 60 // Revalidate every 60 seconds
