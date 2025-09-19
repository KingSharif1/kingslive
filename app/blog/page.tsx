"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ArrowLeft, Search } from "lucide-react"
import GrandChronicLeLogo from "@/app/components/GrandChronicLeLogo"
import ScrollProgress from "@/app/components/ScrollProgress"
import { supabase } from "@/lib/supabase"

interface BlogPost {
  id: string
  title: string
  excerpt: string
  created_at: string
  updated_at: string
  author: string
  slug: string
  tags: string[]
  published: boolean
  views: number
  cover_image?: string
  content?: string
}

// Sample blog posts for initial display
const SAMPLE_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Building a Portfolio with Next.js and TypeScript",
    excerpt: "Learn how I built this portfolio website using Next.js, TypeScript, and Tailwind CSS with a retro macOS aesthetic.",
    created_at: "2025-08-10T12:00:00Z",
    updated_at: "2025-08-10T12:00:00Z",
    author: "King Sharif",
    slug: "building-portfolio-nextjs-typescript",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    published: true,
    views: 124
  },
  {
    id: "2",
    title: "Integrating AI Assistants with Hugging Face",
    excerpt: "How to add an AI assistant to your website using Hugging Face's inference API and Next.js API routes.",
    created_at: "2025-08-05T15:30:00Z",
    updated_at: "2025-08-06T09:15:00Z",
    author: "King Sharif",
    slug: "integrating-ai-assistants-huggingface",
    tags: ["AI", "Hugging Face", "Next.js"],
    published: true,
    views: 87
  },
  {
    id: "3",
    title: "Creating Animated UI Components with Framer Motion",
    excerpt: "A deep dive into creating smooth, interactive UI components using Framer Motion in React applications.",
    created_at: "2025-07-28T08:45:00Z",
    updated_at: "2025-07-28T08:45:00Z",
    author: "King Sharif",
    slug: "animated-ui-components-framer-motion",
    tags: ["Framer Motion", "React", "Animation"],
    published: true,
    views: 203
  }
]

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const postsPerPage = 6

  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      }
      
      if (activeTag) {
        // This assumes tags are stored as an array in Supabase
        query = query.contains('tags', [activeTag])
      }
      
      const { data, error } = await query
      
      if (error) {
        throw error
      }
      
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      // Fallback to sample data if Supabase query fails
      setPosts(SAMPLE_POSTS)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    
    // Optimized real-time subscription with debouncing
    let updateTimeout: NodeJS.Timeout
    
    const debouncedFetchPosts = () => {
      clearTimeout(updateTimeout)
      updateTimeout = setTimeout(() => {
        fetchPosts()
      }, 500) // Debounce updates by 500ms
    }
    
    const subscription = supabase
      .channel('blog_posts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blog_posts',
          filter: 'published=eq.true'
        },
        (payload) => {
          // Optimistically add new post to avoid full refetch
          if (payload.new && typeof payload.new === 'object') {
            const newPost = payload.new as BlogPost
            setPosts(prevPosts => [newPost, ...prevPosts])
          } else {
            debouncedFetchPosts()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'blog_posts'
        },
        (payload) => {
          // Optimistically update existing post
          if (payload.new && typeof payload.new === 'object') {
            const updatedPost = payload.new as BlogPost
            setPosts(prevPosts => 
              prevPosts.map(post => 
                post.id === updatedPost.id ? updatedPost : post
              )
            )
          } else {
            debouncedFetchPosts()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'blog_posts'
        },
        (payload) => {
          // Optimistically remove deleted post
          if (payload.old && typeof payload.old === 'object') {
            const deletedPost = payload.old as BlogPost
            setPosts(prevPosts => 
              prevPosts.filter(post => post.id !== deletedPost.id)
            )
          } else {
            debouncedFetchPosts()
          }
        }
      )
      .subscribe()
    
    return () => {
      clearTimeout(updateTimeout)
      subscription.unsubscribe()
    }
  }, [searchQuery, activeTag])

  // Get all unique tags
  const allTags = Array.from(
    new Set(posts.flatMap(post => post.tags))
  )

  // Filter posts by tag if active
  const filteredPosts = activeTag 
    ? posts.filter(post => post.tags.includes(activeTag))
    : posts

  // Pagination
  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

  return (
    <>
      <ScrollProgress />
      <section className="py-20 newspaper-bg bg-amber-50 dark:bg-amber-950/10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* The Grand Chronicle Newspaper Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-12"
        >
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">← Back to Home</span>
            </Link>
          </div>
          
          {/* Main Newspaper Header */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border-4 border-double border-amber-800 dark:border-amber-200 p-8 shadow-2xl rounded-xl newspaper-load">
            {/* Top Banner */}
            <div className="text-center border-b-4 border-double border-amber-800 dark:border-amber-200 pb-6 mb-6">
              <div className="flex items-center justify-center gap-6 mb-3">
                {/* Decorative Elements */}
                <div className="w-12 h-12 bg-amber-800 dark:bg-amber-200 rounded-full flex items-center justify-center news-coo-fly">
                  <span className="text-amber-50 dark:text-amber-900 text-lg font-bold">📰</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-amber-900 dark:text-amber-100 tracking-wider ink-bleed" style={{fontFamily: 'serif'}}>
                  THE GRAND CHRONICLE
                </h1>
                <div className="w-12 h-12 bg-amber-800 dark:bg-amber-200 rounded-full flex items-center justify-center news-coo-fly" style={{animationDelay: '0.5s'}}>
                  <span className="text-amber-50 dark:text-amber-900 text-lg font-bold">⚓</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-8 text-sm text-amber-700 dark:text-amber-300 font-bold">
                <span>EST. 1522</span>
                <span>•</span>
                <span>ROYAL EDITION</span>
                <span>•</span>
                <span>VOL. {Math.floor(filteredPosts.length / 10) + 1}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
            
            {/* Subtitle */}
            <div className="text-center">
              <p className="text-lg text-amber-800 dark:text-amber-200 font-semibold italic mb-4" style={{fontFamily: 'serif'}}>
                "Chronicles of Code, Tales of Innovation"
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-amber-700 dark:text-amber-300">
                <span className="px-3 py-1 bg-amber-200 dark:bg-amber-800 rounded font-bold">
                  {filteredPosts.length} ARTICLES PUBLISHED
                </span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Newspaper Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <div className="bg-amber-100 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 p-4 rounded-xl">
              <h3 className="text-center text-amber-900 dark:text-amber-100 font-bold mb-3" style={{fontFamily: 'serif'}}>SEARCH THE ARCHIVES</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search chronicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 rounded-xl py-3 pl-12 pr-12 border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" style={{fontFamily: 'serif'}}
                />
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-amber-600 dark:text-amber-400 rounded-xl" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-3.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 rounded-xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Tag filters */}
          <div className="text-center">
            <h4 className="text-amber-900 dark:text-amber-100 font-bold mb-4" style={{fontFamily: 'serif'}}>BROWSE BY CATEGORY</h4>
            <div className="flex flex-wrap justify-center gap-2">
              <button 
                onClick={() => setActiveTag(null)}
                className={`px-4 py-2 text-sm font-bold uppercase transition-all border-2 rounded-xl ${
                  activeTag === null 
                    ? 'bg-amber-800 dark:bg-amber-200 text-amber-50 dark:text-amber-900 border-amber-900 dark:border-amber-100' 
                    : 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-400 dark:border-amber-600 hover:bg-amber-200 dark:hover:bg-amber-800/30'
                }`}
                style={{fontFamily: 'serif'}}
              >
                All Chronicles
              </button>
              {allTags.map(tag => (
                <button 
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-2 text-sm font-bold uppercase transition-all border-2 rounded-xl ${
                    activeTag === tag 
                      ? 'bg-amber-800 dark:bg-amber-200 text-amber-50 dark:text-amber-900 border-amber-900 dark:border-amber-100' 
                      : 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-400 dark:border-amber-600 hover:bg-amber-200 dark:hover:bg-amber-800/30'
                  }`}
                  style={{fontFamily: 'serif'}}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Newspaper Articles Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12 "
            >
              {currentPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-amber-50 dark:bg-amber-950/20 border-2 rounded-xl border-amber-300 dark:border-amber-700 shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 unfold-animation"
                >
                  {/* Article Header */}
                  <div className="bg-amber-800 dark:bg-amber-200 p-3 border-b-2 border-amber-900 dark:border-amber-100">
                    <div className="flex items-center justify-between text-amber-50 dark:text-amber-900">
                      <span className="text-xs font-bold uppercase tracking-wide">Breaking News</span>
                      <time className="text-xs font-semibold">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h2 className="text-lg font-black mb-3 text-amber-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-200 transition-colors line-clamp-3 leading-tight uppercase ink-bleed" style={{fontFamily: 'serif'}}>
                      {post.title}
                    </h2>
                    
                    <div className="border-l-4 border-amber-600 dark:border-amber-400 pl-3 mb-4">
                      <p className="text-amber-800 dark:text-amber-200 text-sm line-clamp-4 italic" style={{fontFamily: 'serif'}}>
                        {post.excerpt}
                      </p>
                    </div>
                    
                    <div className="border-t-2 border-amber-300 dark:border-amber-700 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-l-xl text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 font-bold uppercase">
                            By {post.author}
                          </span>
                        </div>
                        
                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 font-bold text-sm uppercase transition-colors border-b-2 border-amber-600 dark:border-amber-400 hover:border-amber-800 dark:hover:border-amber-200"
                          style={{fontFamily: 'serif'}}
                        >
                          Read Full Story
                          <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-full ${
                      currentPage === i + 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    } shadow-md`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </section>
    </>
  )
}
