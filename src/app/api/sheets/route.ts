import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// This function will handle the GET request to /api/sheets
export async function GET() {
  // 1. Decode Credentials from Base64
  let credentials;
  const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_JSON;

  if (!credentialsBase64) {
    // If the environment variable is not set, return an error
    return NextResponse.json({ error: "GOOGLE_CREDENTIALS_JSON is not set." }, { status: 500 });
  }

  try {
    // Vercel auto-decodes the Base64 string, so we can parse it directly.
    credentials = JSON.parse(credentialsBase64);
  } catch (error) {
    // If parsing fails, return an error
    console.error("Failed to parse GOOGLE_CREDENTIALS_JSON:", error);
    return NextResponse.json({ error: "Could not parse Google credentials. Check the environment variable format." }, { status: 500 });
  }

  try {
    // 2. Authenticate with Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Use .readonly scope if you only need to read
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // --- IMPORTANT ---
    // Replace with your actual Spreadsheet ID and range
    const spreadsheetId = 'YOUR_SPREADSHEET_ID_HERE';
    const range = 'Sheet1!A1:B2'; // Example range

    // 3. Fetch data from the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    // 4. Return the fetched data
    return NextResponse.json({
      message: "Successfully fetched data from Google Sheets!",
      data: rows,
    });

  } catch (error) {
    // If API call fails, return an error
    console.error("The API returned an error: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to fetch data from Google Sheets.", details: errorMessage }, { status: 500 });
  }
}