import { Analysis, Video } from '@/types';

const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

export async function syncToGoogleSheets(
  video: Video,
  analysis: Analysis
): Promise<boolean> {
  if (!GOOGLE_SHEETS_API_KEY || !SPREADSHEET_ID) {
    console.warn('Google Sheets not configured, skipping sync');
    return false;
  }

  try {
    const row = [
      video.title,
      video.channel_name,
      analysis.category,
      analysis.risk_score.toString(),
      analysis.action,
      analysis.risk_level,
      new Date().toISOString(),
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:lastColumn:append?valueInputOption=RAW`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GOOGLE_SHEETS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return false;
  }
}

export function isGoogleSheetsConfigured(): boolean {
  return !!(GOOGLE_SHEETS_API_KEY && SPREADSHEET_ID);
}