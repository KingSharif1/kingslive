import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminEmail } from '../../middleware'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const isAdmin = await verifyAdminEmail(email)

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
