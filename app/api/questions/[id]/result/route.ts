/**
 * GET /api/questions/:id/result — aggregate + your answer (you-vs-crowd).
 *
 * AC 370: return visits show you-vs-crowd comparisons (your_payload present
 * when this device answered). Sample size always included — trust visible.
 * Reveal threshold: below MIN_REVEAL_N the payload reports still_counting and
 * ships NO aggregate — never an empty chart, never fake precision.
 */
import { NextRequest, NextResponse } from "next/server";
import { rawDb } from "@/lib/db/client";
import { getDevice } from "@/lib/identity";
import { showsResults } from "@/lib/lifecycle";
import { MIN_REVEAL_N } from "@/lib/results";
import type { LifecycleState } from "@/lib/catalogue/enums";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const q = rawDb
    .prepare("SELECT id, mode, status, geo FROM questions WHERE id = ?")
    .get(id) as
    | { id: string; mode: string; status: LifecycleState; geo: number }
    | undefined;
  if (!q || q.status === "draft") {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }
  if (!showsResults(q.status)) {
    return NextResponse.json({ error: "results not available" }, { status: 409 });
  }

  const overall = rawDb
    .prepare(
      "SELECT agg_json, sample_n, updated_at FROM question_aggregates WHERE question_id = ? AND dim = 'overall' AND dim_key = ''"
    )
    .get(q.id) as { agg_json: string; sample_n: number; updated_at: string } | undefined;

  const sampleN = overall?.sample_n ?? 0;

  const device = await getDevice();
  let yourPayload: Record<string, unknown> | null = null;
  let yourRegion: { state: string | null; city: string | null } | null = null;
  if (device) {
    const yours = rawDb
      .prepare(
        "SELECT payload_json, region_state, region_city FROM answers WHERE question_id = ? AND device_id = ?"
      )
      .get(q.id, device.id) as
      | { payload_json: string; region_state: string | null; region_city: string | null }
      | undefined;
    if (yours) {
      yourPayload = JSON.parse(yours.payload_json);
      yourRegion = { state: yours.region_state, city: yours.region_city };
    }
  }

  if (sampleN < MIN_REVEAL_N) {
    return NextResponse.json({
      question_id: q.id,
      status: q.status,
      still_counting: true,
      sample_n: sampleN,
      min_reveal_n: MIN_REVEAL_N,
      your_payload: yourPayload,
    });
  }

  // Geo questions ship state-dim aggregates for the map DVs; the requester's
  // own region rides along for the personal layer.
  let stateAggregates: Record<string, { agg: unknown; sample_n: number }> | null = null;
  if (q.geo === 1) {
    const rows = rawDb
      .prepare(
        "SELECT dim_key, agg_json, sample_n FROM question_aggregates WHERE question_id = ? AND dim = 'state'"
      )
      .all(q.id) as { dim_key: string; agg_json: string; sample_n: number }[];
    stateAggregates = Object.fromEntries(
      rows.map((r) => [r.dim_key, { agg: JSON.parse(r.agg_json), sample_n: r.sample_n }])
    );
  }

  return NextResponse.json({
    question_id: q.id,
    status: q.status,
    still_counting: false,
    sample_n: sampleN,
    aggregate: overall ? JSON.parse(overall.agg_json) : null,
    updated_at: overall?.updated_at ?? null,
    state_aggregates: stateAggregates,
    your_payload: yourPayload,
    your_region: yourRegion,
  });
}
