import { client } from './sanity'
import { PortableTextBlock } from '@portabletext/types'

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

// Fetch all published posts
export async function getPublishedPosts(): Promise<BlogPost[]> {
  // Updated query to fetch all posts - the 'published' field might not be set
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
    console.log('Fetched posts from Sanity:', posts.length)
    return posts.map(transformPost)
  } catch (error) {
    console.error('Error fetching posts from Sanity:', error)
    return []
  }
}

// Fetch a single post by slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
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
      }
    }
  }`
  
  try {
    console.log('Searching for post with slug:', slug)
    const post = await client.fetch<SanityPost | null>(query, { slug })
    console.log('Found post:', post?.title, 'with slug:', post?.slug)
    return post ? transformPost(post) : null
  } catch (error) {
    console.error('Error fetching post from Sanity:', error)
    return null
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

// Search posts
export async function searchPosts(searchQuery: string): Promise<BlogPost[]> {
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
    console.log('Search results from Sanity:', posts.length)
    return posts.map(transformPost)
  } catch (error) {
    console.error('Error searching posts in Sanity:', error)
    return []
  }
}
