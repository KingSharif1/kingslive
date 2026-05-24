import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LAST_ACTIVE_COOKIE = 'ctroom_last_active'
const LAST_ACTIVE_MAX_AGE = 60 * 60 * 5 // 5 hours

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const { pathname, hostname } = url

  // Redirect magic link code from root URL to auth callback
  if (pathname === '/' && url.searchParams.has('code')) {
    return NextResponse.redirect(
      new URL(`/auth/callback?code=${url.searchParams.get('code')}`, request.url)
    )
  }

  // Subdomain routing
  const parts = hostname.split('.').filter(Boolean)
  if (parts[0] === 'blog') {
    url.pathname = `/blog${pathname}`
    return NextResponse.rewrite(url)
  }
  if (parts[0] === 'ctroom' || parts[0] === 'ctr') {
    url.pathname = `/admin${pathname}`
    return NextResponse.rewrite(url)
  }

  // Refresh Supabase session tokens on /ctroom routes
  if (pathname.startsWith('/ctroom')) {
    const res = NextResponse.next()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const lastActive = request.cookies.get(LAST_ACTIVE_COOKIE)?.value
      const now = Date.now()

      // If cookie is missing (expired after 5h) force sign-out
      if (!lastActive) {
        const signoutUrl = new URL('/api/auth/signout-redirect', request.url)
        return NextResponse.redirect(signoutUrl)
      }

      // Refresh the cookie on every request to keep the 5h window sliding
      res.cookies.set(LAST_ACTIVE_COOKIE, now.toString(), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: LAST_ACTIVE_MAX_AGE,
        path: '/',
      })
    }

    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',],
}
