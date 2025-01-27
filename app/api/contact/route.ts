import { NextResponse } from 'next/server'
import { emailApi } from '@/lib/email'
import { AxiosError } from 'axios'

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    await emailApi.post('/smtp/email', {
      sender: {
        name: 'Contact Form',
        email: 'no-reply@kingsharif.live'
      },
      to: [{
        email: process.env.CONTACT_EMAIL_RECIPIENT,
        name: 'King Sharif'
      }],
      replyTo: {
        email: email,
        name: name
      },
      subject: 'New Contact Form Submission',
      htmlContent: `
        <html>
          <body>
            <h1>New Contact Form Submission</h1>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong> ${message}</p>
          </body>
        </html>
      `
    })

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error sending email:', error)
    
    if (error instanceof AxiosError) {
      const errorMessage = error.response?.data?.message || error.message
      return NextResponse.json(
        { 
          message: 'Error sending email', 
          details: errorMessage 
        }, 
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json(
      { message: 'Error sending email' }, 
      { status: 500 }
    )
  }
}
