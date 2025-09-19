import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()
  const url = request.nextUrl.clone()
  const { pathname, hostname } = url
  
  // Check if we're on a subdomain
  const currentHost = hostname.split('.').filter(Boolean)
  
  // Check if we're on localhost
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
  
  // Handle blog subdomain
  if (currentHost[0] === 'blog' || (!isLocalhost && pathname.startsWith('/blog'))) {
    // If we're on blog.domain.com, rewrite to /blog
    if (currentHost[0] === 'blog') {
      url.pathname = `/blog${pathname}`
      return NextResponse.rewrite(url)
    }
  }
  
  // Handle ctroom subdomain (admin)
  if (currentHost[0] === 'ctroom' || currentHost[0] === 'ctr' || (!isLocalhost && pathname.startsWith('/admin'))) {
    // If we're on ctroom.domain.com or ctr.domain.com, rewrite to /admin
    if (currentHost[0] === 'ctroom' || currentHost[0] === 'ctr') {
      url.pathname = `/admin${pathname}`
      return NextResponse.rewrite(url)
    }
  }
  
  return res
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
