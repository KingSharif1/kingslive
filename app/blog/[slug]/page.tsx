"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, Calendar, User, Tag, Heart, Share2, Clock, ArrowLeft, Copy, Check, X, Twitter, Facebook, Linkedin } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ScrollProgress from "@/app/components/ScrollProgress"
import { getPostBySlug, BlogPost } from "@/lib/sanity-queries"
import { PortableText, PortableTextComponents } from '@portabletext/react'
import ReactMarkdown from 'react-markdown'
import { supabase } from "@/lib/supabase"
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
      <blockquote className="border-l-4 border-[var(--ring)] pl-6 my-6 italic text-[var(--muted-foreground)]">
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
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {children}
        </a>
      )
    },
  },
  types: {
    image: ({ value }) => {
      // Handle different possible image structures from Sanity
      const imageUrl = value?.asset?.url || value?.asset?._ref
      if (!imageUrl) {
        console.log('Image value:', value)
        return null
      }
      
      // If it's a reference, we need to construct the URL
      const src = imageUrl.startsWith('http') 
        ? imageUrl 
        : `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'py58y528'}/${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}/${imageUrl.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp').replace('-gif', '.gif')}`
      
      return (
        <figure className="my-8">
          <div className="relative w-full rounded-lg overflow-hidden">
            <Image
              src={src}
              alt={value.alt || 'Blog post image'}
              width={800}
              height={600}
              className="w-full h-auto object-cover"
              priority={false}
              unoptimized={!src.startsWith('http')}
            />
          </div>
          {value.caption && (
            <figcaption className="text-center text-sm text-[var(--muted-foreground)] mt-3 italic font-open-sans">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
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
      const styles: Record<string, { bg: string; border: string; icon: string }> = {
        tip: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: '💡' },
        warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', icon: '⚠️' },
        info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'ℹ️' },
        pro: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: '🚀' },
      }
      const style = styles[value?.type] || styles.info
      
      // Nested components for callout content
      const calloutComponents: PortableTextComponents = {
        block: {
          normal: ({ children }) => <p className="text-[var(--foreground)] font-open-sans leading-relaxed mb-2 last:mb-0">{children}</p>,
          h3: ({ children }) => <h3 className="text-lg font-semibold font-fraunces mb-2 text-[var(--foreground)]">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-semibold font-fraunces mb-2 text-[var(--foreground)]">{children}</h4>,
        },
        list: {
          bullet: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          number: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        },
        listItem: {
          bullet: ({ children }) => <li className="text-[var(--foreground)] font-open-sans">{children}</li>,
          number: ({ children }) => <li className="text-[var(--foreground)] font-open-sans">{children}</li>,
        },
        marks: {
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
          link: ({ value: linkValue, children }) => (
            <a href={linkValue?.href} className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
        },
        types: {
          image: ({ value: imgValue }) => {
            const imgUrl = imgValue?.asset?.url || imgValue?.asset?._ref
            if (!imgUrl) return null
            const src = imgUrl.startsWith('http') 
              ? imgUrl 
              : `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'py58y528'}/${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}/${imgUrl.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp').replace('-gif', '.gif')}`
            return (
              <div className="my-2 rounded overflow-hidden">
                <Image src={src} alt={imgValue?.alt || ''} width={600} height={400} className="w-full h-auto" />
              </div>
            )
          },
        },
      }
      
      return (
        <div className={`my-6 p-4 rounded-lg border ${style.bg} ${style.border}`}>
          <div className="flex gap-3">
            <span className="text-xl flex-shrink-0">{style.icon}</span>
            <div className="flex-1">
              {Array.isArray(value?.content) ? (
                <PortableText value={value.content} components={calloutComponents} />
              ) : (
                <p className="text-[var(--foreground)] font-open-sans leading-relaxed">{value?.content}</p>
              )}
            </div>
          </div>
        </div>
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
async function incrementViewCount(postId: string): Promise<void> {
  try {
    // Check if we've already counted this view in this session
    const viewKey = `viewed_${postId}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(viewKey)) {
      return // Already counted this session
    }

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

    // Mark as viewed in this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(viewKey, 'true')
    }
  } catch (err) {
    console.error('Error incrementing view count:', err)
  }
}

async function fetchLikesFromDB(postId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('blog_post_analytics')
      .select('likes')
      .eq('post_id', postId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching likes:', error)
      return 0
    }
    return data?.likes || 0
  } catch (err) {
    console.error('Error fetching likes:', err)
    return 0
  }
}

async function incrementLikeInDB(postId: string): Promise<number> {
  try {
    // First try to get existing record
    const { data: existing } = await supabase
      .from('blog_post_analytics')
      .select('likes')
      .eq('post_id', postId)
      .single()

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('blog_post_analytics')
        .update({ likes: (existing.likes || 0) + 1, last_updated: new Date().toISOString() })
        .eq('post_id', postId)
        .select('likes')
        .single()
      
      if (error) throw error
      return data?.likes || (existing.likes || 0) + 1
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('blog_post_analytics')
        .insert({ post_id: postId, likes: 1, view_count: 0 })
        .select('likes')
        .single()
      
      if (error) throw error
      return data?.likes || 1
    }
  } catch (err) {
    console.error('Error incrementing like:', err)
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
      className={`flex items-center gap-2 rounded-full font-medium transition-all ${isLarge ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
        } ${sessionLikes > 0
          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-red-50 dark:hover:bg-red-900/20'
        } ${(!canLike || isLoading) && 'opacity-60 cursor-default'}`}
    >
      <div className={isAnimating ? 'animate-pulse' : ''}>
        <Heart
          className={`transition-colors ${isLarge ? 'w-5 h-5' : 'w-4 h-4'} ${sessionLikes > 0
            ? 'fill-red-500 text-red-500'
            : ''
            }`}
        />
      </div>
      <span>{isLoading ? '...' : likes} {isLarge && !isLoading && (likes === 1 ? 'like' : 'likes')}</span>
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
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      copied 
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

// Calculate reading time
function getReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export default function BlogPostPage() {
  const params = useParams()
  const [post, setPost] = useState<SlugPagePost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const slug = params.slug as string

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true)
      try {
        const sanityPost = await getPostBySlug(slug)
        console.log('Fetched post from Sanity:', sanityPost?.title)
        setPost(sanityPost)
        
        // Track view count (uses slug as post_id)
        if (sanityPost) {
          incrementViewCount(slug)
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-24 bg-[var(--muted)] rounded" />
            <div className="h-12 w-3/4 bg-[var(--muted)] rounded" />
            <div className="h-6 w-1/2 bg-[var(--muted)] rounded" />
            <div className="space-y-3 pt-8">
              <div className="h-4 w-full bg-[var(--muted)] rounded" />
              <div className="h-4 w-full bg-[var(--muted)] rounded" />
              <div className="h-4 w-2/3 bg-[var(--muted)] rounded" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Post not found</h1>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors text-[var(--foreground)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>
        </div>
      </main>
    )
  }

  const readingTime = getReadingTime(post.markdownContent || '')

  return (
    <>
      <ScrollProgress />
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        title={post.title} 
        url={typeof window !== 'undefined' ? window.location.href : ''} 
      />
      <main className="min-h-screen bg-[var(--background)]">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--background)]/80 border-b border-[var(--border)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <Link
                href="/blog"
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--secondary)] hover:bg-[var(--accent)] transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
                <span className="text-sm font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
                  Blog
                </span>
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors"
                >
                  <Share2 className="w-4 h-4 text-[var(--muted-foreground)]" />
                </button>
                <LikeButton postId={post.id} initialLikes={post.views || 0} />
              </div>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Meta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)] mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {readingTime} min read
              </span>
            </div>

            {/* Title */}
            <h1 className="font-fraunces text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg sm:text-xl text-[var(--muted-foreground)] leading-relaxed font-open-sans">
              {post.excerpt}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {post.tags.map(tag => (
                  <Link
                    href={`/blog?tag=${tag}`}
                    key={tag}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--secondary)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2 }}
            className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-10"
          />

          {/* Content */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {post.content ? (
              <PortableText value={post.content} components={portableTextComponents} />
            ) : post.markdownContent ? (
              <ReactMarkdown>{post.markdownContent}</ReactMarkdown>
            ) : (
              <p>No content available.</p>
            )}
          </div>

          {/* Footer Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 pt-8 border-t border-[var(--border)]"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-[var(--muted-foreground)] mb-2">Enjoyed this article?</p>
                <p className="text-lg font-medium text-[var(--foreground)]">Show some love!</p>
              </div>
              <LikeButton postId={post.id} initialLikes={post.views || 0} size="large" />
            </div>
          </motion.div>

          {/* Comments Section */}
          <Comments postId={post.id} autoApproveHours={24} />
        </article>
      </main>
    </>
  )
}
