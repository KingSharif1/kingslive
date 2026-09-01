"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Heart, Share2, Copy, Check, X, Twitter, Facebook, Linkedin, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ScrollProgress from "@/app/components/ScrollProgress"
import { BlogNav } from "@/components/BlogNav"
import { usePortfolioTheme } from "@/components/usePortfolioTheme"
import { BlogPost, countPortableTextWords } from "@/lib/sanity-queries"
import { getProjectById } from "@/lib/portfolio-projects"
import { PortableText, PortableTextComponents } from '@portabletext/react'
import ReactMarkdown from 'react-markdown'
import { supabase } from "@/lib/supabase"
import { BlogPhotos, toBlogPhotos } from "@/components/blog/BlogPhotos"
import { BlogTable } from "@/components/blog/BlogTable"
import { BlogFaq } from "@/components/blog/BlogFaq"
import Comments from "./Comments"

// PortableText components for proper rendering
const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => <h1 className="text-4xl font-bold font-fraunces mt-12 mb-6 text-[var(--foreground)]">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-bold font-fraunces mt-10 mb-5 text-[var(--foreground)]">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-semibold font-fraunces mt-8 mb-4 text-[var(--foreground)]">{children}</h3>,
    h4: ({ children }) => <h4 className="text-xl font-semibold font-fraunces mt-6 mb-3 text-[var(--foreground)]">{children}</h4>,
    h5: ({ children }) => <h5 className="text-lg font-semibold font-fraunces mt-5 mb-2 text-[var(--foreground)]">{children}</h5>,
    h6: ({ children }) => <h6 className="text-base font-semibold font-fraunces mt-4 mb-2 text-[var(--foreground)]">{children}</h6>,
    normal: ({ children }) => <p className="text-base leading-relaxed mb-6 text-[var(--foreground)] font-open-sans">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-[var(--blog-bloom)] pl-6 py-2 my-6 italic text-xl text-[var(--blog-ink)]">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc list-outside ml-6 mb-6 space-y-2">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-6 space-y-2">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="text-[var(--foreground)] leading-relaxed font-open-sans">{children}</li>,
    number: ({ children }) => <li className="text-[var(--foreground)] leading-relaxed font-open-sans">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold text-[var(--foreground)]">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-[var(--secondary)] px-2 py-1 rounded text-sm font-mono text-[var(--foreground)]">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className="text-[var(--blog-bloom)] underline decoration-from-font underline-offset-4"
        >
          {children}
        </a>
      )
    },
  },
  types: {
    image: ({ value }) => <BlogPhotos images={toBlogPhotos(value)} />,
    photos: ({ value }) => (
      <BlogPhotos images={toBlogPhotos(value?.images)} caption={value?.caption} />
    ),
    imageRow: ({ value }) => (
      <BlogPhotos images={toBlogPhotos(value?.images)} caption={value?.caption} />
    ),
    table: ({ value }) => (
      <BlogTable col1={value?.col1} col2={value?.col2} rows={value?.rows} caption={value?.caption} />
    ),
    noteTable: ({ value }) => (
      <BlogTable col1={value?.col1} col2={value?.col2} rows={value?.rows} caption={value?.caption} />
    ),
    faq: ({ value }) => <BlogFaq heading={value?.heading} items={value?.items} />,
    code: ({ value }) => (
      <div className="my-6 rounded-lg overflow-hidden border border-[var(--border)]">
        {/* Header with language/filename */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--secondary)] border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <span className="text-xs font-mono text-[var(--muted-foreground)] ml-2">
              {value?.filename || value?.language || 'code'}
            </span>
          </div>
          {value?.language && (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent)] text-[var(--muted-foreground)]">
              {value.language}
            </span>
          )}
        </div>
        {/* Code content */}
        <pre className="bg-[var(--card)] p-4 overflow-x-auto">
          <code className="text-sm font-mono text-[var(--foreground)] leading-relaxed">
            {value?.code}
          </code>
        </pre>
      </div>
    ),
    callout: ({ value }) => {
      const calloutComponents: PortableTextComponents = {
        block: {
          normal: ({ children }) => <p className="font-open-sans leading-relaxed mb-2 last:mb-0">{children}</p>,
        },
        marks: {
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => <code className="font-mono text-[0.9em]">{children}</code>,
          link: ({ value: linkValue, children }) => (
            <a href={linkValue?.href} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
        },
        types: {
          image: ({ value: imgValue }) => <BlogPhotos images={toBlogPhotos(imgValue)} />,
        },
      }

      const kicker = value?.title || value?.type || 'Note'

      return (
        <aside className="blog-aside">
          {kicker ? <p className="blog-aside__kicker">{kicker}</p> : null}
          {Array.isArray(value?.content) ? (
            <PortableText value={value.content} components={calloutComponents} />
          ) : (
            <p className="font-open-sans leading-relaxed">{value?.content}</p>
          )}
        </aside>
      )
    },
  },
}

