'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { embedUrl, fmtTime as fmt, type BlogVideoSource } from '@/lib/blog-video'

export type { BlogVideoSource }

/* ---------- icons ---------- */

const I = {
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
  ),
  back10: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  fwd10: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M13 17l5-5-5-5M6 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  vol: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.6a4.5 4.5 0 010 6.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  ),
  mute: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" strokeLinecap="round" />
    </svg>
  ),
  full: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  exitFull: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

type SpeechRecognitionT = {
  new (): {
    lang: string
    continuous: boolean
    interimResults: boolean
    onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } }; resultIndex: number }) => void) | null
    onend: (() => void) | null
    onerror: (() => void) | null
    start: () => void
    stop: () => void
  }
}

function getSpeechRecognition(): SpeechRecognitionT | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition as SpeechRecognitionT) || (w.webkitSpeechRecognition as SpeechRecognitionT) || null
}

/* ---------- main component ---------- */

export function BlogVideo({ src, caption }: { src: string; caption?: string }) {
  const embed = embedUrl(src)
  if (embed) {
    return (
      <figure className="blog-photo blog-video">
        <div className="blog-video__stage">
          <iframe
            src={embed}
            title={caption || 'Embedded video'}
            className="blog-video__frame"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
          />
        </div>
        {caption ? <figcaption className="blog-caption">{caption}</figcaption> : null}
      </figure>
    )
  }
  return <NativePlayer src={src} caption={caption} />
}

