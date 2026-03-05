import { NextRequest, NextResponse } from "next/server";
import { getLeads } from "../../../lib/leads";
import { SHEET_ID, sheets } from "../../../lib/google";

export const dynamic = "force-dynamic";

let cachedLeads: any[] | null = null;
let lastFetched = 0;
const CACHE_DURATION = 600000; // 10 minutes

export async function GET() {
  try {
    const now = Date.now();
    if (cachedLeads && now - lastFetched < CACHE_DURATION) {
      return NextResponse.json(cachedLeads, {
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": "no-store",
        },
      });
    }

    const leads = await getLeads();
    cachedLeads = leads;
    lastFetched = now;

    return NextResponse.json(leads, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rowIndex, status, feedback, interested, inprocess, updated_time } =
      await req.json();

    if (!rowIndex || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Write status (F), feedback (G), interested (H), inprocess (I), updated_time (J)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `CRM!F${rowIndex}:J${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [status, feedback, interested, inprocess || "", updated_time || ""],
        ],
      },
    });

    // Invalidate cache on update
    cachedLeads = null;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
