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
    
    // Get total views
    const { data: viewsData, error: viewsError } = await supabase
      .from('blog_posts')
      .select('views')
    
    if (viewsError) throw viewsError
    
    const totalViews = viewsData.reduce((sum, post) => sum + (post.views || 0), 0)
    
    // Get most viewed posts
    const { data: popularPosts, error: popularError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, views')
      .order('views', { ascending: false })
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

// POST /api/blog/stats/view - Record a post view
export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    
    // Get current views
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('views')
      .eq('id', postId)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        )
      }
      throw fetchError
    }
    
    // Increment views
    const currentViews = post.views || 0
    const { data, error: updateError } = await supabase
      .from('blog_posts')
      .update({ views: currentViews + 1 })
      .eq('id', postId)
      .select()
    
    if (updateError) throw updateError
    
    return NextResponse.json({ success: true, views: currentViews + 1 })
  } catch (error: any) {
    console.error('Error recording post view:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record post view' },
      { status: 500 }
    )
  }
}
