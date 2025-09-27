import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// --- デバッグコード（不要になったら削除してOKです） ---
const credentialsBase64ForDebug = process.env.GOOGLE_CREDENTIALS_BASE64;
if (credentialsBase64ForDebug) {
  try {
    const decodedJson = Buffer.from(credentialsBase64ForDebug, 'base64').toString('utf-8');
    JSON.parse(decodedJson);
    console.log("★★★★★ Vercel環境変数のJSONパースに成功！ ★★★★★");
  } catch (e) {
    console.error("!!!!!! Vercel環境変数のJSONパースに失敗 !!!!!!");
    console.error(e);
  }
} else {
  console.error("!!!!!! GOOGLE_CREDENTIALS_BASE64 環境変数が設定されていません !!!!!!");
}

// --- あなたのAPIコード ---
export async function GET() {
  let credentials;
  const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;

  if (!credentialsBase64) {
    return NextResponse.json({ error: "GOOGLE_CREDENTIALS_BASE64 is not set." }, { status: 500 });
  }

  try {
    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    credentials = JSON.parse(credentialsJson);
  } catch (error) {
    console.error("Failed to decode or parse GOOGLE_CREDENTIALS_BASE64:", error);
    return NextResponse.json({ error: "Could not decode or parse Google credentials from Base64." }, { status: 500 });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // ★★★ IDをあなたのものに書き換えました ★★★
    const spreadsheetId = '1tiULGVsagDyL-OTEaWv0znPN-3fM3TX6Yi-p50jsGus';
    
    // ★★★【修正済み】シート名と範囲を、あなたのスプレッドシートに合わせて変更しました ★★★
    const range = '全機材・車両リスト!A:Z'; // 'シート1'から'全機材・車両リスト'へ変更し、範囲もA列からZ列まで取得するように広げました。

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    return NextResponse.json({
      message: "Successfully fetched data from Google Sheets!",
      data: rows,
    });

  } catch (error) {
    console.error("The API returned an error: ", error);
    // errorオブジェクトがErrorインスタンスか確認し、安全にメッセージを取得します。
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Google APIからの詳細なエラーメッセージをフロントエンドに返すように変更しました。
    return NextResponse.json({ error: `Failed to fetch data from Google Sheets. Details: ${errorMessage}` }, { status: 500 });
  }
}