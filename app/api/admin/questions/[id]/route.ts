/**
 * GET/PATCH /api/admin/questions/:id — detail + edit (AC363/365).
 * Edits go through the same validated upsert path as imports; status is
 * NEVER writable here (transition endpoint owns it, approval gate intact).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rawDb } from "@/lib/db/client";
import { CATEGORIES, DV_IDS, MODES } from "@/lib/catalogue/enums";
import { questionInsertSchema, type QuestionInsert } from "@/lib/catalogue/normalize";
import { upsertQuestion } from "@/scripts/import-catalogue";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const q = rawDb.prepare("SELECT * FROM questions WHERE id = ?").get(id);
  if (!q) return NextResponse.json({ error: "not found" }, { status: 404 });
  const events = rawDb
    .prepare(
      "SELECT from_status, to_status, actor, reason, at FROM lifecycle_events WHERE question_id = ? ORDER BY id DESC LIMIT 20"
    )
    .all(id);
  return NextResponse.json({ question: q, lifecycle_events: events });
}

const patchSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  text: z.string().min(1).max(200).optional(),
  mode: z.enum(MODES).optional(),
  options: z
    .array(z.object({ key: z.string(), label: z.string().min(1) }))
    .min(2)
    .optional(),
  targets: z
    .object({ kind: z.enum(["buckets", "tiers"]), labels: z.array(z.string().min(1)).min(2) })
    .nullable()
    .optional(),
  primary_dv: z.enum(DV_IDS).optional(),
  secondary_dvs: z.array(z.enum(DV_IDS)).max(2).optional(),
  insight_type: z.string().nullable().optional(),
  geo: z.boolean().optional(),
  reveal_pattern: z.enum(["immediate", "threshold", "progressive"]).optional(),
  subcategory: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  mvp_priority: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const existing = rawDb.prepare("SELECT * FROM questions WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const merged: QuestionInsert = {
    id,
    category: (d.category ?? existing.category) as QuestionInsert["category"],
    subcategory: (d.subcategory !== undefined ? d.subcategory : existing.subcategory) as string | null,
    title: existing.title as string | null,
    text: d.text ?? (existing.text as string),
    objective: existing.objective as string | null,
    mode: (d.mode ?? existing.mode) as QuestionInsert["mode"],
    interactionDescription: existing.interaction_description as string | null,
    answerStructure: existing.answer_structure as string | null,
    options: d.options ?? JSON.parse(existing.options_json as string),
    skipAllowed: 1,
    primaryDv: (d.primary_dv ?? existing.primary_dv) as QuestionInsert["primaryDv"],
    secondaryDvs: (d.secondary_dvs ??
      JSON.parse(existing.secondary_dvs_json as string)) as QuestionInsert["secondaryDvs"],
    dvRaw: existing.dv_raw as string | null,
    insightType: (d.insight_type !== undefined ? d.insight_type : existing.insight_type) as string | null,
    expectedResultShape: existing.expected_result_shape as string | null,
    expectedEmotion: existing.expected_emotion as string | null,
    scoreParticipation: existing.score_participation as number | null,
    scoreInterestingness: existing.score_interestingness as number | null,
    scoreEase: existing.score_ease as number | null,
    scoreDiscussion: existing.score_discussion as number | null,
    scoreShareability: existing.score_shareability as number | null,
    experienceRequirement: existing.experience_requirement as string | null,
    biasRisk: existing.bias_risk as string | null,
    whyExists: existing.why_exists as string | null,
    whatInteresting: existing.what_interesting as string | null,
    alternativeVersions: existing.alternative_versions as string | null,
    rejectedAlternatives: existing.rejected_alternatives as string | null,
    mvpPriority: (d.mvp_priority !== undefined ? d.mvp_priority : existing.mvp_priority) as string | null,
    notes: (d.notes !== undefined ? d.notes : existing.notes) as string | null,
    geo: (d.geo !== undefined ? (d.geo ? 1 : 0) : (existing.geo as 0 | 1)) as 0 | 1,
    source: existing.source as QuestionInsert["source"],
    status: existing.status as QuestionInsert["status"],
    importWarnings: JSON.parse(existing.import_warnings_json as string),
  };

  const valid = questionInsertSchema.safeParse(merged);
  if (!valid.success) {
    return NextResponse.json(
      { error: "validation failed", issues: valid.error.issues },
      { status: 400 }
    );
  }
  const targets =
    d.targets !== undefined
      ? d.targets
      : existing.targets_json
        ? JSON.parse(existing.targets_json as string)
        : null;
  upsertQuestion(valid.data, targets);
  if (d.reveal_pattern) {
    rawDb.prepare("UPDATE questions SET reveal_pattern = ? WHERE id = ?").run(d.reveal_pattern, id);
  }
  return NextResponse.json({ id, updated: true });
}