// Extended BlogPost type for slug page (includes content)
interface SlugPagePost extends BlogPost {
  markdownContent?: string
}

// Sample blog posts - fallback when Sanity has no content
const SAMPLE_POSTS: SlugPagePost[] = [
  {
    id: "1",
    title: "Building a Portfolio with Next.js and TypeScript",
    markdownContent: `# Building a Portfolio with Next.js and TypeScript

This guide walks you through creating a stunning portfolio website using modern web technologies.

## Why Next.js?

Next.js provides an excellent developer experience with features like:
- **Server-side rendering** for better SEO
- **Static site generation** for blazing-fast load times
- **API routes** for backend functionality
- **Built-in TypeScript support**

## Getting Started

First, create a new Next.js project with TypeScript:

\`\`\`bash
npx create-next-app@latest my-portfolio --typescript
\`\`\`

## Styling with Tailwind CSS

Tailwind CSS gives us utility-first CSS that's perfect for rapid development. Install it with:

\`\`\`bash
npm install -D tailwindcss postcss autoprefixer
\`\`\`

## Conclusion

With Next.js and TypeScript, you can build professional portfolio websites that are fast, accessible, and maintainable.`,
    excerpt: "Learn how I built this portfolio website using Next.js, TypeScript, and Tailwind CSS with a retro macOS aesthetic.",
    created_at: "2025-08-10T12:00:00Z",
    author: "King Sharif",
    slug: "building-portfolio-nextjs-typescript",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    published: true,
    views: 124
  },
  {
    id: "2",
    title: "Integrating AI Assistants with Hugging Face",
    markdownContent: `# Integrating AI Assistants with Hugging Face

Learn how to add AI-powered features to your web applications.

## Introduction

AI assistants are becoming essential for modern web applications. Hugging Face provides easy-to-use APIs for adding AI capabilities.

## Setting Up

Create an API route in Next.js to handle AI requests securely.

## Conclusion

With Hugging Face and Next.js, adding AI to your projects has never been easier.`,
    excerpt: "How to add an AI assistant to your website using Hugging Face's inference API and Next.js API routes.",
    created_at: "2025-08-05T15:30:00Z",
    author: "King Sharif",
    slug: "integrating-ai-assistants-huggingface",
    tags: ["AI", "Hugging Face", "Next.js"],
    published: true,
    views: 87
  },
  {
    id: "3",
    title: "Creating Animated UI Components with Framer Motion",
    markdownContent: `# Creating Animated UI Components with Framer Motion

A deep dive into creating smooth, interactive animations.

## Why Framer Motion?

Framer Motion is a production-ready motion library for React that makes creating animations simple.

## Basic Animations

Start with simple hover and tap animations to make your UI feel alive.

## Advanced Techniques

Learn about variants, gestures, and layout animations for complex interactions.`,
    excerpt: "A deep dive into creating smooth, interactive UI components using Framer Motion in React applications.",
    created_at: "2025-07-28T08:45:00Z",
    author: "King Sharif",
    slug: "animated-ui-components-framer-motion",
    tags: ["Framer Motion", "React", "Animation"],
    published: true,
    views: 203
  }
]

// Session-based like storage (to limit likes per session)
const getLikeKey = (postId: string) => `blog_like_${postId}`
const getSessionLikes = (postId: string): number => {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(getLikeKey(postId)) || '0', 10)
}
const setSessionLikesStorage = (postId: string, count: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getLikeKey(postId), count.toString())
  }
}

