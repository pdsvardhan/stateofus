/**
 * GET /api/questions/:id/reactions — counts + this device's reaction.
 * REA1: the UI shows counts only after the user reacts; `yours` tells it
 * whether to render them.
 */
import { NextRequest, NextResponse } from "next/server";
import { rawDb } from "@/lib/db/client";
import { getDevice } from "@/lib/identity";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const q = rawDb
    .prepare("SELECT id, status FROM questions WHERE id = ?")
    .get(id) as { id: string; status: string } | undefined;
  if (!q || q.status === "draft") {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }

  const counts = rawDb
    .prepare(
      `SELECT
         SUM(CASE WHEN kind = 'up' THEN 1 ELSE 0 END) AS up,
         SUM(CASE WHEN kind = 'down' THEN 1 ELSE 0 END) AS down
       FROM reactions WHERE question_id = ?`
    )
    .get(q.id) as { up: number | null; down: number | null };

  const device = await getDevice();
  let yours: "up" | "down" | null = null;
  if (device) {
    const r = rawDb
      .prepare("SELECT kind FROM reactions WHERE question_id = ? AND device_id = ?")
      .get(q.id, device.id) as { kind: "up" | "down" } | undefined;
    yours = r?.kind ?? null;
  }

  return NextResponse.json({
    question_id: q.id,
    yours,
    counts: { up: counts.up ?? 0, down: counts.down ?? 0 },
  });
}
