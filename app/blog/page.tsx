"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Search, Heart, ArrowUpRight, Sparkles, Bird } from "lucide-react"
import ScrollProgress from "@/app/components/ScrollProgress"
import { ThemeToggle } from "@/components/theme-toggle"
import { getPublishedPosts, searchPosts, BlogPost } from "@/lib/sanity-queries"

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Session-based like storage
const getLikeKey = (postId: string) => `blog_like_${postId}`
const getSessionLikes = (postId: string): number => {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(getLikeKey(postId)) || '0', 10)
}
const setSessionLikes = (postId: string, count: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getLikeKey(postId), count.toString())
  }
}

// Lazy-load Supabase functions to avoid bundling in main chunk
async function fetchLikesFromDB(postId: string): Promise<number> {
  const { fetchLikesFromDB: fetch } = await import('@/lib/supabase-lazy')
  return fetch(postId)
}

async function incrementLikeInDB(postId: string): Promise<number> {
  const { incrementLikeInDB: increment } = await import('@/lib/supabase-lazy')
  return increment(postId)
}

// Like button component - fetches real likes from database
function LikeButton({ postId }: { postId: string }) {
  const [likes, setLikes] = useState(0)
  const [sessionLikes, setSessionLikesState] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const MAX_SESSION_LIKES = 5

  useEffect(() => {
    setSessionLikesState(getSessionLikes(postId))
    // Fetch actual likes from database
    fetchLikesFromDB(postId).then(dbLikes => {
      setLikes(dbLikes)
      setIsLoading(false)
    })
  }, [postId])

  const handleLike = useCallback(async () => {
    if (sessionLikes >= MAX_SESSION_LIKES) return

    setIsAnimating(true)
    setLikes(prev => prev + 1)
    const newSessionLikes = sessionLikes + 1
    setSessionLikesState(newSessionLikes)
    setSessionLikes(postId, newSessionLikes)

    // Update database
    const newLikes = await incrementLikeInDB(postId)
    if (newLikes > 0) {
      setLikes(newLikes)
    }

    setTimeout(() => setIsAnimating(false), 300)
  }, [sessionLikes, postId])

  const canLike = sessionLikes < MAX_SESSION_LIKES

  return (
    <button
      onClick={handleLike}
      disabled={!canLike || isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${canLike && !isLoading
        ? 'hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer active:scale-95'
        : 'opacity-50 cursor-default'
        }`}
    >
      <span className={`transition-transform ${isAnimating ? 'scale-125' : 'scale-100'}`}>
        <Heart
          className={`w-4 h-4 transition-colors ${sessionLikes > 0
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 dark:text-gray-500'
            }`}
        />
      </span>
      <span className="text-gray-600 dark:text-gray-400">{isLoading ? '...' : likes}</span>
    </button>
  )
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const postsPerPage = 6

  // Debounce search to prevent excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true)
      try {
        let fetchedPosts: BlogPost[]

        if (debouncedSearch) {
          fetchedPosts = await searchPosts(debouncedSearch)
        } else {
          fetchedPosts = await getPublishedPosts()
        }

        if (activeTag) {
          fetchedPosts = fetchedPosts.filter(post =>
            post.tags.includes(activeTag)
          )
        }

        setPosts(fetchedPosts)
      } catch (error) {
        console.error('Error fetching posts:', error)
        setPosts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [debouncedSearch, activeTag])

  const allTags = Array.from(new Set(posts.flatMap(post => post.tags)))
  const filteredPosts = activeTag
    ? posts.filter(post => post.tags.includes(activeTag))
    : posts
  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

  return (
    <>
      <ScrollProgress />
      <main className="min-h-screen bg-[var(--background)]">
        {/* Minimal Sticky Header */}
        <header className="sticky top-0 z-50 transition-all duration-300 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo / Home */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              title="Return Home"
            >
              <div className="p-1.5 rounded-lg bg-[var(--foreground)] text-[var(--background)] group-hover:rotate-12 transition-transform">
                <Bird className="w-5 h-5" />
              </div>
              <span className="font-fraunces font-bold text-lg tracking-tight hidden sm:block">The Chronicle</span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className={`relative flex items-center transition-all ${isSearchFocused ? 'w-full sm:w-64' : 'w-auto'}`}>
                <div className={`flex items-center ${isSearchFocused ? 'absolute left-0 w-full' : ''}`}>
                  {isSearchFocused ? (
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => !searchQuery && setIsSearchFocused(false)}
                        autoFocus
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-full bg-[var(--secondary)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--ring)] outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsSearchFocused(true)}
                      className="p-2 rounded-full hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {!isSearchFocused && (
                <>
                  <div className="w-px h-6 bg-[var(--border)] mx-1" />
                  <ThemeToggle />
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
          <div className=" mx-auto text-center">

            <div className="mb-2">
              <span className="text-xs font-open-sans uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Est. {new Date().getFullYear()} • Digital Edition</span>
            </div>
            <h1 className="font-fraunces text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--foreground)] mb-2 leading-tight">
              The Chronicle
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 bg-[var(--border)]"></div>
              <span className="font-fraunces text-sm italic text-[var(--muted-foreground)]">All the Code That's Fit to Ship</span>
              <div className="h-px w-16 bg-[var(--border)]"></div>
            </div>

            <p className="text-lg sm:text-xl text-[var(--muted-foreground)] mb-8 max-w-2xl mx-auto font-open-sans">
              Chronicles of code, tales of innovation, and adventures in the digital frontier.
            </p>

            {/* Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${activeTag === null
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
                  }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${activeTag === tag
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-6 animate-pulse bg-[var(--secondary)]"
                  >
                    <div className="h-4 rounded w-1/4 mb-4 bg-[var(--muted)]" />
                    <div className="h-6 rounded w-3/4 mb-3 bg-[var(--muted)]" />
                    <div className="h-4 rounded w-full mb-2 bg-[var(--muted)]" />
                    <div className="h-4 rounded w-5/6 bg-[var(--muted)]" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[var(--muted-foreground)] text-lg">No posts found. Add content in Sanity Studio.</p>
                <a
                  href="/studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-6 py-3 rounded-full bg-[var(--foreground)] text-[var(--background)] font-medium"
                >
                  Open Sanity Studio →
                </a>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPosts.map((post) => (
                    <article
                      key={post.id}
                      className="group relative rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden hover:border-[var(--ring)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <Link href={`/blog/${post.slug}`} className="block h-full flex flex-col">
                        {/* Image */}
                        {post.cover_image && (
                          <div className="relative w-full aspect-video overflow-hidden bg-[var(--muted)]">
                            <Image
                              src={post.cover_image}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        )}

                        <div className="p-6 flex-1 flex flex-col">
                          {/* Date */}
                          <time className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                            {new Date(post.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </time>

                          {/* Title */}
                          <h2 className="font-fraunces text-xl font-bold text-[var(--foreground)] mt-3 mb-2 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                            {post.title}
                          </h2>

                          {/* Excerpt */}
                          <p className="text-sm text-[var(--muted-foreground)] line-clamp-3 mb-4 font-open-sans leading-relaxed flex-1">
                            {post.excerpt}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-1 rounded-md bg-[var(--secondary)] text-[var(--muted-foreground)]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] mt-auto">
                            <span className="text-xs text-[var(--muted-foreground)]">
                              By {post.author}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-medium text-[var(--foreground)] group-hover:gap-2 transition-all">
                              Read
                              <ArrowUpRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Like Button */}
                      <div className="absolute top-4 right-4">
                        <LikeButton postId={post.id} />
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-full bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5 text-[var(--foreground)]" />
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${currentPage === i + 1
                            ? 'bg-[var(--foreground)] text-[var(--background)]'
                            : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                            }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-full bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5 text-[var(--foreground)]" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