// Database functions for views and likes (using blog_post_analytics table)
// Fire-and-forget view tracking - doesn't block render
function trackViewCount(postId: string): void {
  // Check if we've already counted this view in this session
  const viewKey = `viewed_${postId}`
  if (typeof window !== 'undefined' && sessionStorage.getItem(viewKey)) {
    return // Already counted this session
  }

  // Mark as viewed immediately to prevent duplicate calls
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(viewKey, 'true')
  }

  // Fire and forget - use async IIFE
  (async () => {
    try {
      const { data: existing } = await supabase
        .from('blog_post_analytics')
        .select('view_count')
        .eq('post_id', postId)
        .single()

      if (existing) {
        await supabase
          .from('blog_post_analytics')
          .update({
            view_count: (existing.view_count || 0) + 1,
            last_updated: new Date().toISOString()
          })
          .eq('post_id', postId)
      } else {
        await supabase
          .from('blog_post_analytics')
          .insert({ post_id: postId, view_count: 1, likes: 0 })
      }
    } catch (err) {
      console.error('Error tracking view:', err)
    }
  })()
}

async function fetchLikesFromDB(postId: string): Promise<number> {
  try {
    const res = await fetch(`/api/blog/likes?postId=${encodeURIComponent(postId)}`)
    const data = await res.json()
    return typeof data.likes === 'number' ? data.likes : 0
  } catch {
    return 0
  }
}

async function incrementLikeInDB(postId: string): Promise<number> {
  try {
    const res = await fetch('/api/blog/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
    const data = await res.json()
    return typeof data.likes === 'number' ? data.likes : 0
  } catch {
    return 0
  }
}

// Like button component with database connection
function LikeButton({ postId, initialLikes = 0, size = 'default' }: { postId: string; initialLikes?: number; size?: 'default' | 'large' }) {
  const [likes, setLikes] = useState(initialLikes)
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

    // Optimistic update
    setLikes(prev => prev + 1)
    const newSessionLikes = sessionLikes + 1
    setSessionLikesState(newSessionLikes)
    setSessionLikesStorage(postId, newSessionLikes)

    // Update database
    const newLikes = await incrementLikeInDB(postId)
    if (newLikes > 0) {
      setLikes(newLikes)
    }

    setTimeout(() => setIsAnimating(false), 300)
  }, [sessionLikes, postId])

  const canLike = sessionLikes < MAX_SESSION_LIKES
  const isLarge = size === 'large'

  return (
    <button
      onClick={handleLike}
      disabled={!canLike || isLoading}
      className={`flex flex-col items-center gap-1 rounded-full font-medium transition-all ${isLarge
        ? 'px-6 py-3 text-base flex-row gap-2'
        : 'p-3 hover:bg-[var(--secondary)]'
        } ${sessionLikes > 0 && !isLarge
          ? 'text-red-600 dark:text-red-400'
          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        } ${(!canLike || isLoading) && 'opacity-60 cursor-default'}`}
      title={isLarge ? '' : 'Like'}
    >
      <div className={isAnimating ? 'animate-pulse' : ''}>
        <Heart
          className={`transition-colors ${isLarge ? 'w-5 h-5' : 'w-5 h-5'} ${sessionLikes > 0
            ? 'fill-red-500 text-red-500'
            : ''
            }`}
        />
      </div>
      <span className={isLarge ? 'inline' : 'hidden'}>{isLoading ? '...' : likes} {isLarge && !isLoading && (likes === 1 ? 'like' : 'likes')}</span>
      {/* <span className="lg:hidden text-xs">{likes}</span> */}
      {!canLike && isLarge && (
        <span className="text-xs opacity-60">(max reached)</span>
      )}
    </button>
  )
}

