import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

// GET /api/blog/stats - Get blog stats (protected)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get total posts count
    const { count: totalPosts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
    
    if (postsError) throw postsError
    
    // Get published posts count
    const { count: publishedPosts, error: publishedError } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('published', true)
    
    if (publishedError) throw publishedError
    
    // Views functionality removed - column doesn't exist in database
    const totalViews = 0
    
    // Get recent posts instead of most viewed (views column removed)
    const { data: popularPosts, error: popularError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (popularError) throw popularError
    
    return NextResponse.json({
      totalPosts,
      publishedPosts,
      totalViews,
      popularPosts
    })
  } catch (error: any) {
    console.error('Error fetching blog stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blog stats' },
      { status: 500 }
    )
  }
}

// POST /api/blog/stats/view - Record a post view (disabled - views column removed)
export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    
    // Views functionality disabled - column doesn't exist in database
    return NextResponse.json({ success: true, views: 0 })
  } catch (error: any) {
    console.error('Error in view endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
