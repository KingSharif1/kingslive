import { NextResponse } from 'next/server';
import { addReservation } from '@/lib/sheets';
import { emailApi } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Received reservation data:', data);
    
    // Add to Google Sheets
    try {
      await addReservation(data);
      console.log('Successfully added to Google Sheets');
    } catch (error) {
      console.error('Google Sheets Error:', error);
      return NextResponse.json({ error: 'Failed to save to Google Sheets' }, { status: 500 });
    }

    // Send email notification
    try {
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
      console.log('Successfully sent email notification');
    } catch (error) {
      console.error('Email Error:', error);
      // Continue even if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
