import { google } from 'googleapis';

// Initialize the sheets API
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

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
  } catch (error) {
    console.error('Error adding reservation:', error);
    throw error;
  }
}
