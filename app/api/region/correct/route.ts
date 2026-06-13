/**
 * POST /api/region/correct — one-tap region correction (AC377/AC378).
 *
 * Body: { state, city? } — state zod-validated against the canonical 36
 * states/UTs list; city optional free text (trimmed, 1–60 chars).
 *
 * Sets region_source='user-corrected' on the device, backfills the device's
 * existing answers' region columns, and recomputes every affected question's
 * aggregates (overall + state + city dims) so the count moves with the
 * correction — see lib/region/correct.ts. City/state only, never raw IP.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDevice } from "@/lib/identity";
import { INDIAN_STATES } from "@/lib/region/states";
import { applyRegionCorrection } from "@/lib/region/correct";

const bodySchema = z.object({
  state: z.enum(INDIAN_STATES),
  city: z.string().trim().min(1).max(60).optional(),
});

export async function POST(req: NextRequest) {
  let device;
  try {
    device = await getOrCreateDevice();
  } catch {
    return NextResponse.json(
      { error: "identity unavailable (server misconfigured)" },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body: state must be one of the 36 Indian states/UTs" },
      { status: 400 }
    );
  }

  const { state, city } = parsed.data;
  const { recomputedQuestionIds } = applyRegionCorrection(
    device.id,
    state,
    city ?? null
  );

  return NextResponse.json({
    state,
    city: city ?? null,
    source: "user-corrected",
    recomputed_questions: recomputedQuestionIds.length,
  });
}
