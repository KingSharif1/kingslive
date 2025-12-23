import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    console.log('API received email:', `"${email}"`)

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    console.log('Cleaned email:', `"${cleanEmail}"`)

    // Server-side admin check - secure and hidden from client
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', cleanEmail)
      .limit(1)

    console.log('Database query result:', { adminUsers, error })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }

    const isAdmin = adminUsers && adminUsers.length > 0
    console.log('Final result:', { isAdmin, adminUsersLength: adminUsers?.length })

    return NextResponse.json({
      isAdmin,
      message: isAdmin ? 'Admin verified' : 'Access denied'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
