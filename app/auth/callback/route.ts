import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Auth callback route handler for Supabase magic link authentication.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle errors from Supabase
  if (error) {
    console.error('Auth error:', error, errorDescription)
    return NextResponse.redirect(new URL('/ctroom', requestUrl.origin))
  }

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore - middleware will handle session refresh
            }
          },
        },
      }
    )
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Error exchanging code for session:', error)
      } else {
        console.log('Session created for:', data.user?.email)
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error)
    }
  }

  // Redirect to /ctroom — set ctroom_last_active so the inactivity check passes on first arrival
  const redirectRes = NextResponse.redirect(new URL('/ctroom', requestUrl.origin), { status: 303 })
  redirectRes.cookies.set('ctroom_last_active', Date.now().toString(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 5, // 5 hours (matches inactivity window)
    path: '/',
  })
  return redirectRes
}
