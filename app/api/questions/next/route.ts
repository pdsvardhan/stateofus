/**
 * GET /api/questions/next?after=<id> — the Skip / onward hop.
 *
 * AC338: Skip advances without recording an answer — the client simply
 * navigates to the id returned here; nothing is written.
 * Picks a random active question this device hasn't answered (falls back to
 * any active question when the device finished everything). feat-discovery
 * (build #12) layers related/editorial logic on top; this endpoint stays the
 * plain "next" primitive.
 */
import { NextRequest, NextResponse } from "next/server";
import { rawDb } from "@/lib/db/client";
import { getDevice } from "@/lib/identity";

export async function GET(req: NextRequest) {
  const after = req.nextUrl.searchParams.get("after");
  const device = await getDevice();

  const pickUnanswered = rawDb.prepare(
    `SELECT id FROM questions
     WHERE status = 'active' AND id != COALESCE(?, '')
       AND id NOT IN (SELECT question_id FROM answers WHERE device_id = COALESCE(?, -1))
     ORDER BY RANDOM() LIMIT 1`
  );
  const pickAny = rawDb.prepare(
    `SELECT id FROM questions WHERE status = 'active' AND id != COALESCE(?, '')
     ORDER BY RANDOM() LIMIT 1`
  );

  const row =
    (pickUnanswered.get(after, device?.id ?? null) as { id: string } | undefined) ??
    (pickAny.get(after) as { id: string } | undefined);

  if (!row) {
    return NextResponse.json({ error: "no active questions" }, { status: 404 });
  }
  return NextResponse.json({ question_id: row.id });
}
