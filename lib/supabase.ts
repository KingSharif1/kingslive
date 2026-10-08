import { createBrowserClient } from '@supabase/ssr'

// @supabase/ssr throws at construction when the URL or key is missing.
// Next collects page data by importing route modules, so a missing env
// during `next build` used to fail the build before any request ran.
// Real deploys set both variables; the placeholders are only for that import.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Image upload helper function
export const uploadImage = async (file: File): Promise<string> => {
  console.log('Starting image upload:', file.name, file.size, file.type)
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = `blog-images/${fileName}`

  console.log('Upload path:', filePath)

  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file)

  console.log('Upload result:', { data, error })

  if (error) {
    console.error('Upload error details:', error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath)

  console.log('Generated public URL:', publicUrl)
  return publicUrl
}

// Types for our database tables
export type BlogPost = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  published: boolean
  created_at: string
  updated_at: string
  author: string
  cover_image?: string
  tags: string[]
  views: number
}

export type BlogStats = {
  post_id: string
  views: number
  likes: number
  shares: number
  last_viewed: string
}

export type User = {
  id: string
  email: string
  username: string
  created_at: string
}
