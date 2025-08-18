"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
    
    // Set up real-time subscription for new blog posts
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
          // When a new post is published, refresh the posts
          fetchPosts()
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
          // When a post is updated, refresh the posts
          fetchPosts()
        }
      )
      .subscribe()
    
    return () => {
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
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 light-mode-text dark:text-white">Blog</h1>
          <p className="text-lg max-w-3xl mx-auto light-mode-text dark:text-gray-300">
            Thoughts, tutorials, and insights on web development, design, and technology
          </p>
          
          {/* Search bar */}
          <div className="max-w-md mx-auto mt-6 mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-10 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Tag filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <button 
              onClick={() => setActiveTag(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTag === null 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All Posts
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTag === tag 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
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
            {/* Blog posts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-2 light-mode-text dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} • {post.author} • {post.views} views
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveTag(tag)
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

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
  )
}
