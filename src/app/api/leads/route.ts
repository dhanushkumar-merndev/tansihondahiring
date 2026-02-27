import { NextRequest, NextResponse } from 'next/server';
import { sheets, SHEET_ID } from '@/lib/google';
import { getLeads } from '@/lib/leads';

// Simple in-memory cache
let cachedLeads: any[] | null = null;
let lastFetched = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function GET() {
  const now = Date.now();
  
  if (cachedLeads && (now - lastFetched < CACHE_TTL)) {
    return NextResponse.json(cachedLeads);
  }

  try {
    const leads = await getLeads();
    cachedLeads = leads;
    lastFetched = now;
    return NextResponse.json(leads);
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rowIndex, status, feedback, interested } = await req.json();

    if (!rowIndex || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Write status (F), feedback (G), interested (H)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `CRM!F${rowIndex}:H${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[status, feedback, interested || '']],
      },
    });

    // Invalidate cache on update
    cachedLeads = null;
    lastFetched = 0;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
