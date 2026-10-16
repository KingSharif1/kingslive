'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BlogNav } from '@/components/BlogNav'
import { BlogLikeButton } from '@/components/BlogLikeButton'
import BlogDrift from '@/components/blog/BlogDrift'
import BlogCursor from '@/components/blog/BlogCursor'
import BackToTop from '@/components/blog/BackToTop'
import { usePortfolioTheme } from '@/components/usePortfolioTheme'
import { cn } from '@/lib/utils'
import { getProjectById } from '@/lib/portfolio-projects'
import type { BlogPost } from '@/lib/sanity-queries'

function formatWhen(createdAt: string) {
  return new Date(createdAt)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

function CardPhoto({ post, sizes }: { post: BlogPost; sizes: string }) {
  if (!post.cover_image) return null
  return (
    <figure className="sk-photo">
      <span className="sk-photo__frame">
        <Image
          src={post.cover_image}
          alt=""
          fill
          quality={80}
          sizes={sizes}
          className="object-cover object-center"
        />
      </span>
      {post.tags[0] && <figcaption>{post.tags[0].toLowerCase()}</figcaption>}
    </figure>
  )
}

/* ── One sketchbook card per post ──────────────────────────────────────── */
function SketchCard({
  post,
  entryNo,
  latest,
}: {
  post: BlogPost
  entryNo: string
  latest?: boolean
}) {
  return (
    <article className={cn('sk-card', 'sketch')} aria-label={post.title}>
      <span className="sk-cardno sketch2">nº {entryNo}</span>
      <CardPhoto post={post} sizes="(min-width: 900px) 22vw, 100vw" />
      <div>
        <div className="sk-date">
          <span className="sk-stamp">{formatWhen(post.created_at)}</span>
          {latest ? (
            <span className="sk-stamp sk-stamp--hot">Latest</span>
          ) : (
            post.tags[0] && <span className="sk-stamp">{post.tags[0]}</span>
          )}
        </div>
        <h2 className="sk-cardtitle">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="sk-excerpt">{post.excerpt}</p>
        <div className="sk-meta">
          <BlogLikeButton postId={post.id} />
          <Link href={`/blog/${post.slug}`} className="sk-read">
            Read <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}

function Separator({ variant }: { variant: 'star' | 'loop' }) {
  return (
    <div className="sk-sep" aria-hidden="true">
      <span className="line" />
      {variant === 'star' ? (
        <svg viewBox="0 0 40 40">
          <path d="M20 5 L23.5 15.5 L34 13.5 L25.5 21.5 L32 31.5 L20.5 25.5 L10 32.5 L15.5 21.5 L6 14.5 L16.5 16.5 Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 60 30">
          <path d="M5 18 C 15 8, 24 8, 30 16 C 36 24, 45 24, 55 12 M48 8 L56 11 L50 18" />
        </svg>
      )}
      <span className="line" />
    </div>
  )
}

function SketchFooter() {
  return (
    <>
      <div className="sk-mountains" aria-hidden="true">
        <svg viewBox="0 0 1200 110" preserveAspectRatio="none">
          <path
            d="M0,110 L0,70 L150,25 L280,65 L420,15 L560,60 L700,30 L850,70 L1000,20 L1120,58 L1200,42 L1200,110 Z"
            fill="var(--blog-ink)"
          />
          <path
            d="M0,110 L0,85 L200,48 L380,80 L520,44 L700,76 L900,48 L1080,80 L1200,62 L1200,110 Z"
            fill="var(--blog-muted)"
            opacity="0.55"
          />
        </svg>
      </div>
      <div className="sk-ticker" aria-hidden="true">
        <span>CEREBRATION · CEREBRATION · CEREBRATION · CEREBRATION · CEREBRATION ·&nbsp;</span>
      </div>
      <div className="sk-foot">
        © {new Date().getFullYear()} King Sharif · <Link href="/">kingsharif.com</Link>
      </div>
    </>
  )
}

// Broad shelves: each groups related subject tags so the filter stays a short,
// scannable row instead of one pill per tag.
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
  const entryNo = (post: BlogPost) =>
    String(posts.length - posts.findIndex((p) => p.id === post.id)).padStart(3, '0')

  return (
    <div id="top" className={cn('blog-world blog-library', isDark && 'dark')}>
      <BlogNav isDark={isDark} toggleTheme={toggleTheme} />
      <BlogDrift ink={isDark ? '#f0e6d8' : '#1a1612'} />
      <BlogCursor />

      <header className="px-5 sm:px-10 lg:px-16 pt-10 pb-6">
        <p className="sk-kicker">Cerebration · a sketchbook</p>
        <div className="sk-title-wrap">
          <h1 className="sk-title">
            The Library
            <svg className="swash" viewBox="0 0 320 20" preserveAspectRatio="none" aria-hidden="true">
              <path pathLength={1} d="M6 12 C 80 4, 160 18, 240 8 S 300 14, 314 10" />
            </svg>
          </h1>
        </div>
      </header>

      <div className="px-5 sm:px-10 lg:px-16 pb-8">
        <label className="block max-w-sm mb-4">
          <span className="sr-only">Search the library</span>
          <input
            type="search"
            placeholder="Search the sketchbook…"
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
          <div className="sk-stack" aria-busy="true" aria-label="Loading the library">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn('sk-card', 'sketch', 'sk-card--loading')} aria-hidden="true">
                <div className="wait-block" style={{ aspectRatio: '4/3' }} />
                <div>
                  <div className="wait-block" style={{ height: '1.6rem', marginBottom: '0.7rem' }} />
                  <div className="wait-block" style={{ height: '4.5rem' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-[var(--blog-muted)]">
            {posts.length === 0 ? 'No pages in the sketchbook yet.' : 'No pages match that.'}
          </div>
        ) : (
          <>
            <div className="sk-stack">
              {filteredPosts.map((post, i) => (
                <Fragment key={post.id}>
                  {i > 0 && <Separator variant={i % 2 === 0 ? 'loop' : 'star'} />}
                  <SketchCard
                    post={post}
                    entryNo={entryNo(post)}
                    latest={!isBrowsing && i === 0}
                  />
                </Fragment>
              ))}
            </div>
            <p className="sk-colophon" aria-hidden="true">
              — that&apos;s every page · more soon —
            </p>
          </>
        )}
      </main>

      <SketchFooter />
      <BackToTop />
    </div>
  )
}
