'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

// Floating back-to-top button. Appears once the reader has scrolled past
// ~10% of the page, hides again near the top.
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement
        const max = doc.scrollHeight - doc.clientHeight
        const ratio = max > 0 ? window.scrollY / max : 0
        setVisible(ratio > 0.1 && window.scrollY > 240)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <button
      type="button"
      className="blog-totop"
      data-visible={visible}
      aria-label="Back to top"
      title="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
