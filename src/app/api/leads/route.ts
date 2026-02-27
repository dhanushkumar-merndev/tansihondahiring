import { NextRequest, NextResponse } from 'next/server';
import { sheets, SHEET_ID } from '@/lib/google';

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'CRM!A2:G',
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json([]);
    }

    const leads = rows.map((row, index) => ({
      rowIndex: index + 2, // A2 is zero-indexed row 0 in response, so rowIndex is index + 2
      created_time: row[0] || '',
      position: row[1] || '',
      full_name: row[2] || '',
      phone: row[3] || '',
      email: row[4] || '',
      status: row[5] || 'Pending',
      feedback: row[6] || '',
    }));

    // Sort by created_time descending (newest first)
    leads.sort((a, b) => {
      return new Date(b.created_time).getTime() - new Date(a.created_time).getTime();
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rowIndex, status, feedback } = await req.json();

    if (!rowIndex || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `CRM!F${rowIndex}:G${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[status, feedback]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
