import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import path from 'path';

export async function GET() {
  try {
    // サービスアカウントを使って認証
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'google-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 情報を取得するスプレッドシートのIDと範囲
    const spreadsheetId = '1tiULGVsagDyL-OTEaWv0znPN-3fM3TX6Yi-p50jsGus';
    const range = '全機材・車両リスト!A:P';

    // APIを叩いてデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values;

    if (!values || values.length === 0) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    // まずは加工せずに、取得したデータをそのまま返す
    return NextResponse.json({ values });

  } catch (error) {
    console.error('Error fetching from Google Sheets API:', error);
    const message = (error && typeof error === 'object' && 'message' in error) ? (error as {message: string}).message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch sheet data', details: message }, { status: 500 });
  }
}
