'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BlogNav } from '@/components/BlogNav'
import { BlogLikeButton } from '@/components/BlogLikeButton'
import { usePortfolioTheme } from '@/components/usePortfolioTheme'
import { cn } from '@/lib/utils'
import { getProjectById } from '@/lib/portfolio-projects'
import type { BlogPost } from '@/lib/sanity-queries'

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

  return (
    <div className={cn('blog-world', isDark && 'dark')}>
      <BlogNav isDark={isDark} toggleTheme={toggleTheme} />

      <header className="relative pt-6 pb-10 sm:pb-14 overflow-hidden">
        <p className="blog-bleed" aria-hidden>
          notes
        </p>
        <div className="relative px-5 sm:px-10 lg:px-16 -mt-6 sm:-mt-10 max-w-3xl">
          <p className="text-[11px] font-mono tracking-[0.32em] uppercase text-[var(--blog-muted)] mb-4">
            Journal · {new Date().getFullYear()}
          </p>
          <p className="font-fraunces text-xl sm:text-2xl leading-snug text-[var(--blog-ink)] max-w-lg">
            A journal of what I build, do, and talk about. Pull a volume off the shelf.
          </p>
          <label className="mt-10 block max-w-sm">
            <span className="sr-only">Search notes</span>
            <input
              type="search"
              placeholder="Find a note…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-[var(--blog-ink)]/25 py-2 text-sm outline-none placeholder:text-[var(--blog-muted)] focus:border-[var(--blog-bloom)]"
            />
          </label>
        </div>
      </header>

      <div className="px-5 sm:px-10 lg:px-16 pb-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-mono tracking-[0.18em] uppercase">
        <button
          type="button"
          onClick={() => {
            setActiveTag(null)
            setActiveProjectId(null)
          }}
          className={activeTag === null && !activeProjectId ? 'text-[var(--blog-ink)]' : 'text-[var(--blog-muted)] hover:text-[var(--blog-ink)]'}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            className={activeTag === tag ? 'text-[var(--blog-ink)]' : 'text-[var(--blog-muted)] hover:text-[var(--blog-ink)]'}
          >
            {tag}
          </button>
        ))}
        {activeProject && (
          <button type="button" onClick={() => setActiveProjectId(null)} className="text-[var(--blog-bloom)]">
            {activeProject.title} ×
          </button>
        )}
      </div>

      <main className="pb-24">
        {loading ? (
          <div aria-busy="true" aria-label="Loading notes">
            {[0, 1, 2].map((i) => (
              <article
                key={i}
                className="blog-volume px-5 sm:px-10 lg:px-16 py-8 sm:py-10 border-t border-[var(--blog-ink)]/10"
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
          <div className="px-5 sm:px-10 lg:px-16 py-20 text-[var(--blog-muted)]">
            {posts.length === 0 ? 'Nothing on the shelf yet.' : 'Nothing matches that.'}
          </div>
        ) : (
          filteredPosts.map((post) => {
            const year = new Date(post.created_at).getFullYear()
            const when = new Date(post.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
            return (
              <article
                key={post.id}
                className="blog-volume group px-5 sm:px-10 lg:px-16 py-8 sm:py-10 border-t border-[var(--blog-ink)]/10"
              >
                <div className="blog-spine">
                  {year} · {when}
                </div>
                <div className="space-y-3 max-w-xl">
                  {post.tags[0] && (
                    <p className="text-[11px] font-mono tracking-[0.22em] uppercase text-[var(--blog-muted)]">
                      {post.tags[0]}
                    </p>
                  )}
                  <h2 className="font-fraunces text-2xl sm:text-3xl lg:text-4xl leading-[1.08] tracking-tight">
                    <Link href={`/blog/${post.slug}`} className="blog-title-link">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-[var(--blog-muted)] leading-relaxed text-[15px] sm:text-base">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-6 pt-1">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-[11px] font-mono tracking-[0.22em] uppercase text-[var(--blog-ink)]"
                    >
                      Open →
                    </Link>
                    <BlogLikeButton postId={post.id} />
                  </div>
                </div>
                {post.cover_image ? (
                  <Link href={`/blog/${post.slug}`} className="blog-volume__art relative block">
                    <Image
                      src={post.cover_image}
                      alt=""
                      fill
                      quality={85}
                      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      sizes="(min-width: 1024px) 280px, 100vw"
                    />
                  </Link>
                ) : (
                  <div className="blog-volume__art" />
                )}
              </article>
            )
          })
        )}
      </main>
    </div>
  )
}
