import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Auth callback route handler for Supabase magic link authentication.
 * This route exchanges the code from the magic link URL for a session.
 * 
 * Flow:
 * 1. User clicks magic link in email
 * 2. Supabase redirects to this callback with ?code=xxx
 * 3. We exchange the code for a session
 * 4. Redirect to /ctroom with the user now authenticated
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/ctroom'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      // Redirect to ctroom anyway, it will show login form if auth failed
    }
  }

  // Redirect to the intended destination
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
