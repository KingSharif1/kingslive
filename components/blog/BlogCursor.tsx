'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * BlogCursor — a small ink-dot + trailing ring cursor for the blog room.
 * Only activates on fine pointers (mouse/trackpad); touch devices keep
 * the native behavior. The native cursor is hidden via CSS
 * (.blog-cursor-on) except over text inputs, where the custom cursor
 * fades out so typing stays predictable.
 */
export default function BlogCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    setEnabled(true)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    document.documentElement.classList.add('blog-cursor-on')

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let x = -100
    let y = -100
    let rx = -100
    let ry = -100
    let raf = 0
    let visible = false

    const INTERACTIVE = 'a, button, [role="button"], input[type="submit"], input[type="search"], summary'
    const NATIVE = 'input, textarea, select, [contenteditable="true"]'

    const show = () => {
      if (!visible) {
        visible = true
        dot.style.opacity = '1'
        ring.style.opacity = '1'
      }
    }
    const hide = () => {
      if (visible) {
        visible = false
        dot.style.opacity = '0'
        ring.style.opacity = '0'
      }
    }

    const onMove = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
      const t = e.target as HTMLElement | null
      const overNative = !!t?.closest(NATIVE)
      const overInteractive = !!t?.closest(INTERACTIVE)
      if (overNative) {
        hide()
      } else {
        show()
      }
      dot.dataset.hot = overInteractive && !overNative ? '1' : ''
      ring.dataset.hot = overInteractive && !overNative ? '1' : ''
      if (reduced) {
        dot.style.transform = `translate(${x}px, ${y}px)`
        ring.style.transform = `translate(${x}px, ${y}px)`
        rx = x
        ry = y
      }
    }

    const onDown = () => {
      ring.dataset.press = '1'
    }
    const onUp = () => {
      ring.dataset.press = ''
    }
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) hide()
    }

    const loop = () => {
      if (!reduced) {
        // dot snaps fast, ring trails behind — the "ink" feel
        rx += (x - rx) * 0.16
        ry += (y - ry) * 0.16
        dot.style.transform = `translate(${x}px, ${y}px)`
        ring.style.transform = `translate(${rx}px, ${ry}px)`
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.classList.remove('blog-cursor-on')
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div ref={ringRef} className="blog-cursor__ring" aria-hidden="true" />
      <div ref={dotRef} className="blog-cursor__dot" aria-hidden="true" />
    </>
  )
}
