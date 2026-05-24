import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role key bypasses RLS — never expose this to the client
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Unified auth middleware for all ctroom API routes
 * Verifies user session and admin status in one call
 */
export async function verifyAdminAuth(request: NextRequest): Promise<
  { authorized: true; email: string } | { authorized: false; response: NextResponse }
> {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        )
      }
    }

    const token = authHeader.substring(7)

    // Verify token with Supabase
    const { data: { user }, error: userError } = await adminSupabase.auth.getUser(token)
    
    if (userError || !user?.email) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Invalid or expired session' },
          { status: 401 }
        )
      }
    }

    // Check if user is admin
    const { data: adminUsers, error: dbError } = await adminSupabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email.trim().toLowerCase())
      .limit(1)

    if (dbError) {
      console.error('Database error:', dbError)
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Database error occurred' },
          { status: 500 }
        )
      }
    }

    const isAdmin = adminUsers && adminUsers.length > 0

    if (!isAdmin) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Access denied. Admin only.' },
          { status: 403 }
        )
      }
    }

    // Success!
    return {
      authorized: true,
      email: user.email
    }

  } catch (error) {
    console.error('Auth middleware error:', error)
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Simpler version - just verify admin from email (for public endpoints like login)
 */
export async function verifyAdminEmail(email: string): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase()

    const { data: adminUsers, error } = await adminSupabase
      .from('admin_users')
      .select('email')
      .eq('email', cleanEmail)
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return false
    }

    return adminUsers && adminUsers.length > 0
  } catch (error) {
    console.error('Error verifying admin email:', error)
    return false
  }
}