function NativePlayer({ src, caption }: { src: string; caption?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrubRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | null>(null)
  const scrubbing = useRef(false)
  const recRef = useRef<{ stop: () => void } | null>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showBar, setShowBar] = useState(true)
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState<string | null>(null)
  const [voiceOK] = useState(() => getSpeechRecognition() !== null)

  const video = () => videoRef.current

  const poke = useCallback(() => {
    setShowBar(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowBar(false)
    }, 2600)
  }, [])

  useEffect(() => {
    poke()
    // SSR: metadata may already be loaded before hydration attaches the
    // listener, so read it directly on mount as well.
    const v = videoRef.current
    if (v && Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration)
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [poke])

  const toggle = useCallback(() => {
    const v = video()
    if (!v) return
    if (v.paused || v.ended) void v.play()
    else v.pause()
    poke()
  }, [poke])

  const seekBy = useCallback((sec: number) => {
    const v = video()
    if (!v || !Number.isFinite(v.duration)) return
    v.currentTime = Math.min(Math.max(0, v.currentTime + sec), v.duration)
    poke()
  }, [poke])

  const toggleMute = useCallback(() => {
    const v = video()
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
    poke()
  }, [poke])

  const toggleFullscreen = useCallback(async () => {
    const el = wrapRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await el.requestFullscreen()
    } catch {
      /* fullscreen unavailable — no-op */
    }
    poke()
  }, [poke])

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  /* scrubber */
  const seekToRatio = useCallback((clientX: number) => {
    const track = scrubRef.current
    const v = video()
    if (!track || !v || !Number.isFinite(v.duration) || v.duration <= 0) return
    const r = track.getBoundingClientRect()
    const ratio = Math.min(Math.max(0, (clientX - r.left) / r.width), 1)
    v.currentTime = ratio * v.duration
    setTime(v.currentTime)
  }, [])

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (scrubbing.current) seekToRatio(e.clientX)
    }
    const up = () => {
      scrubbing.current = false
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [seekToRatio])

  /* voice control */
  const toggleListening = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) return
    if (listening) {
      try { recRef.current?.stop() } catch { /* noop */ }
      recRef.current = null
      setListening(false)
      return
    }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = false
    const v = video()
    rec.onresult = (e) => {
      const said = e.results[e.resultIndex][0].transcript.trim().toLowerCase()
      setHeard(said)
      window.setTimeout(() => setHeard(null), 1800)
      if (!v) return
      if (/(pause|stop)/.test(said)) v.pause()
      else if (/play/.test(said)) void v.play()
      else if (/unmute|sound on|volume on/.test(said)) { v.muted = false; setMuted(false) }
      else if (/mute|sound off|volume off/.test(said)) { v.muted = true; setMuted(true) }
      else if (/exit.*full|small screen|minimi/.test(said)) { if (document.fullscreenElement) void document.exitFullscreen() }
      else if (/full ?screen/.test(said)) { void wrapRef.current?.requestFullscreen().catch(() => {}) }
      else if (/louder|volume up/.test(said)) v.volume = Math.min(1, v.volume + 0.15)
      else if (/quieter|volume down/.test(said)) v.volume = Math.max(0, v.volume - 0.15)
      else if (/restart|start over/.test(said)) { v.currentTime = 0; void v.play() }
      else if (/forward|skip ahead|ahead/.test(said)) v.currentTime = Math.min(v.duration || 0, v.currentTime + 10)
      else if (/back|rewind|go back/.test(said)) v.currentTime = Math.max(0, v.currentTime - 10)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    try {
      rec.start()
      recRef.current = rec
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [listening])

  useEffect(() => {
    return () => {
      try { recRef.current?.stop() } catch { /* noop */ }
      recRef.current = null
    }
  }, [])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key.toLowerCase() === 'k') { e.preventDefault(); toggle() }
    else if (e.key.toLowerCase() === 'f') toggleFullscreen()
    else if (e.key.toLowerCase() === 'm') toggleMute()
    else if (e.key === 'ArrowRight') seekBy(5)
    else if (e.key === 'ArrowLeft') seekBy(-5)
  }

  const pct = duration > 0 ? (time / duration) * 100 : 0

  return (
    <figure className="blog-photo blog-video">
      <div
        ref={wrapRef}
        className="blog-video__stage"
        tabIndex={0}
        role="region"
        aria-label={caption || 'Video player'}
        onKeyDown={onKey}
        onPointerMove={poke}
        onPointerDown={poke}
      >
        <video
          ref={videoRef}
          src={src}
          className="blog-video__media"
          playsInline
          preload="metadata"
          onClick={toggle}
          onPlay={() => { setPlaying(true); poke() }}
          onPause={() => { setPlaying(false); setShowBar(true) }}
          onEnded={() => { setPlaying(false); setShowBar(true) }}
          onTimeUpdate={(e) => { if (!scrubbing.current) setTime(e.currentTarget.currentTime) }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onDurationChange={(e) => {
            const d = e.currentTarget.duration
            if (Number.isFinite(d) && d > 0) setDuration(d)
          }}
          onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        />

        {/* big center toggle */}
        <button
          type="button"
          className={`blog-video__center${playing ? ' is-hidden' : ''}`}
          onClick={toggle}
          aria-label={playing ? 'Pause video' : 'Play video'}
          tabIndex={-1}
        >
          {playing ? I.pause : I.play}
        </button>

        {/* voice toast */}
        {heard ? <div className="blog-video__toast" aria-live="polite">“{heard}”</div> : null}
        {listening ? <div className="blog-video__live" aria-live="polite"><span />listening…</div> : null}

        {/* control bar */}
        <div className={`blog-video__bar${showBar || !playing ? ' is-visible' : ''}`}>
          <div
            ref={scrubRef}
            className="blog-video__scrub"
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            tabIndex={0}
            onPointerDown={(e) => {
              scrubbing.current = true
              ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
              seekToRatio(e.clientX)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') { e.stopPropagation(); seekBy(5) }
              if (e.key === 'ArrowLeft') { e.stopPropagation(); seekBy(-5) }
            }}
          >
            <div className="blog-video__track">
              <div className="blog-video__fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="blog-video__knob" style={{ left: `${pct}%` }} />
          </div>
          <div className="blog-video__row">
            <button type="button" className="blog-video__btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? I.pause : I.play}</button>
            <button type="button" className="blog-video__btn" onClick={() => seekBy(-10)} aria-label="Back 10 seconds">{I.back10}</button>
            <button type="button" className="blog-video__btn" onClick={() => seekBy(10)} aria-label="Forward 10 seconds">{I.fwd10}</button>
            <span className="blog-video__time">{fmt(time)} / {fmt(duration)}</span>
            <span className="blog-video__spacer" />
            <button type="button" className="blog-video__btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? I.mute : I.vol}</button>
            {voiceOK ? (
              <button
                type="button"
                className={`blog-video__btn${listening ? ' is-live' : ''}`}
                onClick={toggleListening}
                aria-label={listening ? 'Stop voice control' : 'Voice control'}
                title="Voice control: say play, pause, mute, full screen…"
              >
                {I.mic}
              </button>
            ) : null}
            <button type="button" className="blog-video__btn" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {fullscreen ? I.exitFull : I.full}
            </button>
          </div>
        </div>
      </div>
      {caption ? <figcaption className="blog-caption">{caption}</figcaption> : null}
    </figure>
  )
}
