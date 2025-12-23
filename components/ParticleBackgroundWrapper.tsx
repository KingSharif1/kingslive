'use client'

import dynamic from 'next/dynamic'

const ParticleBackground = dynamic(
  () => import('@/components/ParticleBackground').then(mod => ({ default: mod.ParticleBackground })),
  { ssr: false }
)

export function ParticleBackgroundWrapper() {
  return <ParticleBackground />
}
