'use client'

import { useEffect, useState } from 'react'

const ROLES = [
  'Web Developer',
  'Software Engineer',
  'Frontend Engineer',
  'Full Stack Engineer',
  'UX Engineer',
  'QA Engineer',
]

export function RotatingRole() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const id = window.setInterval(() => {
      setVisible(false)
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % ROLES.length)
        setVisible(true)
      }, 280)
    }, 2800)

    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="relative h-5 min-w-[11rem] overflow-hidden">
      <span
        className={`absolute inset-0 whitespace-nowrap transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {ROLES[index]}
      </span>
    </div>
  )
}
