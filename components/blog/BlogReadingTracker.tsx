'use client'

import { useEffect } from 'react'

const sent = new Set<string>()
const DEVICE_KEY = 'kl_device_id'
const MILESTONES = [25, 50, 75, 100]

// Compact bot sniff for the client. The server re-checks with the full list.
const BOT_RE =
  /bot|crawler|spider|slurp|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|slackbot|discordbot|wget|curl\/|headlesschrome|lighthouse|pingdom|uptimerobot|semrush|ahrefs|petalbot|bytespider|gptbot|claudebot|amazonbot|applebot/i

/** Random per-device id, stored locally, sent only as a SHA-256 hash. No PII. */
async function getDeviceHash(): Promise<string | null> {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(DEVICE_KEY, id)
    }
    if (!crypto.subtle) return null
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`klr:${id}`))
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return null
  }
}

function scrollDepth(): number {
  try {
    const doc = document.documentElement
    const total = doc.scrollHeight - doc.clientHeight
    if (total <= 0) return 100
    return Math.min(100, Math.max(0, Math.round((window.scrollY / total) * 100)))
  } catch {
    return 0
  }
}

/**
 * Tracks one reading session: active seconds (paused while the tab is hidden),
 * deepest scroll point, and 25/50/75/100 milestones. Sends a single beacon on
 * pagehide. Silent on failure — analytics must never break the page.
 */
export default function BlogReadingTracker({ postId }: { postId: string }) {
  useEffect(() => {
    if (!postId || sent.has(postId)) return
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    if (BOT_RE.test(navigator.userAgent || '')) return
    sent.add(postId)

    const startedAt = new Date().toISOString()
    const referrer = document.referrer || null
    let activeMs = 0
    let visibleSince: number | null = document.visibilityState === 'visible' ? Date.now() : null
    let maxDepth = 0
    const hit = new Set<number>()
    let raf = 0
    let beaconSent = false

    const pause = () => {
      if (visibleSince != null) {
        activeMs += Date.now() - visibleSince
        visibleSince = null
      }
    }
    const resume = () => {
      if (visibleSince == null && document.visibilityState === 'visible') {
        visibleSince = Date.now()
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pause()
      else resume()
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const d = scrollDepth()
        if (d > maxDepth) maxDepth = d
        for (const m of MILESTONES) if (d >= m) hit.add(m)
      })
    }

    const send = () => {
      if (beaconSent) return
      beaconSent = true
      pause()
      getDeviceHash()
        .then((deviceHash) => {
          if (!deviceHash) return
          const payload = JSON.stringify({
            postId,
            deviceHash,
            activeSeconds: Math.round(activeMs / 1000),
            maxScrollDepth: maxDepth,
            milestones: [...hit].sort((a, b) => a - b),
            referrer,
            startedAt,
          })
          try {
            const blob = new Blob([payload], { type: 'application/json' })
            if (navigator.sendBeacon('/api/blog/reading-session', blob)) return
          } catch {
            /* fall through to fetch */
          }
          try {
            void fetch('/api/blog/reading-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true,
            }).catch(() => {})
          } catch {
            /* a missed session is quieter than a broken note */
          }
        })
        .catch(() => {})
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', send)
    // Initial position (e.g. restored scroll)
    onScroll()

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', send)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [postId])

  return null
}
