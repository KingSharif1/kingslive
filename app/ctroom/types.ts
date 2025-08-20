export interface Category {
  id: string
  name: string
  slug: string
  description: string
}

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  created_at: string
  updated_at: string
  author: string
  slug: string
  tags: string[]
  published: boolean
  views: number
  category_id: string
  featured: boolean
  meta_description: string
  meta_keywords: string[]
}

export interface Comment {
  id: string
  post_id: string
  author: string
  content: string
  created_at: string
  email: string
  approved: boolean
  blog_posts?: {
    title: string
  }
}

export interface PostAnalytics {
  id: string
  post_id: string
  view_count: number
  unique_visitors: number
  avg_time_on_page: number
  bounce_rate: number
  referrers?: Record<string, any>
  last_updated: string
}
