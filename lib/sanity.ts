import { createClient } from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'py58y528' // Placeholder, replace after init
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = '2025-12-10' // Updated to match Sanity Studio version

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Set to false for real-time updates while editing
})
