'use client'

import { useEffect } from 'react'

const sent = new Set<string>()

/**
 * Counts a view once per page load. The module Set survives React StrictMode's
 * double effect, and the server ignores a second hit inside 24 hours anyway.
 * Render does not call the API — only this effect does — so SSR does not count.
 */
export default function BlogViewBeacon({ postId }: { postId: string }) {
  useEffect(() => {
    if (!postId || sent.has(postId)) return
    sent.add(postId)
    const body = JSON.stringify({ postId })
    fetch('/api/blog/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      cache: 'no-store',
    }).catch(() => {
      /* a missed view is quieter than a broken note */
    })
  }, [postId])

  return null
}
