// Use env vars when available (Next.js), fallback to hardcoded (Sanity hosting)
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-11-12'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'n31jvc6a'
