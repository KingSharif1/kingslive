import { NextRequest, NextResponse } from 'next/server'
import { SchemaUnavailableError, visitorFromCookie, VISITOR_COOKIE } from '@/lib/blog/engagement'
import { getEngagementStore } from '@/lib/blog/engagement-store'
import { handleCommentsGet, handleCommentsPost } from '@/lib/blog/handlers'
import { respond } from '@/lib/blog/respond'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function visitorOf(request: NextRequest) {
  return visitorFromCookie(request.cookies.get(VISITOR_COOKIE)?.value)
}

export async function GET(request: NextRequest) {
  try {
    const store = getEngagementStore()
    return respond(await handleCommentsGet({
      postId: request.nextUrl.searchParams.get('postId'),
      store,
    }))
  } catch (error) {
    if (error instanceof SchemaUnavailableError) {
      return NextResponse.json({ unavailable: true, comments: [] })
    }
    console.error('comments GET failed', error)
    return NextResponse.json({ error: 'Could not load comments.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const visitor = visitorOf(request)
  let body: unknown = null
  try {
    body = await request.json()
  } catch {
    body = null
  }
  try {
    const store = getEngagementStore()
    return respond(await handleCommentsPost({
      body,
      visitorId: visitor.id,
      isNewVisitor: visitor.isNew,
      store,
    }))
  } catch (error) {
    if (error instanceof SchemaUnavailableError) {
      return respond({
        status: 503,
        body: { unavailable: true, error: 'Comments are offline until this notebook’s database is updated.' },
        visitorCookie: visitor.isNew ? visitor.id : undefined,
      })
    }
    console.error('comments POST failed', error)
    return NextResponse.json({ error: 'Could not post that comment.' }, { status: 500 })
  }
}
