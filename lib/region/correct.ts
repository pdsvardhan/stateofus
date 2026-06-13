/**
 * applyRegionCorrection — the one-tap correction write path (AC377),
 * feat-region-capture.
 *
 * One transaction:
 *  1. devices row → corrected state/city, region_source = 'user-corrected'
 *  2. backfill ALL of the device's existing answers' denormalized
 *     region_state/region_city columns (answers are the source of truth for
 *     aggregate recomputation)
 *  3. recompute every affected question's aggregates from scratch
 *     (lib/aggregates.recomputeQuestionAggregates rebuilds overall + state +
 *     city dims from the answers table), so the old state's counts move to
 *     the corrected state immediately — maps and region insights stay honest.
 *
 * Returns the question ids whose aggregates were recomputed.
 */
import { rawDb } from "@/lib/db/client";
import { recomputeQuestionAggregates } from "@/lib/aggregates";
import type { Mode } from "@/lib/catalogue/enums";

export function applyRegionCorrection(
  deviceId: number,
  state: string,
  city: string | null
): { recomputedQuestionIds: string[] } {
  const tx = rawDb.transaction((): string[] => {
    rawDb
      .prepare(
        "UPDATE devices SET region_state = ?, region_city = ?, region_source = 'user-corrected' WHERE id = ?"
      )
      .run(state, city, deviceId);

    rawDb
      .prepare("UPDATE answers SET region_state = ?, region_city = ? WHERE device_id = ?")
      .run(state, city, deviceId);

    const affected = rawDb
      .prepare(
        `SELECT a.question_id AS question_id, q.mode AS mode
         FROM answers a JOIN questions q ON q.id = a.question_id
         WHERE a.device_id = ?`
      )
      .all(deviceId) as { question_id: string; mode: Mode }[];

    for (const row of affected) {
      recomputeQuestionAggregates(row.question_id, row.mode);
    }
    return affected.map((r) => r.question_id);
  });

  return { recomputedQuestionIds: tx() };
}
