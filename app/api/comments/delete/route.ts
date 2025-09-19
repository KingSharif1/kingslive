import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }

    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
    }
    
    const token = authHeader.substring(7) // Remove "Bearer " prefix
    
    // Verify user session using Supabase auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey
      }
    })
    
    if (!authResponse.ok) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
    
    const userData = await authResponse.json()
    const userId = userData.id
    
    console.log('Session debug:', { hasUser: !!userId, userId })

    // Check if user is an admin using direct API call
    const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?id=eq.${userId}&select=id`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey
      }
    })

    if (!adminCheckResponse.ok) {
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 })
    }

    const adminData = await adminCheckResponse.json()
    if (!adminData || adminData.length === 0) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Delete comment using direct API call bypassing RLS
    const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/blog_comments?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
        'Prefer': 'return=minimal'
      }
    })
      
    if (!deleteResponse.ok) {
      console.error('Error deleting comment:', deleteResponse.statusText)
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }
    
    console.log('Comment deleted successfully')
    
    // Return success response
    return NextResponse.json({ success: true, message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error in comment deletion API:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
