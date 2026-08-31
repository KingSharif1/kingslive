'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CTROOM_AUTH_CHANNEL,
  CTROOM_AUTH_SIGNED_IN,
  CTROOM_LOGIN_WAITER_KEY,
} from '@/lib/ctroom-auth-channel'

/**
 * Lands here after /auth/callback sets the session cookie.
 * The tab that requested the link (sessionStorage waiter) goes to /ctroom.
 * The tab opened from email tells that waiter and offers to close.
 */
export default function AuthCompletePage() {
  const [mode, setMode] = useState<'working' | 'handoff'>('working')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      if (!session?.user) {
        window.location.replace('/ctroom')
        return
      }

      const channel = new BroadcastChannel(CTROOM_AUTH_CHANNEL)
      channel.postMessage(CTROOM_AUTH_SIGNED_IN)
      channel.close()

      if (sessionStorage.getItem(CTROOM_LOGIN_WAITER_KEY)) {
        sessionStorage.removeItem(CTROOM_LOGIN_WAITER_KEY)
        window.location.replace('/ctroom')
        return
      }

      setMode('handoff')
      window.close()
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  if (mode === 'working') {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: 'oklch(12% 0 265)', color: '#e5e5e5' }}
      >
        <p className="font-mono text-sm tracking-widest uppercase text-white/40">
          Authenticating…
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex h-screen items-center justify-center px-6"
      style={{ background: 'oklch(12% 0 265)', color: '#e5e5e5' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <p
          className="font-mono text-[10px] tracking-[0.25em] uppercase mb-4"
          style={{ color: '#00ff88' }}
        >
          Session live
        </p>
        <h1 className="font-mono text-lg font-bold text-white uppercase mb-3">
          You are signed in
        </h1>
        <p className="text-sm text-white/45 mb-8">
          Return to the CTROOM tab where you requested the link. This extra tab
          can close.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.close()}
            className="font-mono text-sm py-3 rounded-lg uppercase tracking-widest"
            style={{
              background: 'rgba(0,255,136,0.12)',
              border: '1px solid rgba(0,255,136,0.3)',
              color: '#00ff88',
            }}
          >
            Close this tab
          </button>
          <a
            href="/ctroom"
            className="font-mono text-xs text-white/30 hover:text-white/60"
          >
            Enter CTROOM here instead
          </a>
        </div>
      </div>
    </div>
  )
}
