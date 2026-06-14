/**
 * GET /api/questions/:id — question detail for the experience page.
 * Status always included (AC 362 — governance transparency). Draft questions
 * are invisible to the public surface (404), not "coming soon" teasers.
 */
import { NextRequest, NextResponse } from "next/server";
import { rawDb } from "@/lib/db/client";
import { DESK_BY_CATEGORY, type Category } from "@/lib/catalogue/enums";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const q = rawDb
    .prepare(
      `SELECT id, category, subcategory, title, text, mode, options_json, targets_json,
              skip_allowed, primary_dv, secondary_dvs_json, insight_type, geo, status,
              swipe_yes_label, swipe_no_label, created_at
       FROM questions WHERE id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;

  if (!q || q.status === "draft") {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }

  const desk = DESK_BY_CATEGORY[q.category as Category] ?? null;

  return NextResponse.json({
    question: {
      id: q.id,
      category: q.category,
      desk: desk?.desk ?? null,
      subcategory: q.subcategory,
      title: q.title,
      text: q.text,
      mode: q.mode,
      options: JSON.parse(q.options_json as string),
      targets: q.targets_json ? JSON.parse(q.targets_json as string) : null,
      skip_allowed: q.skip_allowed === 1, // always true — product rail
      primary_dv: q.primary_dv,
      secondary_dvs: JSON.parse(q.secondary_dvs_json as string),
      insight_type: q.insight_type,
      geo: q.geo === 1,
      status: q.status,
      swipe_yes_label: (q.swipe_yes_label as string) ?? null,
      swipe_no_label: (q.swipe_no_label as string) ?? null,
      created_at: q.created_at,
    },
  });
}
