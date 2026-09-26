'use client'

import { useEffect, useRef } from 'react'

type Mote = {
  x: number
  y: number
  size: number
  kind: 0 | 1 | 2 | 3 // dot, ring, plus, sparkle
  vy: number
  swayAmp: number
  swayFreq: number
  phase: number
  alpha: number
  rot: number
  rotSpeed: number
}

type Plane = {
  active: boolean
  t: number
  dur: number
  fromLeft: boolean
  y: number
  size: number
}

/**
 * BlogDrift — a very light ambient background for the blog "room".
 * A fixed canvas of slow-drifting ink doodles (dots, rings, plus marks,
 * sparkles) plus the occasional tiny paper plane gliding across.
 *
 * Perf notes: ~20 objects, one rAF loop, DPR capped at 1.5, loop pauses
 * when the tab is hidden. Renders a single static frame when the user
 * prefers reduced motion.
 */
export default function BlogDrift({ ink = '#1a1612' }: { ink?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inkRef = useRef(ink)
  inkRef.current = ink

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let w = 0
    let h = 0
    let raf = 0
    let running = true

    const rand = (min: number, max: number) => min + Math.random() * (max - min)

    const makeMote = (initial: boolean): Mote => ({
      x: rand(0, w),
      y: initial ? rand(0, h) : h + 12,
      size: rand(3, 9),
      kind: Math.floor(rand(0, 4)) as Mote['kind'],
      vy: rand(5, 13), // px per second — slow
      swayAmp: rand(6, 22),
      swayFreq: rand(0.2, 0.6),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.07, 0.16),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.4, 0.4),
    })

    let motes: Mote[] = []
    const plane: Plane = { active: false, t: 0, dur: 9, fromLeft: true, y: 0, size: 16 }
    let nextPlaneIn = rand(6, 14) // seconds until first plane

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (motes.length === 0) {
        const count = Math.min(26, Math.max(12, Math.floor((w * h) / 90000)))
        motes = Array.from({ length: count }, () => makeMote(true))
      }
    }

    const drawMote = (m: Mote, time: number) => {
      const x = m.x + Math.sin(time * m.swayFreq + m.phase) * m.swayAmp
      const y = m.y
      ctx.save()
      ctx.globalAlpha = m.alpha
      ctx.strokeStyle = inkRef.current
      ctx.fillStyle = inkRef.current
      ctx.lineWidth = 1.2
      ctx.translate(x, y)
      ctx.rotate(m.rot + time * m.rotSpeed)
      const s = m.size
      if (m.kind === 0) {
        ctx.beginPath()
        ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2)
        ctx.fill()
      } else if (m.kind === 1) {
        ctx.beginPath()
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2)
        ctx.stroke()
      } else if (m.kind === 2) {
        ctx.beginPath()
        ctx.moveTo(-s * 0.5, 0)
        ctx.lineTo(s * 0.5, 0)
        ctx.moveTo(0, -s * 0.5)
        ctx.lineTo(0, s * 0.5)
        ctx.stroke()
      } else {
        // 4-point sparkle
        ctx.beginPath()
        ctx.moveTo(0, -s * 0.6)
        ctx.quadraticCurveTo(0, 0, s * 0.6, 0)
        ctx.quadraticCurveTo(0, 0, 0, s * 0.6)
        ctx.quadraticCurveTo(0, 0, -s * 0.6, 0)
        ctx.quadraticCurveTo(0, 0, 0, -s * 0.6)
        ctx.stroke()
      }
      ctx.restore()
    }

    const drawPlane = () => {
      const p = plane.t / plane.dur
      if (p > 1) {
        plane.active = false
        return
      }
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
      const x = plane.fromLeft ? -40 + ease * (w + 80) : w + 40 - ease * (w + 80)
      const y = plane.y + Math.sin(p * Math.PI * 3) * 10
      const tilt = plane.fromLeft ? 0.12 : Math.PI - 0.12
      ctx.save()
      ctx.globalAlpha = 0.2
      ctx.strokeStyle = inkRef.current
      ctx.lineWidth = 1.4
      ctx.translate(x, y)
      ctx.rotate(tilt)
      const s = plane.size
      // simple paper-plane silhouette
      ctx.beginPath()
      ctx.moveTo(s, 0)
      ctx.lineTo(-s * 0.7, -s * 0.45)
      ctx.lineTo(-s * 0.35, 0)
      ctx.lineTo(-s * 0.7, s * 0.45)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(s, 0)
      ctx.lineTo(-s * 0.35, 0)
      ctx.stroke()
      ctx.restore()
    }

    let last = performance.now()
    const frame = (now: number) => {
      if (!running) return
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const time = now / 1000

      ctx.clearRect(0, 0, w, h)

      for (const m of motes) {
        m.y -= m.vy * dt
        if (m.y < -16) Object.assign(m, makeMote(false))
        drawMote(m, time)
      }

      if (plane.active) {
        plane.t += dt
        drawPlane()
      } else {
        nextPlaneIn -= dt
        if (nextPlaneIn <= 0) {
          plane.active = true
          plane.t = 0
          plane.dur = rand(8, 12)
          plane.fromLeft = Math.random() > 0.5
          plane.y = rand(h * 0.15, h * 0.7)
          plane.size = rand(12, 20)
          nextPlaneIn = rand(22, 38)
        }
      }

      raf = requestAnimationFrame(frame)
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!reduced && running === false) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)

    if (reduced) {
      // one static sprinkle, no motion
      ctx.clearRect(0, 0, w, h)
      for (const m of motes) drawMote(m, 0)
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="blog-drift" aria-hidden="true" />
}
