"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Calendar, User, Tag } from "lucide-react"
import GrandChronicLeLogo from "@/app/components/GrandChronicLeLogo"
import ScrollProgress from "@/app/components/ScrollProgress"
import CommentSection from "@/app/components/CommentSection"
import { supabase } from "@/lib/supabase"
import { DataService } from "@/app/ctroom/services/dataService"
import TiptapRenderer from '@/app/components/TiptapRenderer'

interface BlogPost {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  author: string
  slug: string
  tags: string[]
  published: boolean
  views: number
  cover_image?: string
  excerpt: string
}



export default function BlogPostPage() {
  const params = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const slug = params.slug as string

  const fetchPost = async () => {
    setIsLoading(true)
    try {
      // Check if this is a preview request
      const urlParams = new URLSearchParams(window.location.search)
      const isPreview = urlParams.get('preview') === 'true'
      
      // Fetch from Supabase directly
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
      
      // Only filter by published status if not in preview mode
      if (!isPreview) {
        query = query.eq('published', true)
      }
      
      const { data, error } = await query.single()
      
      if (error) {
        throw error
      }
      
      if (data) {
        setPost(data)
        
        // Record view after a short delay to ensure it's a real view
        setTimeout(async () => {
          try {
            // Use DataService to increment post views
            await DataService.incrementPostViews(data.id)
            
            // Get updated analytics
            const analytics = await DataService.getPostAnalytics(data.id)
            
            // Update local post data with view count from analytics
            if (analytics) {
              setPost(prev => prev ? {
                ...prev, 
                views: analytics.view_count || 0
              } : null)
            }
          } catch (err) {
            console.error('Error recording view:', err)
          }
        }, 5000) // Wait 5 seconds before counting the view
      } else {
        // Post not found
        setPost(null)
      }
    } catch (error) {
      console.error('Error fetching blog post:', error)
      // Post not found or error occurred
      setPost(null)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchPost()
    
    // Optimized real-time subscription for post updates
    const subscription = supabase
      .channel(`post-${slug}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'blog_posts',
          filter: `slug=eq.${slug}`
        },
        (payload) => {
          // Optimistically update post data instead of refetching
          if (payload.new && typeof payload.new === 'object') {
            const updatedPost = payload.new as BlogPost
            setPost(updatedPost)
          } else {
            // Fallback to refetch if payload is incomplete
            fetchPost()
          }
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-6 light-mode-text dark:text-white">Post Not Found</h1>
          {/* Newspaper Article Body */}
          <div className="prose prose-lg max-w-none text-amber-900 dark:text-amber-100 dark:prose-invert" style={{fontFamily: 'serif'}}>
            <div className="first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-amber-800 dark:first-letter:text-amber-200">
              <p className="my-4 light-mode-text dark:text-gray-300">The post you're looking for doesn't exist.</p>
            </div>
          </div>
          <Link href="/blog">
            <button className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
              Back to Blog
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // Function to render markdown-like content
  const renderContent = (content: string) => {
    // Very basic markdown parsing for demonstration
    // In a real app, use a proper markdown parser like remark or marked
    const lines = content.split('\n')
    
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold my-6 light-mode-text dark:text-white">{line.substring(2)}</h1>
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold my-5 light-mode-text dark:text-white">{line.substring(3)}</h2>
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-bold my-4 light-mode-text dark:text-white">{line.substring(4)}</h3>
      }
      
      // Code blocks
      if (line.startsWith('```')) {
        return null // Skip code block markers
      }
      
      // Regular paragraph
      if (line.trim() !== '') {
        return <p key={index} className="my-4 light-mode-text dark:text-gray-300">{line}</p>
      }
      
      return null
    }).filter(Boolean)
  }

  return (
    <>
      <ScrollProgress />
      <section className="py-20 newspaper-bg bg-amber-50 dark:bg-amber-950/10 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* News Coo Newspaper Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-8"
        >
          {/* Back Button */}
          <div className="mb-4">
            <Link 
              href="/blog"
              className="inline-flex items-center gap-2 px-4 py-2 text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Back to The Grand Chronicle</span>
            </Link>
          </div>
          
          {/* Newspaper Header */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border-4 border-double border-amber-800 dark:border-amber-200 p-6 shadow-lg rounded-xl newspaper-load">
            {/* Top Banner */}
            <div className="text-center border-b-2 border-amber-800 dark:border-amber-200 pb-4 mb-4 ">
              <div className="flex items-center justify-center gap-4 mb-2">
                {/* News Coo Bird Icon */}
                <div className="w-8 h-8 bg-amber-800 dark:bg-amber-200 rounded-full flex items-center justify-center">
                  <span className="text-amber-50 dark:text-amber-900 text-sm font-bold">🕊</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-amber-900 dark:text-amber-100 tracking-wider ink-bleed" style={{fontFamily: 'serif'}}>
                  DAILY CHRONICLE
                </h1>
                <div className="w-8 h-8 bg-amber-800 dark:bg-amber-200 rounded-full flex items-center justify-center">
                  <span className="text-amber-50 dark:text-amber-900 text-sm font-bold">🕊</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-8 text-xs text-amber-700 dark:text-amber-300 font-semibold">
                <span>EST. 1522</span>
                <span>•</span>
                <span>GRAND LINE EDITION</span>
                <span>•</span>
                <span>{post?.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'RECENT'}</span>
              </div>
            </div>
            
            {/* Article Header */}
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-2xl md:text-3xl font-black text-amber-900 dark:text-amber-100 mb-4 leading-tight uppercase tracking-wide ink-bleed"
                style={{fontFamily: 'serif'}}
              >
                {post?.title || 'BREAKING NEWS'}
              </motion.h1>
              
              {/* Byline */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center justify-center gap-4 text-sm text-amber-700 dark:text-amber-300 font-medium"
              >
                <span>By {post?.author || 'KING SHARIF'}</span>
                <span>•</span>
                <span>Special Correspondent</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Newspaper Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-amber-50/90 dark:bg-amber-950/10 border-2 border-amber-200 dark:border-amber-800 shadow-lg p-8 mb-8 rounded-xl min-h-screen"
          style={{backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'}}
        >
          
          {/* Newspaper Article Meta */}
          <div className="border-b-2 border-amber-300 dark:border-amber-700 pb-4 mb-6 ">
            <div className="flex flex-wrap items-center justify-between text-sm text-amber-700 dark:text-amber-300 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 px-3 py-1 bg-amber-200 dark:bg-amber-800 rounded">
                  <Calendar className="w-3 h-3" />
                  <span className="font-semibold">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-amber-200 dark:bg-amber-800 rounded">
                  <User className="w-3 h-3" />
                  <span className="font-semibold uppercase">{post.author}</span>
                </div>
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <Tag className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  {post.tags.map(tag => (
                    <Link 
                      href={`/blog?tag=${tag}`} 
                      key={tag}
                      className="px-2 py-1 bg-amber-800 dark:bg-amber-200 text-amber-50 dark:text-amber-900 text-xs font-bold uppercase rounded hover:bg-amber-900 dark:hover:bg-amber-100 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-8 min-h-screen">
            <TiptapRenderer content={post.content} className="h-full" />
          </div>
        </motion.div>
        
        {/* Comment Section */}
        <div className="bg-amber-50/90 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700 shadow-lg p-8 rounded-xl">
          <div className="border-b-2 border-amber-400 dark:border-amber-600 pb-4 mb-6">
            <h3 className="text-xl font-black text-amber-900 dark:text-amber-100 uppercase" style={{fontFamily: 'serif'}}>Reader's Letters</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 italic">Share your thoughts on this chronicle</p>
          </div>
          <CommentSection postId={post.id} />
        </div>
        </div>
      </section>
    </>
  )
}
