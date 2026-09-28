'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { BlogNav } from '@/components/BlogNav'
import { BlogLikeButton } from '@/components/BlogLikeButton'
import BlogDrift from '@/components/blog/BlogDrift'
import BlogCursor from '@/components/blog/BlogCursor'
import BlogFooter from '@/components/blog/BlogFooter'
import BackToTop from '@/components/blog/BackToTop'
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

function Book({
  post,
  onOpen,
  onRequestClose,
}: {
  post: BlogPost
  onOpen: (post: BlogPost, el: HTMLElement) => void
  onRequestClose: (immediate?: boolean) => void
}) {
  const h = hashStr(post.id)
  const height = 168 + (h % 44)
  const width = 116 + (h % 28)
  const tilt = ((((h >> 3) % 7) - 3) * 1.1).toFixed(1)
  const when = formatWhen(post.created_at)
  return (
    <div
      className="book"
      style={{ height, '--letter-tilt': `${tilt}deg` } as CSSProperties}
      onMouseEnter={(e) => onOpen(post, e.currentTarget)}
      onMouseLeave={() => onRequestClose()}
      onFocus={(e) => onOpen(post, e.currentTarget)}
      onBlur={() => onRequestClose()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onRequestClose(true)
      }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="letter"
        style={{ width }}
        aria-label={`${post.title} — open this letter`}
      >
        <span className="letter__tag">{post.tags[0] || 'Notes'}</span>
        <span className="letter__title">{post.title}</span>
        <span className="letter__meta">{when.year}</span>
        <span className="letter__seal" aria-hidden="true" />
      </Link>
    </div>
  )
}

// Mobile-first catalog row: full title, thumb, excerpt — no popups.
function CatalogRow({ post }: { post: BlogPost }) {
  const when = formatWhen(post.created_at)
  return (
    <Link href={`/blog/${post.slug}`} className="catalog-row">
      <span className="catalog-row__swatch" aria-hidden="true">
        <span>{when.year}</span>
      </span>
      <span className="min-w-0">
        {post.tags[0] && <span className="catalog-row__tag">{post.tags[0]}</span>}
        <span className="catalog-row__title">{post.title}</span>
        <span className="catalog-row__meta">{when.long}</span>
        <span className="catalog-row__excerpt">{post.excerpt}</span>
      </span>
      <span className="catalog-row__go" aria-hidden="true">
        →
      </span>
    </Link>
  )
}

interface InspectState {
  post: BlogPost
  x: number
  y: number
  below: boolean
}

// Broad shelves: each groups related subject tags so the filter stays a short,
// scannable row instead of one pill per tag. A post appears on every shelf that
// contains at least one of its tags.
const SHELVES: { name: string; tags: string[] }[] = [
  { name: 'Robots', tags: ['Roomba', 'Robotics', 'Raspberry Pi', 'ROS 2', 'Arduino', 'SLAM'] },
  { name: 'AI', tags: ['AI', 'Tech'] },
  { name: 'Code', tags: ['Development', 'Next.js'] },
  { name: 'Builds', tags: ['Build Log', 'DIY', 'Portfolio'] },
  { name: 'Life', tags: ['Dev Life'] },
]

