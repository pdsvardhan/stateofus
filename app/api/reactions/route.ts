/**
 * POST /api/reactions — feat-reactions-sharing (REA1 quiet thumb pair).
 *
 * Device-scoped, one reaction per (question, device), UPSERT — tapping the
 * other thumb switches, tapping the same thumb removes (toggle). Counts are
 * returned so the UI can show them post-reaction (REA1: counts only after
 * reacting). Anonymous: same device-cookie identity as answers.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rawDb } from "@/lib/db/client";
import { getOrCreateDevice } from "@/lib/identity";
import { checkRate, hashIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  question_id: z.string().min(3).max(20),
  kind: z.enum(["up", "down"]),
});

export async function POST(req: NextRequest) {
  let device;
  try {
    device = await getOrCreateDevice();
  } catch {
    return NextResponse.json({ error: "identity unavailable" }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const ipCheck = checkRate({ scope: "ip", key: hashIp(ip) });
  const devCheck = ipCheck.allowed
    ? checkRate({ scope: "device", key: device.device_hash })
    : ipCheck;
  if (!devCheck.allowed) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { question_id, kind } = parsed.data;

  const q = rawDb
    .prepare("SELECT id, status FROM questions WHERE id = ?")
    .get(question_id) as { id: string; status: string } | undefined;
  if (!q || q.status === "draft") {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }

  let yours: "up" | "down" | null = kind;
  const tx = rawDb.transaction(() => {
    const existing = rawDb
      .prepare("SELECT kind FROM reactions WHERE question_id = ? AND device_id = ?")
      .get(q.id, device.id) as { kind: "up" | "down" } | undefined;

    if (existing?.kind === kind) {
      // same thumb again = un-react
      rawDb
        .prepare("DELETE FROM reactions WHERE question_id = ? AND device_id = ?")
        .run(q.id, device.id);
      yours = null;
    } else {
      rawDb
        .prepare(
          `INSERT INTO reactions (question_id, device_id, kind)
           VALUES (?, ?, ?)
           ON CONFLICT(question_id, device_id)
           DO UPDATE SET kind = excluded.kind, reacted_at = datetime('now')`
        )
        .run(q.id, device.id, kind);
    }
  });
  tx();

  const counts = rawDb
    .prepare(
      `SELECT
         SUM(CASE WHEN kind = 'up' THEN 1 ELSE 0 END) AS up,
         SUM(CASE WHEN kind = 'down' THEN 1 ELSE 0 END) AS down
       FROM reactions WHERE question_id = ?`
    )
    .get(q.id) as { up: number | null; down: number | null };

  return NextResponse.json({
    question_id: q.id,
    yours,
    counts: { up: counts.up ?? 0, down: counts.down ?? 0 },
  });
}
