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
  content?: any
  created_at: string
  updated_at?: string
  author: string
  slug: string
  tags: string[]
  published: boolean
  category_id?: string
  featured?: boolean
  meta_description?: string
  meta_keywords?: string[]
  cover_image?: string
  citations?: Citation[]
  is_draft?: boolean
  views?: number
  comment_count?: number
}

export interface Citation {
  id: string
  title: string
  url: string
  author?: string
  publishedDate?: string
  description?: string
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
  comment: number
  referrers?: Record<string, any>
  last_updated: string
}
