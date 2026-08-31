import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

const LAST_ACTIVE_MAX_AGE = 60 * 60 * 5 // 5 hours

/**
 * Auth callback for CTROOM magic links.
 * Supports PKCE (?code=) and admin generateLink (?token_hash=&type=magiclink).
 */
export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('Auth error:', error, errorDescription)
    return NextResponse.redirect(new URL('/ctroom', requestUrl.origin))
  }

  const redirectRes = NextResponse.redirect(new URL('/auth/complete', requestUrl.origin), {
    status: 303,
  })

  if (code || tokenHash) {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              redirectRes.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    try {
      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          console.error('Error exchanging code for session:', exchangeError)
        } else {
          console.log('Session created for:', data.user?.email)
        }
      } else if (tokenHash && type) {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          type: type as 'magiclink' | 'email',
          token_hash: tokenHash,
        })
        if (verifyError) {
          console.error('Error verifying magic link token:', verifyError)
        } else {
          console.log('Session created for:', data.user?.email)
        }
      }
    } catch (err) {
      console.error('Auth callback error:', err)
    }
  }

  redirectRes.cookies.set('ctroom_last_active', Date.now().toString(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: LAST_ACTIVE_MAX_AGE,
    path: '/',
  })

  return redirectRes
}
