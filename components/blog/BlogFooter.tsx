'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

// Blog footer with a canvas ember field behind the content.
// - Light mode: sparks drifting over warm paper.
// - Dark mode: glowing embers over near-black.
// - Fades out of the page (canvas paints transparent -> tone gradient).
// - Sprite-based rendering + delta-time motion: smooth on mobile.
// - Embers dissolve before reaching the top edge, never pop.
// - rAF loop, DPR capped, pauses off-screen, static frame under
//   prefers-reduced-motion. Zero assets.
const WORD = 'cerebration'

type Palette = {
  top: string
  bottom: string
  hueMin: number
  hueMax: number
  glow: boolean
  coreLight: number
}

const LIGHT: Palette = {
  top: '236,224,201',
  bottom: '224,207,174',
  hueMin: 10,
  hueMax: 30,
  glow: false,
  coreLight: 46,
}

const DARK: Palette = {
  top: '13,10,6',
  bottom: '36,26,16',
  hueMin: 18,
  hueMax: 46,
  glow: true,
  coreLight: 68,
}

type Ember = {
  x0: number
  y: number
  vy: number
  freq: number
  phase: number
  amp: number
  size: number
  hue: number
  alpha: number
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// Pre-rendered glow sprite per hue bucket: one drawImage per ember,
// far cheaper than arcs + shadowBlur every frame.
function makeSprite(hue: number, glow: boolean, coreLight: number): HTMLCanvasElement {
  const s = 64
  const c = document.createElement('canvas')
  c.width = s
  c.height = s
  const g = c.getContext('2d')
  if (!g) return c
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, `hsla(${hue},95%,${coreLight}%,0.95)`)
  grad.addColorStop(0.28, `hsla(${hue},90%,${coreLight - 8}%,0.45)`)
  grad.addColorStop(1, `hsla(${hue},85%,55%,0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  return c
}

export default function BlogFooter() {
  const footerRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const year = new Date().getFullYear()

  useEffect(() => {
    const footer = footerRef.current
    const canvas = canvasRef.current
    if (!footer || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let embers: Ember[] = []
    let visible = false
    let raf = 0
    let last = 0
    let pal: Palette = LIGHT
    const sprites = new Map<number, HTMLCanvasElement>()

    const spriteFor = (hue: number): HTMLCanvasElement => {
      const bucket = Math.round(hue / 5) * 5
      let s = sprites.get(bucket)
      if (!s) {
        s = makeSprite(bucket, pal.glow, pal.coreLight)
        sprites.set(bucket, s)
      }
      return s
    }

    const detectTheme = () => {
      const dark =
        document.documentElement.classList.contains('dark') ||
        !!footer.closest('.blog-world.dark')
      const next = dark ? DARK : LIGHT
      if (next !== pal) {
        pal = next
        sprites.clear()
        for (const p of embers) p.hue = rnd(pal.hueMin, pal.hueMax)
      }
    }

    const spawn = (anywhere: boolean): Ember => ({
      x0: rnd(0, w),
      y: anywhere ? rnd(0, h) : h + 24,
      vy: rnd(22, 62), // px per second
      freq: rnd(0.6, 1.4),
      phase: rnd(0, Math.PI * 2),
      amp: rnd(6, 18),
      size: rnd(2.2, 5.2),
      hue: rnd(pal.hueMin, pal.hueMax),
      alpha: rnd(0.45, 0.95),
    })

    const countFor = (width: number) => Math.max(36, Math.min(85, Math.round(width / 16)))

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      embers = Array.from({ length: countFor(w) }, () => spawn(true))
      draw(0)
    }

    const draw = (t: number) => {
      // page fade: transparent at top -> full tone lower down
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, `rgba(${pal.top},0)`)
      grad.addColorStop(0.45, `rgba(${pal.top},0.55)`)
      grad.addColorStop(0.72, `rgba(${pal.top},1)`)
      grad.addColorStop(1, `rgba(${pal.bottom},1)`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      if (pal.glow) ctx.globalCompositeOperation = 'lighter'
      for (const p of embers) {
        // dissolve before the top edge: gone by y=8, full by y=140
        const topFade = clamp01((p.y - 8) / 132)
        // ease in from below
        const botFade = clamp01((h - p.y + 30) / 90)
        const fade = topFade * botFade
        if (fade <= 0.01) continue
        const x = p.x0 + Math.sin(t * 0.00045 * p.freq + p.phase) * p.amp
        const s = p.size * (0.55 + 0.45 * fade)
        ctx.globalAlpha = fade * p.alpha
        ctx.drawImage(spriteFor(p.hue), x - s * 3, p.y - s * 3, s * 6, s * 6)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible) {
        last = t
        return
      }
      const dt = Math.min(50, t - (last || t)) / 1000 // seconds, clamped
      last = t
      for (let i = 0; i < embers.length; i++) {
        const p = embers[i]
        p.y -= p.vy * dt
        if (p.y < -24) embers[i] = spawn(false)
      }
      draw(t)
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false
      },
      { threshold: 0.05 }
    )
    io.observe(canvas)

    detectTheme()
    const mo = new MutationObserver(detectTheme)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    const world = footer.closest('.blog-world')
    if (world) mo.observe(world, { attributes: true, attributeFilter: ['class'] })

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    resize()
    if (!reduced) {
      raf = requestAnimationFrame(tick)
    }
    // reduced-motion: the single draw() inside resize() is the static frame

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      mo.disconnect()
      ro.disconnect()
    }
  }, [])

  return (
    <footer ref={footerRef} className="blog-footer blog-footer--embers">
      <canvas ref={canvasRef} className="blog-footer__canvas" aria-hidden="true" />
      <div className="blog-footer__inner">
        <p className="blog-footer__kicker">Cerebration — a library of building in public</p>
        <nav className="blog-footer__links" aria-label="Footer">
          <Link href="/blog">Library</Link>
          <Link href="/">Portfolio</Link>
          <a href="https://x.com/princeThe_great" target="_blank" rel="noopener noreferrer">
            X
          </a>
          <a href="https://instagram.com/k1ngsharif" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="https://github.com/KingSharif1" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
      </div>
      <p className="blog-footer__word" aria-hidden="true">
        {WORD.split('').map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </p>
      <div className="blog-footer__base">
        <span>© {year} King Sharif</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  )
}
