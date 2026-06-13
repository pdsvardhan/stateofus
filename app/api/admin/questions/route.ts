/**
 * GET  /api/admin/questions — filterable list (status/category/mode/source).
 * POST /api/admin/questions — create (source=manual, validated through the
 * same questionInsertSchema + upsertQuestion path as imports; AC365).
 * Gated by middleware (+ Authentik at the proxy).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rawDb } from "@/lib/db/client";
import {
  CATEGORIES,
  DV_IDS,
  LIFECYCLE_STATES,
  MODES,
} from "@/lib/catalogue/enums";
import { questionInsertSchema } from "@/lib/catalogue/normalize";
import { upsertQuestion } from "@/scripts/import-catalogue";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const conds: string[] = ["1=1"];
  const params: unknown[] = [];
  for (const [key, col] of [
    ["status", "status"],
    ["category", "category"],
    ["mode", "mode"],
    ["source", "source"],
  ] as const) {
    const v = p.get(key);
    if (v) {
      conds.push(`${col} = ?`);
      params.push(v);
    }
  }
  const rows = rawDb
    .prepare(
      `SELECT q.id, q.category, q.text, q.mode, q.primary_dv, q.status, q.source,
              q.approved_by, q.import_warnings_json, q.geo,
              COALESCE(a.sample_n, 0) AS sample_n
       FROM questions q
       LEFT JOIN question_aggregates a
         ON a.question_id = q.id AND a.dim='overall' AND a.dim_key=''
       WHERE ${conds.join(" AND ")}
       ORDER BY q.id`
    )
    .all(...params);
  return NextResponse.json({ questions: rows });
}

const createSchema = z.object({
  id: z.string().optional(),
  category: z.enum(CATEGORIES),
  text: z.string().min(1).max(200),
  mode: z.enum(MODES),
  options: z.array(z.object({ key: z.string(), label: z.string().min(1) })).min(2),
  targets: z
    .object({ kind: z.enum(["buckets", "tiers"]), labels: z.array(z.string().min(1)).min(2) })
    .nullable()
    .optional(),
  primary_dv: z.enum(DV_IDS),
  secondary_dvs: z.array(z.enum(DV_IDS)).max(2).default([]),
  insight_type: z.string().nullable().optional(),
  geo: z.boolean().default(false),
  reveal_pattern: z.enum(["immediate", "threshold", "progressive"]).default("threshold"),
  subcategory: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  mvp_priority: z.string().nullable().optional(),
});

function nextManualId(): string {
  const row = rawDb
    .prepare(
      "SELECT id FROM questions WHERE id LIKE 'NEW-%' ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC LIMIT 1"
    )
    .get() as { id: string } | undefined;
  const n = row ? parseInt(row.id.slice(4), 10) + 1 : 100;
  return `NEW-${n}`;
}

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const id = d.id?.trim() || nextManualId();

  const candidate = {
    id,
    category: d.category,
    subcategory: d.subcategory ?? null,
    title: null,
    text: d.text,
    objective: null,
    mode: d.mode,
    interactionDescription: null,
    answerStructure: null,
    options: d.options,
    skipAllowed: 1 as const,
    primaryDv: d.primary_dv,
    secondaryDvs: d.secondary_dvs,
    dvRaw: null,
    insightType: d.insight_type ?? null,
    expectedResultShape: null,
    expectedEmotion: null,
    scoreParticipation: null,
    scoreInterestingness: null,
    scoreEase: null,
    scoreDiscussion: null,
    scoreShareability: null,
    experienceRequirement: null,
    biasRisk: null,
    whyExists: null,
    whatInteresting: null,
    alternativeVersions: null,
    rejectedAlternatives: null,
    mvpPriority: d.mvp_priority ?? null,
    notes: d.notes ?? null,
    geo: (d.geo ? 1 : 0) as 0 | 1,
    source: "manual" as const,
    status: "draft" as const,
    importWarnings: [],
  };
  const valid = questionInsertSchema.safeParse(candidate);
  if (!valid.success) {
    return NextResponse.json(
      { error: "validation failed", issues: valid.error.issues },
      { status: 400 }
    );
  }
  const outcome = upsertQuestion(valid.data, d.targets ?? null);
  if (d.reveal_pattern !== "threshold") {
    rawDb
      .prepare("UPDATE questions SET reveal_pattern = ? WHERE id = ?")
      .run(d.reveal_pattern, id);
  }
  return NextResponse.json({ id, outcome }, { status: outcome === "inserted" ? 201 : 200 });
}
