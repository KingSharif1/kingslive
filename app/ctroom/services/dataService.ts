import { supabase } from "@/lib/supabase"
import { BlogPost, Comment, Category, PostAnalytics } from "../types"

export class DataService {
  // Blog Posts
  static async fetchPosts(page = 0, limit = 10): Promise<{data: BlogPost[], count: number}> {
    try {
      const { data, error, count } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })
        .range(page * limit, (page + 1) * limit - 1)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data: data || [], count: count || 0 }
    } catch (error) {
      console.error('Error in fetchPosts:', error)
      throw error
    }
  }

  // Keep the old method for backward compatibility
  static async fetchAllPosts(): Promise<BlogPost[]> {
    try {
      // Use manual join approach since Supabase join is failing
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (postsError) throw postsError
      //console.log('Posts data:', postsData)
      
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('blog_post_analytics')
        .select('post_id, view_count, comment')
      
      if (analyticsError) throw analyticsError
      //console.log('Analytics data:', analyticsData)
      
      // Manual join - this is more reliable
      const transformedData = postsData?.map(post => {
        const analytics = analyticsData?.find(a => a.post_id === post.id)
        return {
          ...post,
          views: analytics?.view_count || 0,
          comment_count: analytics?.comment || 0
        }
      }) || []
      //console.log('Transformed data:', transformedData)
      return transformedData
    } catch (error) {
      console.error('Error in fetchAllPosts:', error)
      throw error
    }
  }

  static async createPost(post: Partial<BlogPost>): Promise<BlogPost> {
    try {
      const slug = post.title
        ?.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-') || ''

      const postToCreate = {
        ...post,
        slug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([postToCreate])
        .select()
        .single()
      
      if (error) throw error
      if (!data) throw new Error('Failed to create post: No data returned')
      return data
    } catch (error) {
      console.error('Error in createPost:', error)
      throw error
    }
  }

  static async updatePost(id: string, post: Partial<BlogPost>): Promise<BlogPost> {
    try {
      // Filter out any fields that don't exist in the database schema
      const { views, comment_count, analytics, ...validPost } = post as any
      
      // Debug logging
      console.log('Original post object keys:', Object.keys(post))
      console.log('Filtered post object keys:', Object.keys(validPost))
      
      const updatedPost = {
        ...validPost,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updatedPost)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      if (!data) throw new Error('Failed to update post: No data returned')
      return data
    } catch (error) {
      console.error('Error in updatePost:', error)
      throw error
    }
  }

  static async deletePost(id: string): Promise<void> {
    try {
      // First delete related analytics records
      const { error: analyticsError } = await supabase
        .from('blog_post_analytics')
        .delete()
        .eq('post_id', id)
      
      if (analyticsError) {
        console.error('Error deleting post analytics:', analyticsError)
        // Continue with post deletion even if analytics deletion fails
      }
      
      // Then delete comments related to this post
      const { error: commentsError } = await supabase
        .from('blog_comments')
        .delete()
        .eq('post_id', id)
      
      if (commentsError) {
        console.error('Error deleting post comments:', commentsError)
        // Continue with post deletion even if comments deletion fails
      }
      
      // Finally delete the post itself
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error in deletePost:', error)
      throw error
    }
  }

  // Comments
  static async fetchComments(): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('blog_comments')
      .select(`
        *,
        blog_posts(title)
      `)
      .eq('archived', false) // Only fetch non-archived comments
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async fetchArchivedComments(): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('blog_comments')
      .select(`
        *,
        blog_posts(title)
      `)
      .eq('archived', true) // Only fetch archived comments
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async approveComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_comments')
      .update({ approved: true })
      .eq('id', id)
    
    if (error) throw error
  }

  static async archiveComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_comments')
      .update({ archived: true })
      .eq('id', id)
    
    if (error) throw error
  }

  static async unarchiveComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_comments')
      .update({ archived: false })
      .eq('id', id)
    
    if (error) throw error
  }

  static async deleteComment(id: string): Promise<void> {
    try {
      // First verify we have a session before making the API call
      const { data: { session } } = await supabase.auth.getSession()
      //console.log('Client session check:', { hasSession: !!session, userId: session?.user?.id })
      
      if (!session?.access_token) {
        throw new Error('No active session found. Please sign in again.')
      }
      
      // Use the server-side API endpoint with authorization header
      const response = await fetch('/api/comments/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error deleting comment:', errorData)
        throw new Error(errorData.error || 'Failed to delete comment')
      }
      
      const result = await response.json()
      //console.log('Comment deletion result:', result)
      
      // If we got here, the deletion was successful
      return
    } catch (error) {
      console.error('Error in deleteComment:', error)
      throw error
    }
  }

  // Categories
  static async fetchCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  }

  // Post Analytics
  static async fetchPostAnalytics(): Promise<PostAnalytics[]> {
    const { data, error } = await supabase
      .from('blog_post_analytics')
      .select('*')
    
    if (error) throw error
    return data || []
  }

  static async incrementPostViews(postId: string): Promise<void> {
    try {
      // First check if an analytics record exists for this post
      const { data: existingRecord, error: fetchError } = await supabase
        .from('blog_post_analytics')
        .select('id, view_count')
        .eq('post_id', postId)
        .maybeSingle()
      
      if (fetchError) throw fetchError
      
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('blog_post_analytics')
          .update({ 
            view_count: (existingRecord.view_count || 0) + 1,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
        
        if (updateError) throw updateError
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('blog_post_analytics')
          .insert({
            post_id: postId,
            view_count: 1,
            unique_visitors: 1,
            last_updated: new Date().toISOString()
          })
        
        if (insertError) throw insertError
      }
    } catch (error) {
      console.error('Error incrementing post views:', error)
      throw error
    }
  }

  static async getPostAnalytics(postId: string): Promise<PostAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('blog_post_analytics')
        .select('*')
        .eq('post_id', postId)
        .maybeSingle()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting post analytics:', error)
      return null
    }
  }

  // Analytics
  static async getStats() {
    try {
      const [postsResult, comments, analytics] = await Promise.all([
        DataService.fetchAllPosts().catch(() => []), // Use fetchAllPosts for stats calculation
        DataService.fetchComments().catch(() => []),
        DataService.fetchPostAnalytics().catch(() => [])
      ])

      // Calculate total views from analytics table
      const totalViews = analytics.reduce((sum, analytic) => sum + (analytic.view_count || 0), 0)
      const featuredPosts = postsResult.filter(post => post.featured).length
      const publishedPosts = postsResult.filter(post => post.published).length
      const pendingComments = comments.filter(comment => !comment.approved).length

      return {
        totalPosts: postsResult.length,
        publishedPosts,
        totalComments: comments.length,
        pendingComments,
        totalViews,
        featuredPosts
      }
    } catch (error) {
      console.error('Error getting stats:', error)
      return {
        totalPosts: 0,
        publishedPosts: 0,
        totalComments: 0,
        pendingComments: 0,
        totalViews: 0,
        featuredPosts: 0
      }
    }
  }
}
