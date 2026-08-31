'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const ParticleBackground = dynamic(
  () => import('@/components/ParticleBackground').then((mod) => ({ default: mod.ParticleBackground })),
  { ssr: false }
)

const PUBLIC_FLOWERS = new Set(['/', '/privacy', '/terms'])

export function ParticleBackgroundWrapper() {
  const pathname = usePathname() || '/'
  if (!PUBLIC_FLOWERS.has(pathname)) return null
  return <ParticleBackground />
}
