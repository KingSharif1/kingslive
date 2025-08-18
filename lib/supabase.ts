import { createClient } from '@supabase/supabase-js'

// These values should be stored in environment variables in production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
