import { NextResponse } from 'next/server';
import { addReservation } from '@/lib/sheets';
import { emailApi } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Add to Google Sheets
    await addReservation(data);

    // Send email notification
    await emailApi.post('/smtp/email', {
      sender: {
        name: 'Graduation RSVP',
        email: 'no-reply@kingsharif.live'
      },
      to: [{
        email: process.env.CONTACT_EMAIL_RECIPIENT,
        name: 'King Sharif'
      }],
      subject: 'New Graduation RSVP',
      htmlContent: `
        <html>
          <body>
            <h1>New Graduation RSVP</h1>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Contact:</strong> ${data.contact}</p>
            <p><strong>Attending Live:</strong> ${data.attendLive ? 'Yes' : 'No'}</p>
            <p><strong>Celebrating at Home:</strong> ${data.celebrateHome ? 'Yes' : 'No'}</p>
          </body>
        </html>
      `
    });

    return NextResponse.json({ message: 'Reservation recorded successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Detailed error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      return NextResponse.json(
        { message: 'Error processing reservation', error: error.message },
        { status: 500 }
      );
    }
    // Handle cases where error is not an Error object
    console.error('Unknown error:', error);
    return NextResponse.json(
      { message: 'Error processing reservation', error: 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
