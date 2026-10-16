'use client'

import { useRef, useState, type ReactNode, type MouseEvent } from 'react'

/* 3D tilt wrapper — cards respond to the cursor with real perspective depth.
   On touch devices it degrades gracefully to the flat hover lift. */
export default function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState({ rx: 0, ry: 0, glowX: 50, glowY: 50 })

  function onMove(e: MouseEvent) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    // max ~7deg tilt, eased toward edges
    setStyle({
      rx: (0.5 - py) * 14,
      ry: (px - 0.5) * 14,
      glowX: px * 100,
      glowY: py * 100,
    })
  }

  function onLeave() {
    setStyle({ rx: 0, ry: 0, glowX: 50, glowY: 50 })
  }

  return (
    <div className="tilt-scene">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={`tilt-card ${className}`}
        style={
          {
            '--rx': `${style.rx}deg`,
            '--ry': `${style.ry}deg`,
            '--gx': `${style.glowX}%`,
            '--gy': `${style.glowY}%`,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </div>
  )
}
