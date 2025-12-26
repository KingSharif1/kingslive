import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Secret Passphrase Authentication API
 * Allows admin to login with a secret passphrase instead of magic links
 */
export async function POST(request: NextRequest) {
  try {
    const { passphrase } = await request.json()

    if (!passphrase) {
      return NextResponse.json({ error: 'Passphrase required' }, { status: 400 })
    }

    // Get the secret passphrase from environment
    const secretPassphrase = process.env.CTROOM_SECRET_PASSPHRASE
    const adminEmail = process.env.CTROOM_ADMIN_EMAIL || 'sharifahmed.dev@gmail.com'

    if (!secretPassphrase) {
      console.error('CTROOM_SECRET_PASSPHRASE not configured')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    // Verify passphrase
    if (passphrase !== secretPassphrase) {
      return NextResponse.json({ error: 'Invalid passphrase' }, { status: 401 })
    }

    // Passphrase is correct - create a session token
    const cookieStore = await cookies()
    
    // Create a simple session token (hash of passphrase + timestamp)
    const sessionToken = Buffer.from(`${adminEmail}:${Date.now()}:${secretPassphrase}`).toString('base64')
    
    // Set session cookie that lasts 30 days
    cookieStore.set('ctroom_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    // Also set a readable cookie for client-side checks
    cookieStore.set('ctroom_authenticated', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome to the Control Room',
      user: {
        email: adminEmail,
        isAdmin: true
      }
    })

  } catch (error) {
    console.error('Passphrase auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

/**
 * Verify session is still valid
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('ctroom_session')?.value
    const adminEmail = process.env.CTROOM_ADMIN_EMAIL || 'sharifahmed.dev@gmail.com'

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Decode and verify token
    try {
      const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
      const [email] = decoded.split(':')
      
      if (email === adminEmail) {
        return NextResponse.json({ 
          authenticated: true,
          user: {
            email: adminEmail,
            isAdmin: true
          }
        })
      }
    } catch {
      // Invalid token format
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })

  } catch (error) {
    console.error('Session verify error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

/**
 * Logout - clear session
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Clear session cookies
    cookieStore.delete('ctroom_session')
    cookieStore.delete('ctroom_authenticated')

    return NextResponse.json({ success: true, message: 'Logged out successfully' })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
