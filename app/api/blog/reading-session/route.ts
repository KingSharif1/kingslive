import { NextRequest, NextResponse } from 'next/server'
import {
  SchemaUnavailableError,
  shouldSkipView,
  validateReadingSessionBody,
} from '@/lib/blog/engagement'
import { getEngagementStore } from '@/lib/blog/engagement-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Receives one reading-session beacon per page view (navigator.sendBeacon on
 * pagehide). Bots and prefetches are ignored. Writes go through the
 * service-role store; a missing table degrades to a quiet no-op so a
 * half-migrated database never breaks the blog.
 */
export async function POST(request: NextRequest) {
  let body: unknown = null
  try {
    body = await request.json()
  } catch {
    body = null
  }
  const parsed = validateReadingSessionBody(body)
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
  }
  const purpose = request.headers.get('purpose') || request.headers.get('sec-purpose')
  if (shouldSkipView(request.headers.get('user-agent'), purpose)) {
    return NextResponse.json({ ok: true, skipped: true })
  }
  try {
    const store = getEngagementStore()
    return NextResponse.json(await store.recordReadingSession(parsed.input))
  } catch (error) {
    if (error instanceof SchemaUnavailableError) {
      return NextResponse.json({ ok: false, unavailable: true })
    }
    console.error('reading-session POST failed', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
