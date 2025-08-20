import { supabase } from "@/lib/supabase"
import { BlogPost, Comment, Category, PostAnalytics } from "../types"

export class DataService {
  // Blog Posts
  static async fetchPosts(): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error in fetchPosts:', error)
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
        updated_at: new Date().toISOString(),
        views: 0
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
      const updatedPost = {
        ...post,
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

  static async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
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
      const [posts, comments, analytics] = await Promise.all([
        this.fetchPosts().catch(() => []),
        this.fetchComments().catch(() => []),
        this.fetchPostAnalytics().catch(() => [])
      ])

      // Calculate total views from analytics table
      const totalViews = analytics.reduce((sum, analytic) => sum + (analytic.view_count || 0), 0)
      const featuredPosts = posts.filter(post => post.featured).length
      const publishedPosts = posts.filter(post => post.published).length
      const pendingComments = comments.filter(comment => !comment.approved).length

      return {
        totalPosts: posts.length,
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
