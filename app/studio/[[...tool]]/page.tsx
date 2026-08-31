/**
 * Sanity Studio — client-only so PTE quote markup cannot hydrate against
 * invalid <p><div> HTML that Sanity UI emits for blockquotes.
 */

import { StudioClient } from './StudioClient'

export const dynamic = 'force-static'

export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
  return <StudioClient />
}
