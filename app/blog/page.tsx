"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Search, Heart, ArrowUpRight, Sparkles } from "lucide-react"
import ScrollProgress from "@/app/components/ScrollProgress"
import { getPublishedPosts, searchPosts, BlogPost } from "@/lib/sanity-queries"

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

// Like button component
function LikeButton({ postId, initialLikes = 0 }: { postId: string; initialLikes?: number }) {
  const [likes, setLikes] = useState(initialLikes)
  const [sessionLikes, setSessionLikesState] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const MAX_SESSION_LIKES = 5

  useEffect(() => {
    setSessionLikesState(getSessionLikes(postId))
  }, [postId])

  const handleLike = useCallback(() => {
    if (sessionLikes >= MAX_SESSION_LIKES) return

    setIsAnimating(true)
    setLikes(prev => prev + 1)
    const newSessionLikes = sessionLikes + 1
    setSessionLikesState(newSessionLikes)
    setSessionLikes(postId, newSessionLikes)

    setTimeout(() => setIsAnimating(false), 300)
  }, [sessionLikes, postId])

  const canLike = sessionLikes < MAX_SESSION_LIKES

  return (
    <button
      onClick={handleLike}
      disabled={!canLike}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${canLike
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
      <span className="text-gray-600 dark:text-gray-400">{likes}</span>
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

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true)
      try {
        let fetchedPosts: BlogPost[]

        if (searchQuery) {
          fetchedPosts = await searchPosts(searchQuery)
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
  }, [searchQuery, activeTag])

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
        {/* Premium Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--background)]/80 border-b border-[var(--border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <Link
                href="/"
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--secondary)] hover:bg-[var(--accent)] transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
                <span className="text-sm font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
                  Home
                </span>
              </Link>

              {/* Logo/Title */}
              <div className="absolute left-1/2 -translate-x-1/2">
                <h1 className="font-fraunces text-lg sm:text-xl font-bold text-[var(--foreground)] tracking-tight italic">
                  The Chronicle
                </h1>
              </div>

              {/* Search Toggle - Mobile */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsSearchFocused(!isSearchFocused)}
                  className="p-2 rounded-full bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors"
                >
                  <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
                </button>
              </div>

              {/* Search - Desktop */}
              <div className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 pl-10 pr-4 py-2 text-sm rounded-full bg-[var(--secondary)] border border-transparent focus:border-[var(--ring)] focus:bg-[var(--background)] outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Search Expanded */}
            {isSearchFocused && (
              <div className="sm:hidden mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-[var(--secondary)] border border-transparent focus:border-[var(--ring)] outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
          <div className=" mx-auto text-center">

            <div className="mb-2">
              <span className="text-xs font-open-sans uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Est. {new Date().getFullYear()} • Digital Edition</span>
            </div>
            <h1 className="font-fraunces text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--foreground)] mb-2 leading-tight">
              The New World Post
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
                  href="https://sanity.io/manage"
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
                      <Link href={`/blog/${post.slug}`} className="block p-6">
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
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-3 mb-4 font-open-sans leading-relaxed">
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
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                          <span className="text-xs text-[var(--muted-foreground)]">
                            By {post.author}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-medium text-[var(--foreground)] group-hover:gap-2 transition-all">
                            Read
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>

                      {/* Like Button */}
                      <div className="absolute top-4 right-4">
                        <LikeButton postId={post.id} initialLikes={post.views || 0} />
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
