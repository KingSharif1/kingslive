"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Type definitions
export interface Post {
  id?: string
  title: string
  slug: string
  content: string
  excerpt: string
  tags: string[]
  published: boolean
  featured_image?: string
  author_id?: string
  created_at?: string
  updated_at?: string
}

// Get all posts (with optional filtering)
export async function getPosts({ 
  authorId, 
  published, 
  limit = 10, 
  offset = 0 
}: { 
  authorId?: string
  published?: boolean
  limit?: number
  offset?: number
} = {}) {
  // Get Supabase client
  const supabase = createClient()
  
  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (authorId) {
    query = query.eq("author_id", authorId)
  }
  
  if (published !== undefined) {
    query = query.eq("published", published)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching posts:", error)
    throw new Error("Failed to fetch posts")
  }
  
  return data
}

// Get a single post by ID
export async function getPostById(id: string) {
  // Get Supabase client
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) {
    console.error("Error fetching post:", error)
    throw new Error("Failed to fetch post")
  }
  
  return data
}

// Get a single post by slug
export async function getPostBySlug(slug: string) {
  // Get Supabase client
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single()
  
  if (error) {
    console.error("Error fetching post by slug:", error)
    throw new Error("Failed to fetch post")
  }
  
  return data
}

// Create a new post
export async function createPost(post: Post) {
  // Get Supabase client
  const supabase = createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("You must be logged in to create a post")
  }
  
  // Add the author ID
  post.author_id = user.id
  
  const { data, error } = await supabase
    .from("posts")
    .insert([post])
    .select()
    .single()
  
  if (error) {
    console.error("Error creating post:", error)
    throw new Error("Failed to create post")
  }
  
  revalidatePath("/ctroom/dashboard")
  return data
}

// Update an existing post
export async function updatePost(id: string, post: Partial<Post>) {
  // Get Supabase client
  const supabase = createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("You must be logged in to update a post")
  }
  
  // Check if the user owns the post
  const { data: existingPost } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", id)
    .single()
  
  if (!existingPost || existingPost.author_id !== user.id) {
    throw new Error("You don't have permission to update this post")
  }
  
  const { data, error } = await supabase
    .from("posts")
    .update(post)
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating post:", error)
    throw new Error("Failed to update post")
  }
  
  revalidatePath("/ctroom/dashboard")
  revalidatePath(`/ctroom/posts/${post.slug}`)
  return data
}

// Delete a post
export async function deletePost(id: string) {
  // Get Supabase client
  const supabase = createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("You must be logged in to delete a post")
  }
  
  // Check if the user owns the post
  const { data: existingPost } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", id)
    .single()
  
  if (!existingPost || existingPost.author_id !== user.id) {
    throw new Error("You don't have permission to delete this post")
  }
  
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting post:", error)
    throw new Error("Failed to delete post")
  }
  
  revalidatePath("/ctroom/dashboard")
  return { success: true }
}
