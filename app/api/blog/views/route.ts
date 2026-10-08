import { NextRequest, NextResponse } from 'next/server'
import { SchemaUnavailableError, visitorFromCookie, VISITOR_COOKIE } from '@/lib/blog/engagement'
import { getEngagementStore } from '@/lib/blog/engagement-store'
import { handleViewPost } from '@/lib/blog/handlers'
import { respond } from '@/lib/blog/respond'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const visitor = visitorFromCookie(request.cookies.get(VISITOR_COOKIE)?.value)
  let body: unknown = null
  try {
    body = await request.json()
  } catch {
    body = null
  }
  const purpose = request.headers.get('purpose') || request.headers.get('sec-purpose')
  try {
    const store = getEngagementStore()
    return respond(await handleViewPost({
      body,
      visitorId: visitor.id,
      isNewVisitor: visitor.isNew,
      userAgent: request.headers.get('user-agent'),
      purpose,
      store,
    }))
  } catch (error) {
    if (error instanceof SchemaUnavailableError) {
      return respond({
        status: 200,
        body: { counted: false, views: 0, unavailable: true },
        visitorCookie: visitor.isNew ? visitor.id : undefined,
      })
    }
    console.error('views POST failed', error)
    return NextResponse.json({ counted: false, views: 0 })
  }
}
