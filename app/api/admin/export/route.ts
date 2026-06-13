/**
 * GET /api/admin/export[?format=csv] — full catalogue download (AC363).
 */
import { NextRequest, NextResponse } from "next/server";
import { exportCatalogue, toCsv } from "@/lib/admin/helpers";

export async function GET(req: NextRequest) {
  const rows = exportCatalogue();
  if (req.nextUrl.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="stateofus-catalogue-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
  return NextResponse.json(
    { exported_at: new Date().toISOString(), count: rows.length, questions: rows },
    {
      headers: {
        "Content-Disposition": `attachment; filename="stateofus-catalogue-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    }
  );
}
