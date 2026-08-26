/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 */

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'

export const dynamic = 'force-static'

export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
  return <NextStudio config={config} />
}
