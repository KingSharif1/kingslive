'use client'

import { useCallback, useEffect, useState } from 'react'

const MAX_SESSION_LIKES = 5
const likeKey = (postId: string) => `blog_like_${postId}`

export function BlogLikeButton({ postId }: { postId: string }) {
  const [likes, setLikes] = useState(0)
  const [sessionLikes, setSessionLikes] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSessionLikes(parseInt(localStorage.getItem(likeKey(postId)) || '0', 10))
    fetch(`/api/blog/likes?postId=${encodeURIComponent(postId)}`)
      .then((r) => r.json())
      .then((d) => setLikes(typeof d.likes === 'number' ? d.likes : 0))
      .catch(() => setLikes(0))
      .finally(() => setReady(true))
  }, [postId])

  const handleLike = useCallback(async () => {
    if (sessionLikes >= MAX_SESSION_LIKES) return
    setIsAnimating(true)
    setLikes((n) => n + 1)
    const nextSession = sessionLikes + 1
    setSessionLikes(nextSession)
    localStorage.setItem(likeKey(postId), String(nextSession))
    try {
      const res = await fetch('/api/blog/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (typeof data.likes === 'number') setLikes(data.likes)
    } catch {
      /* keep optimistic count */
    }
    setTimeout(() => setIsAnimating(false), 300)
  }, [sessionLikes, postId])

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={sessionLikes >= MAX_SESSION_LIKES}
      className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-widest uppercase text-[var(--blog-muted)] hover:text-[var(--blog-ink)] disabled:opacity-40"
    >
      <svg
        viewBox="0 0 24 24"
        className={`w-3.5 h-3.5 transition-transform ${isAnimating ? 'scale-125' : ''} ${sessionLikes > 0 ? 'fill-[#e89a9a] text-[#e89a9a]' : 'fill-none'}`}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {ready ? likes : <span className="wait-copy inline-block w-4">·</span>}
    </button>
  )
}
