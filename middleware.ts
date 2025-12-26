import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const url = request.nextUrl.clone()
  const { pathname, hostname } = url
  
  // Handle Supabase magic link code on root URL - redirect to auth callback
  if (pathname === '/' && url.searchParams.has('code')) {
    const code = url.searchParams.get('code')
    return NextResponse.redirect(new URL(`/auth/callback?code=${code}`, request.url))
  }
  
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
        const { createServerClient } = await import('@supabase/ssr')
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll()
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                  res.cookies.set(name, value, options)
                })
              },
            },
          }
        )
        await supabase.auth.getSession()
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
