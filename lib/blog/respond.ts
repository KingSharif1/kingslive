import { NextResponse } from 'next/server'
import { VISITOR_COOKIE, visitorCookieOptions } from '@/lib/blog/engagement'
import type { HandlerResult } from '@/lib/blog/handlers'

export function respond(result: HandlerResult): NextResponse {
  const res = NextResponse.json(result.body, { status: result.status })
  if (result.visitorCookie) {
    res.cookies.set(VISITOR_COOKIE, result.visitorCookie, visitorCookieOptions())
  }
  return res
}
