import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const url = request.nextUrl.clone()
  const { pathname, hostname } = url
  
  // ONLY run Supabase auth for protected routes like /ctroom or /admin
  const isProtectedRoute = pathname.startsWith('/ctroom') || pathname.startsWith('/admin')
  
  if (isProtectedRoute) {
    // Check for auth cookie presence first
    const hasAuthCookie = request.cookies.getAll().some(
      cookie => cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
    )
    
    // Only dynamically import and use Supabase if there's an auth cookie
    if (hasAuthCookie) {
      try {
        const { createMiddlewareClient } = await import('@supabase/auth-helpers-nextjs')
        const supabase = createMiddlewareClient({ req: request, res })
        // Use a timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        )
        await Promise.race([sessionPromise, timeoutPromise])
      } catch {
        // Silently fail - don't block the request
      }
    }
  }
  
  // Check if we're on a subdomain
  const currentHost = hostname.split('.').filter(Boolean)
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
  
  // Handle blog subdomain
  if (currentHost[0] === 'blog') {
    url.pathname = `/blog${pathname}`
    return NextResponse.rewrite(url)
  }
  
  // Handle ctroom subdomain (admin)
  if (currentHost[0] === 'ctroom' || currentHost[0] === 'ctr') {
    url.pathname = `/admin${pathname}`
    return NextResponse.rewrite(url)
  }
  
  return res
}

export const config = {
  matcher: [
    // Only run middleware on specific paths - exclude all static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
