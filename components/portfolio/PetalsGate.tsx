'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const ParticleBackground = dynamic(
  () => import('@/components/ParticleBackground').then((mod) => ({ default: mod.ParticleBackground })),
  { ssr: false }
)

/** Canvas petals stay off phones and reduced-motion. The chunk is not downloaded there. */
export function PetalsGate() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const wide = window.matchMedia('(min-width: 768px)')
    const update = () => setShow(wide.matches && !motion.matches)
    update()
    wide.addEventListener('change', update)
    motion.addEventListener('change', update)
    return () => {
      wide.removeEventListener('change', update)
      motion.removeEventListener('change', update)
    }
  }, [])

  if (!show) return null
  return <ParticleBackground />
}
