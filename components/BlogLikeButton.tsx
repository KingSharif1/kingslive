'use client'

import { useCallback, useEffect, useState } from 'react'

type LikeResponse = { likes?: number; liked?: boolean; unavailable?: boolean }

export function BlogLikeButton({
  postId,
  variant = 'inline',
}: {
  postId: string
  variant?: 'inline' | 'icon'
}) {
  const [likes, setLikes] = useState(0)
  const [liked, setLiked] = useState(false)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/blog/likes?postId=${encodeURIComponent(postId)}`, { cache: 'no-store' })
      .then((res) => res.json() as Promise<LikeResponse>)
      .then((data) => {
        if (cancelled) return
        setLikes(typeof data.likes === 'number' ? data.likes : 0)
        setLiked(Boolean(data.liked))
      })
      .catch(() => {
        if (!cancelled) setLikes(0)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [postId])

  const toggle = useCallback(async () => {
    if (pending) return
    const action = liked ? 'unlike' : 'like'
    setPending(true)
    setPulse(true)
    try {
      const res = await fetch('/api/blog/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action }),
      })
      const data = (await res.json()) as LikeResponse
      if (typeof data.likes === 'number') setLikes(data.likes)
      if (typeof data.liked === 'boolean') setLiked(data.liked)
    } catch {
      /* keep the last confirmed count */
    } finally {
      setPending(false)
      window.setTimeout(() => setPulse(false), 280)
    }
  }, [liked, pending, postId])

  const label = `${liked ? 'Unlike' : 'Like'} this note, ${likes} ${likes === 1 ? 'like' : 'likes'}`

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!ready || pending}
      aria-pressed={liked}
      aria-label={label}
      className={
        variant === 'icon'
          ? 'blog-like'
          : 'blog-like blog-like--inline inline-flex items-center gap-1.5 text-[11px] font-mono tracking-widest uppercase text-[var(--blog-muted)] hover:text-[var(--blog-ink)] disabled:opacity-40'
      }
    >
      <svg
        viewBox="0 0 24 24"
        className={`w-3.5 h-3.5 ${pulse ? 'blog-like__pulse' : ''} ${liked ? 'blog-like__on' : ''}`}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {variant === 'inline' ? (ready ? likes : <span className="wait-copy inline-block w-4">·</span>) : null}
    </button>
  )
}
