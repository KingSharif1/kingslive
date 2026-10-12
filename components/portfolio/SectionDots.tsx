'use client'

import { useEffect, useState } from 'react'

const SECTIONS = ['intro', 'projects', 'skills', 'connect'] as const

export function SectionDots() {
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    // Dots are hidden below lg. Skip the observer on phones.
    if (window.matchMedia('(max-width: 1023px)').matches) return

    const elements = SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el)
    )
    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { threshold: 0.5 }
    )
    elements.forEach((el) => observer.observe(el))

    for (const section of elements) {
      const { top, bottom } = section.getBoundingClientRect()
      if (top <= window.innerHeight / 2 && bottom >= window.innerHeight / 2) {
        setActiveSection(section.id)
        break
      }
    }

    return () => observer.disconnect()
  }, [])

  return (
    <nav className="fixed left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
      <div className="flex flex-col gap-4">
        {SECTIONS.map((section) => (
          <button
            key={section}
            onClick={() => {
              const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
              document.getElementById(section)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
            }}
            className={`w-2 h-8 rounded-full transition-all duration-500 ${
              activeSection === section ? 'bg-foreground' : 'bg-ring hover:bg-muted-foreground'
            }`}
            aria-label={`Navigate to ${section}`}
          />
        ))}
      </div>
    </nav>
  )
}