// Share Modal Component
function ShareModal({ isOpen, onClose, title, url }: { isOpen: boolean; onClose: () => void; title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: 'hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: 'hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600',
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 mx-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-fraunces font-semibold text-[var(--foreground)]">Share this article</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[var(--secondary)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--muted-foreground)]" />
                </button>
              </div>

              {/* Social Share Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--secondary)] transition-all ${link.color}`}
                  >
                    <link.icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{link.name}</span>
                  </a>
                ))}
              </div>

              {/* Copy Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--muted-foreground)]">Or copy link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--secondary)] text-sm text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${copied
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
                      }`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function BlogPostPage() {
  const params = useParams()
  const { isDark, mounted, toggleTheme } = usePortfolioTheme()
  const [post, setPost] = useState<SlugPagePost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const slug = params.slug as string

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/blog/note/${encodeURIComponent(slug)}`, { cache: 'no-store' })
        const data = await res.json()
        const sanityPost = data?.post ?? null
        setIsPreview(Boolean(data?.preview))
        console.log('Fetched post from Sanity:', sanityPost?.title)
        setPost(sanityPost)

        // Track view count (fire-and-forget, uses slug as post_id)
        if (sanityPost) {
          trackViewCount(slug)
        }
      } catch (error) {
        console.error('Error fetching post:', error)
        setPost(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  const handleShare = () => {
    setShowShareModal(true)
  }

  if (isLoading || !mounted) {
    return (
      <main className="blog-world flex min-h-screen items-center justify-center font-mono text-xs tracking-widest uppercase">
        Opening…
      </main>
    )
  }

  if (!post) {
    return (
      <main className="blog-world min-h-screen">
        <BlogNav isDark={isDark} toggleTheme={toggleTheme} />
        <div className="px-5 sm:px-10 lg:px-16 py-24">
          <h1 className="font-fraunces text-4xl mb-6">This volume isn’t on the shelf.</h1>
          <Link href="/blog" className="text-[11px] font-mono tracking-[0.22em] uppercase">
            ← Notes
          </Link>
        </div>
      </main>
    )
  }

  const relatedProject = post.relatedProjectId ? getProjectById(post.relatedProjectId) : undefined
  const wordCount = post.content
    ? countPortableTextWords(post.content)
    : (post.markdownContent || '').split(/\s+/).filter(Boolean).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className={`blog-world blog-world--note${isDark ? ' dark' : ''}`}>
      {isPreview ? (
        <p className="blog-preview-flag">
          Draft preview — this is not the public page.{' '}
          <a href="/api/draft-mode/disable">Exit preview</a>
        </p>
      ) : null}
      <BlogNav isDark={isDark} toggleTheme={toggleTheme} />
      <ScrollProgress />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={post.title}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <main className="pb-28">
        <aside className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-30 flex-col gap-6 text-[var(--blog-muted)]">
          <Link href="/blog" className="text-[10px] font-mono tracking-[0.22em] uppercase hover:text-[var(--blog-ink)]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Notes
          </Link>
          <button type="button" onClick={handleShare} className="hover:text-[var(--blog-ink)]" title="Share">
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })
              window.dispatchEvent(new Event('open-comments'))
            }}
            className="hover:text-[var(--blog-ink)]"
            title="Comments"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </aside>

        {post.cover_image && (
          <div className="blog-cover-bleed relative mb-10">
            <Image
              src={post.cover_image}
              alt=""
              fill
              quality={85}
              priority
              className="object-cover object-center"
              sizes="(min-width: 672px) 42rem, 100vw"
            />
          </div>
        )}

        <article className="blog-read pt-4 sm:pt-8">
          <p className="text-[11px] font-mono tracking-[0.22em] uppercase text-[var(--blog-muted)] mb-5">
            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            <span className="mx-3">·</span>
            {readingTime} min
            {post.author ? <span className="mx-3">·</span> : null}
            {post.author}
          </p>

          <h1 className="font-fraunces text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg sm:text-xl leading-relaxed text-[var(--blog-muted)] mb-8">
              {post.excerpt}
            </p>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 mb-10 text-[11px] font-mono tracking-[0.18em] uppercase text-[var(--blog-muted)]">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/blog?tag=${tag}`} className="hover:text-[var(--blog-ink)]">
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {relatedProject && (
            <Link
              href={relatedProject.liveUrl || '/#projects'}
              className="inline-block mb-10 text-[11px] font-mono tracking-[0.18em] uppercase text-[var(--blog-bloom)]"
            >
              Project · {relatedProject.title}
            </Link>
          )}

          <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-fraunces prose-p:text-[var(--blog-ink)]">
            {post.content ? (
              <PortableText value={post.content} components={portableTextComponents} />
            ) : post.markdownContent ? (
              <ReactMarkdown>{post.markdownContent}</ReactMarkdown>
            ) : (
              <p>No content available.</p>
            )}
          </div>

          <div className="mt-16 pt-8 border-t border-[var(--blog-ink)]/10 flex items-center justify-between gap-4">
            <Link href="/blog" className="text-[11px] font-mono tracking-[0.22em] uppercase">
              ← Shelf
            </Link>
            <LikeButton postId={post.id} initialLikes={post.views || 0} size="large" />
          </div>

          <Suspense fallback={<div className="mt-16 h-24" />}>
            <Comments postId={post.id} autoApproveHours={24} />
          </Suspense>
        </article>
      </main>
    </div>
  )
}
