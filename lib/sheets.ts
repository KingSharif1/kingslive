import { google } from 'googleapis';

// Initialize the sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    project_id: process.env.GOOGLE_SHEETS_PROJECT_ID,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

if (!SPREADSHEET_ID) {
  throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set in environment variables');
}

export interface ReservationData {
  name: string;
  contact: string;
  attendLive: boolean;
  celebrateHome: boolean;
}

export async function addReservation(data: ReservationData) {
  try {
    const timestamp = new Date().toISOString();
    const values = [
      [
        timestamp,
        data.name,
        data.contact,
        data.attendLive ? 'Yes' : 'No',
        data.celebrateHome ? 'Yes' : 'No',
      ],
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:E', // Assumes the first sheet is used
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    return response.data;
  } catch (error: unknown) {
    console.error('Detailed sheets error:', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      response: (error as any)?.response?.data
    });
    throw error;
  }
}
