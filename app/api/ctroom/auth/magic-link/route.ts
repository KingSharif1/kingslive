import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailApi } from '@/lib/email'
import { verifyAdminEmail } from '../../middleware'

/**
 * Custom magic-link sender.
 *
 * Supabase's built-in Auth email (GoTrue /otp) is failing with
 * "Error sending magic link email" — usually rate limits or SMTP config.
 * We generate the link with the service role and deliver it via Brevo instead.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const isAdmin = await verifyAdminEmail(cleanEmail)

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Only admin users can login.' },
        { status: 403 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing Supabase admin credentials')
      return NextResponse.json({ error: 'Auth service misconfigured' }, { status: 500 })
    }

    if (!process.env.BREVO_API_KEY) {
      console.error('Missing BREVO_API_KEY — cannot deliver magic link')
      return NextResponse.json(
        { error: 'Email delivery is not configured. Contact the site owner.' },
        { status: 500 }
      )
    }

    const origin = new URL(request.url).origin
    const safeRedirect =
      typeof redirectTo === 'string' && redirectTo.startsWith(origin)
        ? redirectTo
        : `${origin}/auth/callback`

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail,
      options: { redirectTo: safeRedirect },
    })

    const tokenHash = data?.properties?.hashed_token
    if (linkError || !tokenHash) {
      console.error('generateLink failed:', linkError)
      return NextResponse.json(
        { error: linkError?.message || 'Failed to generate magic link' },
        { status: 500 }
      )
    }

    // PKCE-incompatible: do not email action_link. Use hashed_token + verifyOtp in /auth/callback.
    const loginUrl = new URL(safeRedirect)
    loginUrl.searchParams.set('token_hash', tokenHash)
    loginUrl.searchParams.set('type', 'magiclink')
    const actionLink = loginUrl.toString()

    try {
      await emailApi.post('/smtp/email', {
        sender: {
          name: 'CTROOM HQ',
          email: 'no-reply@kingsharif.com',
        },
        to: [{ email: cleanEmail }],
        subject: 'Your CTROOM magic link',
        htmlContent: `
          <html>
            <body style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:#0a0a0c; color:#e5e5e5; padding:32px;">
              <div style="max-width:480px;margin:0 auto;border:1px solid rgba(0,255,136,0.25);border-radius:16px;padding:28px;background:rgba(255,255,255,0.03);">
                <p style="color:#00ff88;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">CTROOM HQ ACCESS</p>
                <h1 style="font-size:20px;margin:0 0 12px;color:#fff;">Authenticate</h1>
                <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.65);margin:0 0 24px;">
                  Click the button below to sign in. This link expires in about one hour and can only be used once.
                </p>
                <a href="${actionLink}"
                   style="display:inline-block;background:rgba(0,255,136,0.14);border:1px solid rgba(0,255,136,0.35);color:#00ff88;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">
                  Enter CTROOM
                </a>
                <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:28px 0 0;line-height:1.5;">
                  If you did not request this, you can ignore this email.<br/>
                  Or paste this URL into your browser:<br/>
                  <span style="word-break:break-all;color:rgba(255,255,255,0.5);">${actionLink}</span>
                </p>
              </div>
            </body>
          </html>
        `,
      })
    } catch (emailErr: unknown) {
      const axiosErr = emailErr as { response?: { status?: number; data?: unknown } }
      console.error(
        'Brevo magic-link send failed:',
        axiosErr.response?.status,
        axiosErr.response?.data ?? emailErr
      )
      return NextResponse.json(
        { error: 'Error sending magic link email' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, magicLinkSent: true })
  } catch (error) {
    console.error('magic-link route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
