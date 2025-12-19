import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Sign out on server side
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Server-side sign out error:', error)
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      )
    }
    
    // Create a response that will also clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Successfully signed out'
    })
    
    // Clear auth cookies from response
    response.cookies.set('sb-access-token', '', { 
      maxAge: 0,
      path: '/' 
    })
    response.cookies.set('sb-refresh-token', '', { 
      maxAge: 0,
      path: '/' 
    })
    
    return response
  } catch (error) {
    console.error('API error during sign out:', error)
    return NextResponse.json(
      { error: 'Internal server error during sign out' },
      { status: 500 }
    )
  }
}
