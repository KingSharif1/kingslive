'use client'

import dynamic from 'next/dynamic'

const StudioApp = dynamic(() => import('./StudioApp'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Loading Studio…
    </div>
  ),
})

export function StudioClient() {
  return <StudioApp />
}
