import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

// GET /api/blog/posts - Get all blog posts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const category = searchParams.get('category')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const offset = (page - 1) * limit
    
    let query = supabase.from('blog_posts').select('*')
    
    // Filter by slug if provided
    if (slug) {
      query = query.eq('slug', slug)
    }
    
    // Search functionality
    if (search) {
      const searchTerm = `%${search}%`
      query = query.or(`title.ilike.${searchTerm},content.ilike.${searchTerm},excerpt.ilike.${searchTerm}`)
    }
    
    // Filter by tag
    if (tag) {
      query = query.contains('tags', [tag])
    }
    
    // Filter by category
    if (category) {
      query = query.eq('category_id', category)
    }
    
    // Only show published posts for public API
    query = query.eq('published', true)
    
    // Add pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .limit(limit)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      posts: data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    })
  } catch (error: any) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

// POST /api/blog/posts - Create a new blog post (protected)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Validate required fields (relaxed for drafts)
    if (!body.is_draft && (!body.title || !body.content)) {
      return NextResponse.json(
        { error: 'Title and content are required for published posts' },
        { status: 400 }
      )
    }
    
    // For drafts, allow saving with just title OR content
    if (body.is_draft && !body.title && !body.content) {
      return NextResponse.json(
        { error: 'At least title or content is required for drafts' },
        { status: 400 }
      )
    }
    
    // Generate slug if not provided
    if (!body.slug) {
      if (body.title) {
        body.slug = body.title
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-')
      } else {
        // For drafts without title, generate a unique slug
        body.slug = `draft-${Date.now()}`
      }
    }
    
    // Set defaults for new post
    const now = new Date().toISOString()
    const newPost = {
      ...body,
      created_at: now,
      updated_at: now,
      views: 0,
      published: body.published ?? false
    }
    
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(newPost)
      .select()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
