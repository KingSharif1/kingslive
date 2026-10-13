'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_SESSION_LIKES = 5
const likeKey = (postId: string) => `blog_like_${postId}`

interface Particle {
  id: number
  angle: number
  distance: number
  size: number
}

let particleId = 0

export function BlogLikeButton({ postId }: { postId: string }) {
  const [likes, setLikes] = useState(0)
  const [sessionLikes, setSessionLikes] = useState(0)
  const [isPopping, setIsPopping] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [showPlusOne, setShowPlusOne] = useState(false)
  const [ready, setReady] = useState(false)
  const popTimer = useRef<number | null>(null)

  useEffect(() => {
    setSessionLikes(parseInt(localStorage.getItem(likeKey(postId)) || '0', 10))
    fetch(`/api/blog/likes?postId=${encodeURIComponent(postId)}`)
      .then((r) => r.json())
      .then((d) => setLikes(typeof d.likes === 'number' ? d.likes : 0))
      .catch(() => setLikes(0))
      .finally(() => setReady(true))
  }, [postId])

  useEffect(() => {
    return () => {
      if (popTimer.current !== null) window.clearTimeout(popTimer.current)
    }
  }, [])

  const burst = useCallback(() => {
    const fresh: Particle[] = Array.from({ length: 8 }, () => {
      particleId += 1
      return {
        id: particleId,
        angle: Math.random() * Math.PI * 2,
        distance: 26 + Math.random() * 22,
        size: 3 + Math.random() * 4,
      }
    })
    setParticles(fresh)
    window.setTimeout(() => setParticles([]), 700)
  }, [])

  const handleLike = useCallback(async () => {
    if (sessionLikes >= MAX_SESSION_LIKES) return
    // pop + particles + floating +1, all at once
    setIsPopping(true)
    burst()
    setShowPlusOne(true)
    window.setTimeout(() => setShowPlusOne(false), 800)
    if (popTimer.current !== null) window.clearTimeout(popTimer.current)
    popTimer.current = window.setTimeout(() => setIsPopping(false), 350)

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
  }, [sessionLikes, postId, burst])

  const liked = sessionLikes > 0
  const maxed = sessionLikes >= MAX_SESSION_LIKES

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={maxed}
      aria-label={maxed ? 'Like limit reached' : liked ? 'Like this post' : 'Like this post'}
      aria-pressed={liked}
      className="like-btn"
      data-liked={liked}
      data-maxed={maxed}
    >
      <span className="like-btn__heart-wrap" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="like-btn__particle"
            style={
              {
                '--pa': `${p.angle}rad`,
                '--pd': `${p.distance}px`,
                width: p.size,
                height: p.size,
              } as React.CSSProperties
            }
          />
        ))}
        {showPlusOne && <span className="like-btn__plus">+1</span>}
        <svg
          viewBox="0 0 24 24"
          className={`like-btn__heart ${isPopping ? 'like-btn__heart--pop' : ''}`}
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </span>
      <span className="like-btn__count" aria-live="polite">
        {ready ? likes : '·'}
      </span>
    </button>
  )
}
