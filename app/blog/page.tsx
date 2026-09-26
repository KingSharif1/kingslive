'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BlogNav } from '@/components/BlogNav'
import { BlogLikeButton } from '@/components/BlogLikeButton'
import BlogDrift from '@/components/blog/BlogDrift'
import BlogCursor from '@/components/blog/BlogCursor'
import { usePortfolioTheme } from '@/components/usePortfolioTheme'
import { cn } from '@/lib/utils'
import { getProjectById } from '@/lib/portfolio-projects'
import type { BlogPost } from '@/lib/sanity-queries'

function formatWhen(createdAt: string) {
  const d = new Date(createdAt)
  return {
    year: d.getFullYear(),
    short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    long: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

const BOOK_CLOTHS = ['#6d2f2c', '#3f5544', '#2f3e56', '#8a6a2f', '#5d4a36', '#503a52', '#2f5d5a']

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function FeaturedCard({ post }: { post: BlogPost }) {
  const when = formatWhen(post.created_at)
  return (
    <article className="blog-featured group">
      <span className="blog-featured__stamp" aria-hidden="true">
        Latest
      </span>
      {post.cover_image ? (
        <Link href={`/blog/${post.slug}`} className="blog-featured__art" aria-label={post.title}>
          <span className="blog-featured__art-inner">
            <Image
              src={post.cover_image}
              alt=""
              fill
              quality={85}
              className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              sizes="(min-width: 768px) 45vw, 100vw"
            />
          </span>
        </Link>
      ) : null}
      <div className="min-w-0">
        {post.tags[0] && <span className="blog-tagtab">{post.tags[0]}</span>}
        <h2 className="font-fraunces text-3xl sm:text-4xl leading-[1.06] tracking-tight mt-4">
          <Link href={`/blog/${post.slug}`} className="blog-title-link">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 text-[11px] font-mono tracking-[0.22em] uppercase text-[var(--blog-muted)]">
          {when.long}
        </p>
        <p className="mt-4 text-[var(--blog-muted)] leading-relaxed text-[15px] sm:text-base">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-6 pt-4">
          <Link
            href={`/blog/${post.slug}`}
            className="text-[11px] font-mono tracking-[0.22em] uppercase text-[var(--blog-ink)]"
          >
            Open →
          </Link>
          <BlogLikeButton postId={post.id} />
        </div>
      </div>
    </article>
  )
}

function Book({ post }: { post: BlogPost }) {
  const h = hashStr(post.id)
  const height = 188 + (h % 62)
  const width = 46 + (h % 16)
  const cloth = BOOK_CLOTHS[h % BOOK_CLOTHS.length]
  const when = formatWhen(post.created_at)
  return (
    <div
      className="book"
      style={{ height, '--book-cloth': cloth } as CSSProperties}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="book-spine"
        style={{ width }}
        aria-label={`${post.title} — open this volume`}
      >
        <span className="book-spine__tag">{post.tags[0] || 'Notes'}</span>
        <span className="book-spine__title">{post.title}</span>
        <span className="book-spine__year">{when.year}</span>
      </Link>
      <div className="book-card">
        {post.cover_image ? (
          <span className="book-card__thumb">
            <Image
              src={post.cover_image}
              alt=""
              fill
              quality={70}
              sizes="270px"
              className="object-cover object-center"
            />
          </span>
        ) : null}
        {post.tags[0] && <span className="blog-tagtab">{post.tags[0]}</span>}
        <p className="book-card__title">
          <Link href={`/blog/${post.slug}`} tabIndex={-1}>
            {post.title}
          </Link>
        </p>
        <p className="book-card__date">{when.long}</p>
        <p className="book-card__excerpt">{post.excerpt}</p>
        <div className="book-card__actions">
          <Link
            href={`/blog/${post.slug}`}
            tabIndex={-1}
            className="text-[11px] font-mono tracking-[0.22em] uppercase text-[var(--blog-ink)]"
          >
            Open →
          </Link>
          <BlogLikeButton postId={post.id} />
        </div>
      </div>
    </div>
  )
}

export default function BlogPage() {
  const { isDark, toggleTheme } = usePortfolioTheme()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setActiveTag(params.get('tag'))
    setActiveProjectId(params.get('project'))
    fetch('/api/blog/notes')
      .then((r) => r.json())
      .then((d) => setPosts(Array.isArray(d.posts) ? d.posts : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((post) => post.tags))),
    [posts]
  )

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return posts.filter((post) => {
      if (activeTag && !post.tags.includes(activeTag)) return false
      if (activeProjectId && post.relatedProjectId !== activeProjectId) return false
      if (q) {
        const hay = `${post.title} ${post.excerpt} ${post.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [posts, activeTag, activeProjectId, searchQuery])

  const activeProject = activeProjectId ? getProjectById(activeProjectId) : undefined

  const isBrowsing = activeTag !== null || activeProjectId !== null || searchQuery.trim() !== ''
  const featured = !loading && !isBrowsing && filteredPosts.length > 0 ? filteredPosts[0] : null
  const rest = featured ? filteredPosts.slice(1) : filteredPosts

  const shelves = useMemo(() => {
    const byYear = new Map<number, BlogPost[]>()
    for (const post of rest) {
      const y = new Date(post.created_at).getFullYear()
      if (!byYear.has(y)) byYear.set(y, [])
      byYear.get(y)!.push(post)
    }
    return [...byYear.entries()].sort((a, b) => b[0] - a[0])
  }, [rest])

  return (
    <div className={cn('blog-world blog-library', isDark && 'dark')}>
      <BlogNav isDark={isDark} toggleTheme={toggleTheme} />
      <BlogDrift ink={isDark ? '#f0e6d8' : '#1a1612'} />
      <BlogCursor />

      <header className="relative px-5 sm:px-10 lg:px-16 pt-8 pb-10 overflow-hidden">
        <p className="blog-bleed" aria-hidden>
          cerebration
        </p>
        <div className="relative -mt-4 sm:-mt-8 max-w-2xl">
          <p className="text-[11px] font-mono tracking-[0.32em] uppercase text-[var(--blog-muted)] mb-4">
            Cerebration · The Library · {new Date().getFullYear()}
          </p>
          <h1 className="font-fraunces text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[var(--blog-ink)]">
            The Library
          </h1>
          <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-[var(--blog-muted)] max-w-lg">
            Every volume I&apos;ve written — building, breaking, and learning,
            bound and shelved. Pull one down and open it up.
          </p>
          <label className="mt-8 block max-w-sm">
            <span className="sr-only">Search the library</span>
            <input
              type="search"
              placeholder="Search the stacks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-[var(--blog-ink)]/25 py-2 text-sm outline-none placeholder:text-[var(--blog-muted)] focus:border-[var(--blog-bloom)]"
            />
          </label>
        </div>
      </header>

      <div className="px-5 sm:px-10 lg:px-16 pb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono tracking-[0.18em] uppercase">
        <span className="text-[var(--blog-muted)]/70 mr-1 hidden sm:inline">Subjects</span>
        <button
          type="button"
          onClick={() => {
            setActiveTag(null)
            setActiveProjectId(null)
          }}
          className={
            activeTag === null && !activeProjectId
              ? 'text-[var(--blog-ink)]'
              : 'text-[var(--blog-muted)] hover:text-[var(--blog-ink)]'
          }
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            className={
              activeTag === tag
                ? 'text-[var(--blog-ink)]'
                : 'text-[var(--blog-muted)] hover:text-[var(--blog-ink)]'
            }
          >
            {tag}
          </button>
        ))}
        {activeProject && (
          <button
            type="button"
            onClick={() => setActiveProjectId(null)}
            className="text-[var(--blog-bloom)]"
          >
            {activeProject.title} ×
          </button>
        )}
      </div>

      <main className="px-5 sm:px-10 lg:px-16 pb-24">
        {loading ? (
          <div aria-busy="true" aria-label="Loading the library">
            {[0, 1, 2].map((i) => (
              <article
                key={i}
                className="blog-volume py-8 sm:py-10 border-t border-[var(--blog-ink)]/10"
              >
                <div className="blog-spine wait-copy">····</div>
                <div className="space-y-3 max-w-xl">
                  <div className="wait-block h-3 w-16" />
                  <div className="wait-block h-9 w-4/5" />
                  <div className="wait-block h-4 w-full" />
                  <div className="wait-block h-4 w-2/3" />
                </div>
                <div className="blog-volume__art wait-block" />
              </article>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-[var(--blog-muted)]">
            {posts.length === 0 ? 'The shelves are empty.' : 'Nothing on these shelves matches.'}
          </div>
        ) : (
          <>
            {featured && <FeaturedCard post={featured} />}
            {shelves.map(([year, books]) => (
              <section key={year} className="shelf" aria-label={`Volumes from ${year}`}>
                <div className="shelf-head">
                  <span className="shelf-plate">{year}</span>
                </div>
                <div className="shelf-books">
                  {books.map((post) => (
                    <Book key={post.id} post={post} />
                  ))}
                </div>
                <div className="shelf-board" aria-hidden="true" />
              </section>
            ))}
            <p className="blog-index__colophon" aria-hidden="true">
              — that&apos;s everything in the library —
            </p>
          </>
        )}
      </main>
    </div>
  )
}
