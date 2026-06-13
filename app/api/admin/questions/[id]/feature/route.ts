/**
 * POST /api/admin/questions/:id/feature — toggle editorial pick (AC363
 * "feature"). Writes the editorial_picks app_meta key the homepage reads.
 */
import { NextRequest, NextResponse } from "next/server";
import { rawDb } from "@/lib/db/client";
import { toggleEditorialPick } from "@/lib/admin/helpers";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const exists = rawDb.prepare("SELECT 1 FROM questions WHERE id = ?").get(id);
  if (!exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(toggleEditorialPick(id));
}
