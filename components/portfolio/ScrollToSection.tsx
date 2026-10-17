'use client'

import type { ReactNode } from 'react'

export function ScrollToSection({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
      }}
    >
      {children}
    </button>
  )
}
