// Lazy-loaded Supabase functions for blog likes
// This file is dynamically imported to avoid bundling Supabase in the main chunk

import { supabase } from './supabase'

export async function fetchLikesFromDB(postId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('blog_post_analytics')
      .select('likes')
      .eq('post_id', postId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return 0
    }
    return data?.likes || 0
  } catch {
    return 0
  }
}

export async function incrementLikeInDB(postId: string): Promise<number> {
  try {
    const { data: existing } = await supabase
      .from('blog_post_analytics')
      .select('likes')
      .eq('post_id', postId)
      .single()

    if (existing) {
      const { data } = await supabase
        .from('blog_post_analytics')
        .update({ likes: (existing.likes || 0) + 1, last_updated: new Date().toISOString() })
        .eq('post_id', postId)
        .select('likes')
        .single()
      return data?.likes || (existing.likes || 0) + 1
    } else {
      const { data } = await supabase
        .from('blog_post_analytics')
        .insert({ post_id: postId, likes: 1, view_count: 0 })
        .select('likes')
        .single()
      return data?.likes || 1
    }
  } catch {
    return 0
  }
}