export default function BlogPage() {
  const { isDark, toggleTheme } = usePortfolioTheme()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeShelf, setActiveShelf] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [inspect, setInspect] = useState<InspectState | null>(null)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Accept a shelf name directly; map legacy ?tag= values to their shelf.
    const tagParam = params.get('tag')
    if (tagParam) {
      if (SHELVES.some((s) => s.name === tagParam)) setActiveShelf(tagParam)
      else {
        const shelf = SHELVES.find((s) =>
          s.tags.some((t) => t.toLowerCase() === tagParam.toLowerCase())
        )
        setActiveShelf(shelf ? shelf.name : null)
      }
    }
    setActiveProjectId(params.get('project'))
    fetch('/api/blog/notes')
      .then((r) => r.json())
      .then((d) => setPosts(Array.isArray(d.posts) ? d.posts : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const cancelScheduledClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const requestClose = (immediate = false) => {
    cancelScheduledClose()
    if (immediate) {
      setInspect(null)
      return
    }
    closeTimer.current = window.setTimeout(() => setInspect(null), 140)
  }

  const openInspect = (post: BlogPost, el: HTMLElement) => {
    cancelScheduledClose()
    const r = el.getBoundingClientRect()
    const w = 290
    const x = Math.min(Math.max(r.left + r.width / 2, w / 2 + 12), window.innerWidth - w / 2 - 12)
    const below = r.top < 330
    setInspect({ post, x, y: below ? r.bottom + 14 : r.top - 14, below })
  }

  // The inspector floats over the page — dismiss it on scroll/resize.
  useEffect(() => {
    if (!inspect) return
    const hide = () => setInspect(null)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [inspect])

  // Browsing changes the list — dismiss any open inspector.
  useEffect(() => {
    setInspect(null)
  }, [searchQuery, activeShelf, activeProjectId])

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    }
  }, [])

  const shelfCounts = useMemo(() => {
    const tagSet = (shelf: { tags: string[] }) =>
      new Set(shelf.tags.map((t) => t.toLowerCase()))
    return SHELVES.map((shelf) => {
      const tags = tagSet(shelf)
      const count = posts.filter((post) =>
        post.tags.some((t) => tags.has(t.toLowerCase()))
      ).length
      return { name: shelf.name, count }
    })
  }, [posts])

  const activeShelfTags = useMemo(() => {
    const shelf = SHELVES.find((s) => s.name === activeShelf)
    return shelf ? new Set(shelf.tags.map((t) => t.toLowerCase())) : null
  }, [activeShelf])

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return posts.filter((post) => {
      if (activeShelfTags && !post.tags.some((t) => activeShelfTags.has(t.toLowerCase())))
        return false
      if (activeProjectId && post.relatedProjectId !== activeProjectId) return false
      if (q) {
        const hay = `${post.title} ${post.excerpt} ${post.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [posts, activeShelfTags, activeProjectId, searchQuery])

  const activeProject = activeProjectId ? getProjectById(activeProjectId) : undefined

  const isBrowsing = activeShelf !== null || activeProjectId !== null || searchQuery.trim() !== ''
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
    <div id="top" className={cn('blog-world blog-library', isDark && 'dark')}>
      <BlogNav isDark={isDark} toggleTheme={toggleTheme} />
      <BlogDrift ink={isDark ? '#f0e6d8' : '#1a1612'} />
      <BlogCursor />

      <header className="relative px-5 sm:px-10 lg:px-16 pt-8 pb-10 overflow-hidden">
        <svg
          className="blog-bleed"
          viewBox="0 0 1000 150"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <text x="500" y="118" textAnchor="middle" textLength="990" lengthAdjust="spacing">
            CEREBRATION
          </text>
        </svg>
        <div className="relative -mt-2 sm:-mt-4 max-w-2xl">
          <p className="text-[11px] font-mono tracking-[0.32em] uppercase text-[var(--blog-muted)] mb-4">
            Cerebration · The Library · {new Date().getFullYear()}
          </p>
          <h1 className="font-fraunces text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[var(--blog-ink)]">
            The Library
          </h1>
          <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-[var(--blog-muted)] max-w-lg">
            A builder&apos;s notebook: projects, breakdowns, and lessons,
            shelved as I go. Pull one down.
          </p>
        </div>
      </header>

      {/* search + subject filters: one toolbar, pill subjects with counts */}
      <div className="px-5 sm:px-10 lg:px-16 pb-8">
        <label className="block max-w-sm mb-4">
          <span className="sr-only">Search the library</span>
          <input
            type="search"
            placeholder="Search the stacks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[var(--blog-ink)]/25 py-2 text-sm outline-none placeholder:text-[var(--blog-muted)] focus:border-[var(--blog-bloom)]"
          />
        </label>
        <div className="blog-filter" role="group" aria-label="Filter by shelf">
          <span className="blog-filter__label">Shelves</span>
          <button
            type="button"
            onClick={() => {
              setActiveShelf(null)
              setActiveProjectId(null)
            }}
            data-active={activeShelf === null && !activeProjectId}
            className="blog-filter__pill"
          >
            All <span className="blog-filter__count">{posts.length}</span>
          </button>
          {shelfCounts.map(({ name, count }) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveShelf(name)}
              data-active={activeShelf === name}
              className="blog-filter__pill"
            >
              {name} <span className="blog-filter__count">{count}</span>
            </button>
          ))}
          {activeProject && (
            <button
              type="button"
              onClick={() => setActiveProjectId(null)}
              data-active={true}
              className="blog-filter__pill"
            >
              {activeProject.title} <span className="blog-filter__count">×</span>
            </button>
          )}
        </div>
      </div>

      <main className="px-5 sm:px-10 lg:px-16 pb-8">
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
            {/* Mobile-first catalog: full titles, no popups (shelf takes over at md+) */}
            <div className="catalog">
              {shelves.map(([year, books]) => (
                <section key={year} aria-label={`Volumes from ${year}`}>
                  <p className="catalog-year">{year}</p>
                  {books.map((post) => (
                    <CatalogRow key={post.id} post={post} />
                  ))}
                </section>
              ))}
            </div>
            {shelves.map(([year, books]) => (
              <section key={year} className="shelf" aria-label={`Volumes from ${year}`}>
                <div className="shelf-head">
                  <span className="shelf-plate">{year}</span>
                </div>
                <div className="shelf-books">
                  {books.map((post) => (
                    <Book key={post.id} post={post} onOpen={openInspect} onRequestClose={requestClose} />
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

      <BlogFooter />

      {mounted &&
        inspect &&
        createPortal(
          <div
            className="book-inspector"
            data-open="true"
            data-below={inspect.below ? 'true' : 'false'}
            style={{
              left: inspect.x,
              top: inspect.y,
              transform: `translate(-50%, ${inspect.below ? '0' : '-100%'})`,
            }}
            onMouseEnter={cancelScheduledClose}
            onMouseLeave={() => requestClose()}
            onFocus={cancelScheduledClose}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) requestClose()
            }}
            role="dialog"
            aria-label={`${inspect.post.title} — details`}
          >
            {inspect.post.cover_image ? (
              <span className="book-card__thumb">
                <Image
                  src={inspect.post.cover_image}
                  alt=""
                  fill
                  quality={75}
                  sizes="290px"
                  className="object-cover object-center"
                />
              </span>
            ) : null}
            {inspect.post.tags[0] && <span className="blog-tagtab">{inspect.post.tags[0]}</span>}
            <p className="book-card__title">
              <Link href={`/blog/${inspect.post.slug}`}>{inspect.post.title}</Link>
            </p>
            <p className="book-card__date">{formatWhen(inspect.post.created_at).long}</p>
            <p className="book-card__excerpt">{inspect.post.excerpt}</p>
            <div className="book-card__actions">
              <Link
                href={`/blog/${inspect.post.slug}`}
                className="text-[11px] font-mono tracking-[0.22em] uppercase text-[var(--blog-ink)]"
              >
                Open →
              </Link>
              <BlogLikeButton postId={inspect.post.id} />
            </div>
          </div>,
          document.body
        )}
      <BackToTop />
    </div>
  )
}
