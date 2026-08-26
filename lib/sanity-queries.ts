import { PortableTextBlock } from '@portabletext/types'
import { client } from './sanity'

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60 * 1000

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
  publishedAt?: string
  _createdAt?: string
  published?: boolean | null
  excerpt?: string
  body?: PortableTextBlock[]
  relatedProjectId?: string | null
}

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
  relatedProjectId?: string
}

function extractPlainText(blocks?: PortableTextBlock[]): string {
  if (!blocks?.length) return ''
  const parts: string[] = []
  for (const block of blocks) {
    if (block._type !== 'block' || !('children' in block) || !Array.isArray(block.children)) continue
    for (const child of block.children) {
      if (child && typeof child === 'object' && 'text' in child && typeof child.text === 'string') {
        parts.push(child.text)
      }
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function excerptFromBody(blocks?: PortableTextBlock[], max = 180): string {
  const text = extractPlainText(blocks)
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`
}

export function countPortableTextWords(blocks?: PortableTextBlock[]): number {
  const text = extractPlainText(blocks)
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function transformPost(post: SanityPost): BlogPost {
  const excerpt = (post.excerpt || '').trim() || excerptFromBody(post.body)
  return {
    id: post._id,
    title: post.title || 'Untitled',
    slug: post.slug?.current || '',
    author: post.author?.name || 'King Sharif',
    cover_image: post.mainImage?.asset?.url,
    tags: post.categories?.map((c) => c.title).filter(Boolean) || [],
    created_at: post.publishedAt || post._createdAt || new Date().toISOString(),
    // Legacy docs may omit `published` — treat undefined/null as published
    published: post.published !== false,
    excerpt,
    content: post.body,
    views: 0,
    relatedProjectId: post.relatedProjectId || undefined,
  }
}

const LIST_PROJECTION = `
  _id,
  title,
  slug,
  "author": author->{ name },
  mainImage { asset->{ url }, alt },
  "categories": categories[]->{ title },
  publishedAt,
  _createdAt,
  published,
  excerpt,
  relatedProjectId,
  body
`

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const cacheKey = 'published_posts'
  const cached = cache.get(cacheKey) as { data: BlogPost[]; timestamp: number } | undefined

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  // Show posts unless explicitly unpublished. Order by publish date, then created.
  const query = `*[_type == "post" && (!defined(published) || published == true)] | order(coalesce(publishedAt, _createdAt) desc) {
    ${LIST_PROJECTION}
  }`

  try {
    const posts = await client.fetch<SanityPost[]>(query)
    const transformed = posts.map(transformPost).filter((p) => Boolean(p.slug))
    cache.set(cacheKey, { data: transformed, timestamp: Date.now() })
    return transformed
  } catch (error) {
    console.error('Error fetching posts from Sanity:', error)
    return cached?.data || []
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const cacheKey = `post_${slug}`
  const cached = cache.get(cacheKey) as { data: BlogPost | null; timestamp: number } | undefined

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const query = `*[_type == "post" && slug.current == $slug && (!defined(published) || published == true)][0] {
    ${LIST_PROJECTION},
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
    cache.set(cacheKey, { data: transformed, timestamp: Date.now() })
    return transformed
  } catch (error) {
    console.error('Error fetching post from Sanity:', error)
    return cached?.data || null
  }
}

export async function getPostsByRelatedProject(projectId: string): Promise<BlogPost[]> {
  const query = `*[_type == "post" && relatedProjectId == $projectId && (!defined(published) || published == true)] | order(coalesce(publishedAt, _createdAt) desc) {
    ${LIST_PROJECTION}
  }`
  try {
    const posts = await client.fetch<SanityPost[]>(query, { projectId })
    return posts.map(transformPost)
  } catch (error) {
    console.error('Error fetching posts by project:', error)
    return []
  }
}

export async function getAllPosts(): Promise<SanityPost[]> {
  const query = `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    slug,
    publishedAt,
    _createdAt,
    excerpt,
    published,
    relatedProjectId
  }`

  try {
    return await client.fetch<SanityPost[]>(query)
  } catch (error) {
    console.error('Error fetching all posts from Sanity:', error)
    return []
  }
}

export async function searchPosts(searchQuery: string): Promise<BlogPost[]> {
  const cacheKey = `search_${searchQuery.toLowerCase()}`
  const cached = cache.get(cacheKey) as { data: BlogPost[]; timestamp: number } | undefined

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const query = `*[_type == "post" && (!defined(published) || published == true) && (
    title match $search ||
    excerpt match $search ||
    pt::text(body) match $search
  )] | order(coalesce(publishedAt, _createdAt) desc) {
    ${LIST_PROJECTION}
  }`

  try {
    const posts = await client.fetch<SanityPost[]>(query, { search: `*${searchQuery}*` })
    const transformed = posts.map(transformPost)
    cache.set(cacheKey, { data: transformed, timestamp: Date.now() })
    return transformed
  } catch (error) {
    console.error('Error searching posts in Sanity:', error)
    return cached?.data || []
  }
}
