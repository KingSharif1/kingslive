import { client } from './sanity'
import { PortableTextBlock } from '@portabletext/types'

// Simple in-memory cache for client-side
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute cache

// Types matching our Sanity schema
export interface SanityPost {
  _id: string
  title: string
  slug: { current: string }
  author: { name: string } | null
  mainImage?: {
    asset: { url: string }
    alt?: string
  }
  categories?: { title: string }[]
  publishedAt: string
  published: boolean
  excerpt?: string
  body?: PortableTextBlock[]
}

// Transformed post for frontend use
export interface BlogPost {
  id: string
  title: string
  slug: string
  author: string
  cover_image?: string
  tags: string[]
  created_at: string
  published: boolean
  excerpt: string
  content?: PortableTextBlock[]
  views: number
}

// Transform Sanity post to frontend format
export function transformPost(post: SanityPost): BlogPost {
  return {
    id: post._id,
    title: post.title || 'Untitled',
    slug: post.slug?.current || '',
    author: post.author?.name || 'King Sharif',
    cover_image: post.mainImage?.asset?.url,
    tags: post.categories?.map(c => c.title) || [],
    created_at: post.publishedAt || new Date().toISOString(),
    published: post.published ?? false,
    excerpt: post.excerpt || '',
    content: post.body,
    views: 0, // Views will come from Supabase analytics
  }
}

// Fetch all published posts with caching
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const cacheKey = 'published_posts'
  const cached = cache.get(cacheKey)
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const query = `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    "author": author->{ name },
    mainImage { asset->{ url }, alt },
    "categories": categories[]->{ title },
    publishedAt,
    published,
    excerpt
  }`
  
  try {
    const posts = await client.fetch<SanityPost[]>(query)
    const transformed = posts.map(transformPost)
    
    // Cache the result
    cache.set(cacheKey, { data: transformed, timestamp: Date.now() })
    
    return transformed
  } catch (error) {
    console.error('Error fetching posts from Sanity:', error)
    return cached?.data || []
  }
}

// Fetch a single post by slug with caching
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const cacheKey = `post_${slug}`
  const cached = cache.get(cacheKey)
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    "author": author->{ name },
    mainImage { asset->{ url }, alt },
    "categories": categories[]->{ title },
    publishedAt,
    published,
    excerpt,
    body[] {
      ...,
      _type == "image" => {
        ...,
        "asset": asset->{ url, metadata }
      },
      _type == "callout" => {
        ...,
        content[] {
          ...,
          _type == "image" => {
            ...,
            "asset": asset->{ url, metadata }
          }
        }
      }
    }
  }`
  
  try {
    const post = await client.fetch<SanityPost | null>(query, { slug })
    const transformed = post ? transformPost(post) : null
    
    // Cache the result
    cache.set(cacheKey, { data: transformed, timestamp: Date.now() })
    
    return transformed
  } catch (error) {
    console.error('Error fetching post from Sanity:', error)
    return cached?.data || null
  }
}

// Fetch all posts (for admin/ctroom)
export async function getAllPosts(): Promise<SanityPost[]> {
  const query = `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt
  }`
  
  try {
    const posts = await client.fetch<SanityPost[]>(query)
    return posts
  } catch (error) {
    console.error('Error fetching all posts from Sanity:', error)
    return []
  }
}

// Search posts with caching
export async function searchPosts(searchQuery: string): Promise<BlogPost[]> {
  const cacheKey = `search_${searchQuery.toLowerCase()}`
  const cached = cache.get(cacheKey)
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const query = `*[_type == "post" && (
    title match $search || 
    excerpt match $search
  )] | order(publishedAt desc) {
    _id,
    title,
    slug,
    "author": author->{ name },
    mainImage { asset->{ url }, alt },
    "categories": categories[]->{ title },
    publishedAt,
    published,
    excerpt
  }`
  
  try {
    const posts = await client.fetch<SanityPost[]>(query, { search: `*${searchQuery}*` })
    const transformed = posts.map(transformPost)
    
    // Cache the result
    cache.set(cacheKey, { data: transformed, timestamp: Date.now() })
    
    return transformed
  } catch (error) {
    console.error('Error searching posts in Sanity:', error)
    return cached?.data || []
  }
}
