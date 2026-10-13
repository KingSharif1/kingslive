'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
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

/** Portrait book cover — engraved plate cropped to volume proportions. */
function BookCover({
  post,
  sizes,
  portrait = false,
}: {
  post: BlogPost
  sizes: string
  portrait?: boolean
}) {
  if (!post.cover_image) {
    return (
      <span className={cn('lib-cover', portrait && 'lib-cover--portrait', 'lib-cover--fallback')} aria-hidden="true">
        <span className="lib-cover__initial">{post.title.charAt(0)}</span>
      </span>
    )
  }
  return (
    <span className={cn('lib-cover', portrait && 'lib-cover--portrait')} aria-hidden="true">
      <Image
        src={post.cover_image}
        alt=""
        fill
        quality={80}
        sizes={sizes}
        className="object-cover object-center"
      />
    </span>
  )
}

function Stamp({ children }: { children: React.ReactNode }) {
  return <span className="lib-stamp">{children}</span>
}

/* ── Latest: the open volume on the lectern ─────────────────────────── */
function LecternSpread({ post }: { post: BlogPost }) {
  const when = formatWhen(post.created_at)
  return (
    <article className="lectern" aria-label={`Latest: ${post.title}`}>
      <div className="lectern__spread">
        <Link
          href={`/blog/${post.slug}`}
          className="lectern__page lectern__page--left"
          aria-label={`${post.title} — open`}
          tabIndex={-1}
        >
          <BookCover post={post} sizes="(min-width: 900px) 40vw, 100vw" />
          <span className="lectern__plate-caption">
            Plate I{post.tags[0] ? ` — ${post.tags[0]}` : ''}
          </span>
        </Link>
        <div className="lectern__gutter" aria-hidden="true" />
        <div className="lectern__page lectern__page--right">
          <div className="flex items-center gap-3 flex-wrap">
            <Stamp>Latest entry</Stamp>
            <span className="lib-date">{when.long}</span>
          </div>
          <h2 className="lib-title lib-title--spread">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>
          <p className="lectern__excerpt">{post.excerpt}</p>
          <div className="lib-actions">
            <Link href={`/blog/${post.slug}`} className="lib-open">
              Read the volume <span aria-hidden="true">→</span>
            </Link>
            <BlogLikeButton postId={post.id} />
          </div>
        </div>
      </div>
    </article>
  )
}

/* ── Shelf: volumes standing on a wooden plank ───────────────────────── */
function ShelfBook({ post }: { post: BlogPost }) {
  const h = hashStr(post.id)
  const tilt = (((h >> 2) % 5) - 2) * 0.9 // -1.8 .. 1.8deg
  const height = 196 + (h % 40) // 196..236px
  const when = formatWhen(post.created_at)
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="stack-book"
      style={{ '--tilt': `${tilt.toFixed(2)}deg`, '--bh': `${height}px` } as CSSProperties}
      aria-label={`${post.title} — ${when.long}`}
    >
      <span className="stack-book__volume" aria-hidden="true">
        <BookCover post={post} portrait sizes="180px" />
        <span className="stack-book__sheen" />
      </span>
      <span className="stack-book__label">
        <span className="stack-book__label-title">{post.title}</span>
        <span className="stack-book__label-date">{when.short}</span>
      </span>
    </Link>
  )
}

function Shelf({ year, books }: { year: number; books: BlogPost[] }) {
  return (
    <section className="stack-shelf" aria-label={`Volumes from ${year}`}>
      <p className="lib-year">
        <span className="lib-year__plate">{year}</span>
      </p>
      <div className="stack-shelf__books">
        {books.map((post) => (
          <ShelfBook key={post.id} post={post} />
        ))}
      </div>
      <div className="stack-shelf__plank" aria-hidden="true" />
    </section>
  )
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
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

      <header className="relative px-5 sm:px-10 lg:px-16 pt-8 pb-8 overflow-hidden">
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
          <h1 className="lib-masthead">The Library</h1>
          <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-[var(--blog-muted)] max-w-lg">
            A builder&apos;s notebook: projects, breakdowns, and lessons,
            shelved as I go. Pull one down.
          </p>
        </div>
      </header>

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

      <main className="px-5 sm:px-10 lg:px-16 pb-10">
        {loading ? (
          <div aria-busy="true" aria-label="Loading the library">
            <div className="lectern lectern--loading" aria-hidden="true">
              <div className="lectern__spread">
                <div className="wait-block lectern__page" />
                <div className="wait-block lectern__page" />
              </div>
            </div>
            <div className="stack-shelf__books" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="wait-block" style={{ width: 132, height: 190 }} />
              ))}
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-[var(--blog-muted)]">
            {posts.length === 0 ? 'The shelves are empty.' : 'Nothing on these shelves matches.'}
          </div>
        ) : (
          <>
            {featured && <LecternSpread post={featured} />}
            {shelves.map(([year, books]) => (
              <Shelf key={year} year={year} books={books} />
            ))}
            <p className="blog-index__colophon" aria-hidden="true">
              — that&apos;s everything in the library —
            </p>
          </>
        )}
      </main>

      <BlogFooter />
      <BackToTop />
    </div>
  )
}
