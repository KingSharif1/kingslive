'use client'

import { useEffect, useMemo, useState } from 'react'
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
    long: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
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

function FeaturedCard({ post }: { post: BlogPost }) {
  const when = formatWhen(post.created_at)
  return (
    <article className="lib2-featured group">
      <span className="lib2-featured__stamp" aria-hidden="true">
        Latest
      </span>
      {post.cover_image ? (
        <Link href={`/blog/${post.slug}`} className="lib2-featured__art" aria-label={post.title}>
          <span className="lib2-featured__art-inner">
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
        {post.tags[0] && <span className="lib2-tagtab">{post.tags[0]}</span>}
        <h2 className="lib2-featured__title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="lib2-meta">{when.long}</p>
        <p className="lib2-featured__excerpt">{post.excerpt}</p>
        <div className="lib2-card__actions">
          <Link href={`/blog/${post.slug}`} className="lib2-open">
            Open the notebook <span aria-hidden="true">→</span>
          </Link>
          <BlogLikeButton postId={post.id} />
        </div>
      </div>
    </article>
  )
}

function NotebookCard({ post }: { post: BlogPost }) {
  const when = formatWhen(post.created_at)
  const tilt = (((hashStr(post.id) >> 3) % 5) - 2) * 0.6
  return (
    <article className="lib2-card group" style={{ ['--card-tilt' as string]: `${tilt.toFixed(1)}deg` }}>
      <span className="lib2-card__margin" aria-hidden="true" />
      <div className="lib2-card__body">
        {post.tags[0] && <span className="lib2-tagtab">{post.tags[0]}</span>}
        <h3 className="lib2-card__title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="lib2-meta">{when.long}</p>
        {post.cover_image ? (
          <Link
            href={`/blog/${post.slug}`}
            className="lib2-card__thumb"
            aria-label={`${post.title} — open this notebook`}
            tabIndex={-1}
          >
            <span className="lib2-card__thumb-frame">
              <Image
                src={post.cover_image}
                alt=""
                fill
                quality={75}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                className="object-cover object-center"
              />
            </span>
          </Link>
        ) : null}
        <p className="lib2-card__excerpt">{post.excerpt}</p>
      </div>
      <div className="lib2-card__actions">
        <Link href={`/blog/${post.slug}`} className="lib2-open">
          Open <span aria-hidden="true">→</span>
        </Link>
        <BlogLikeButton postId={post.id} />
      </div>
    </article>
  )
}

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the library" className="lib2-grid">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="lib2-card" aria-hidden="true">
          <div className="space-y-3 p-6">
            <div className="wait-block h-3 w-16" />
            <div className="wait-block h-8 w-4/5" />
            <div className="wait-block h-4 w-full" />
            <div className="wait-block h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

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

  const years = useMemo(() => {
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
          <p className="lib2-eyebrow">
            Cerebration · The Library · {new Date().getFullYear()}
          </p>
          <h1 className="lib2-h1">The Library</h1>
          <p className="lib2-lede">
            A builder&apos;s notebook shelf: projects, breakdowns, and lessons,
            written down as they happen. Pull one off the shelf.
          </p>
          {!loading && posts.length > 0 && (
            <p className="lib2-stats">
              {posts.length} {posts.length === 1 ? 'volume' : 'volumes'} · {years.length}{' '}
              {years.length === 1 ? 'shelf' : 'shelves'}
            </p>
          )}
        </div>
      </header>

      <div className="lib2-toolbar">
        <label className="lib2-search">
          <span className="sr-only">Search the library</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <input
            type="search"
            placeholder="Search the stacks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
        <div className="lib2-shelves" role="group" aria-label="Filter by shelf">
          <button
            type="button"
            onClick={() => {
              setActiveShelf(null)
              setActiveProjectId(null)
            }}
            data-active={activeShelf === null && !activeProjectId}
            className="lib2-pill"
          >
            All <span className="lib2-pill__count">{posts.length}</span>
          </button>
          {shelfCounts.map(({ name, count }) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveShelf(activeShelf === name ? null : name)}
              data-active={activeShelf === name}
              className="lib2-pill"
            >
              {name} <span className="lib2-pill__count">{count}</span>
            </button>
          ))}
          {activeProject && (
            <button
              type="button"
              onClick={() => setActiveProjectId(null)}
              data-active={true}
              className="lib2-pill"
            >
              {activeProject.title} <span className="lib2-pill__count">×</span>
            </button>
          )}
        </div>
      </div>

      <main className="px-5 sm:px-10 lg:px-16 pb-10">
        {loading ? (
          <LoadingSkeleton />
        ) : filteredPosts.length === 0 ? (
          <div className="lib2-empty">
            <p className="lib2-empty__title">Nothing on this shelf.</p>
            <p>
              {posts.length === 0
                ? 'The library is still being stocked. Check back soon.'
                : 'Try a different shelf or clear the search.'}
            </p>
            {isBrowsing && (
              <button
                type="button"
                className="lib2-open"
                onClick={() => {
                  setActiveShelf(null)
                  setActiveProjectId(null)
                  setSearchQuery('')
                }}
              >
                Show everything →
              </button>
            )}
          </div>
        ) : (
          <>
            {featured && <FeaturedCard post={featured} />}
            {years.map(([year, books]) => (
              <section key={year} aria-label={`Volumes from ${year}`} className="lib2-year">
                <div className="lib2-year__head">
                  <span className="lib2-year__plate">{year}</span>
                  <span className="lib2-year__rule" aria-hidden="true" />
                </div>
                <div className="lib2-grid">
                  {books.map((post) => (
                    <NotebookCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            ))}
            <p className="lib2-colophon" aria-hidden="true">
              ··· that&apos;s everything on the shelves ···
            </p>
          </>
        )}
      </main>

      <BlogFooter />
      <BackToTop />
    </div>
  )
}
