/**
 * Aggregate computation — runs INSIDE the answer transaction (rail:
 * aggregates are tables, not queries). Incremental apply/unapply so an
 * updated answer (dedup UPSERT) first reverses its previous contribution.
 *
 * Aggregate shapes per mode family:
 *  pick   (quick_pick / logo_quick_pick / tradeoff_cards):
 *         { counts: { [optionKey]: n } }
 *  swipe  (swipe_stack): { cards: { [optionKey]: { yes: n, no: n } } }
 *  place  (bucket_sort / tier_placement):
 *         { items: { [optionKey]: { [target]: n } } }
 *  rank   (rank_order): { items: { [optionKey]: { posSum: n, count: n, firsts: n } } }
 *  podium (podium_slots): { items: { [optionKey]: { first: n, second: n, third: n } } }
 */
import { rawDb } from "@/lib/db/client";
import type { Mode } from "@/lib/catalogue/enums";

type Agg = Record<string, unknown>;

function emptyAgg(mode: Mode): Agg {
  switch (mode) {
    case "quick_pick":
    case "logo_quick_pick":
    case "tradeoff_cards":
      return { counts: {} };
    case "swipe_stack":
      return { cards: {} };
    case "bucket_sort":
    case "tier_placement":
      return { items: {} };
    case "rank_order":
      return { items: {} };
    case "podium_slots":
      return { items: {} };
  }
}

function applyToAgg(mode: Mode, agg: Agg, payload: Record<string, unknown>, sign: 1 | -1): void {
  const bump = (obj: Record<string, number>, key: string, by: number) => {
    obj[key] = (obj[key] ?? 0) + by;
    if (obj[key] <= 0) delete obj[key];
  };

  switch (mode) {
    case "quick_pick":
    case "logo_quick_pick":
    case "tradeoff_cards": {
      const counts = (agg.counts ??= {}) as Record<string, number>;
      bump(counts, payload.pick as string, sign);
      return;
    }
    case "swipe_stack": {
      const cards = (agg.cards ??= {}) as Record<string, { yes: number; no: number }>;
      for (const [k, v] of Object.entries(payload.votes as Record<string, "yes" | "no">)) {
        cards[k] ??= { yes: 0, no: 0 };
        cards[k][v] += sign;
      }
      return;
    }
    case "bucket_sort":
    case "tier_placement": {
      const items = (agg.items ??= {}) as Record<string, Record<string, number>>;
      for (const [k, target] of Object.entries(payload.placements as Record<string, string>)) {
        items[k] ??= {};
        bump(items[k], target, sign);
      }
      return;
    }
    case "rank_order": {
      const items = (agg.items ??= {}) as Record<
        string,
        { posSum: number; count: number; firsts: number }
      >;
      const order = payload.order as string[];
      order.forEach((k, pos) => {
        items[k] ??= { posSum: 0, count: 0, firsts: 0 };
        items[k].posSum += sign * (pos + 1);
        items[k].count += sign;
        if (pos === 0) items[k].firsts += sign;
      });
      return;
    }
    case "podium_slots": {
      const items = (agg.items ??= {}) as Record<
        string,
        { first: number; second: number; third: number }
      >;
      const slots = payload.slots as { first: string; second?: string; third?: string };
      for (const place of ["first", "second", "third"] as const) {
        const k = slots[place];
        if (!k) continue;
        items[k] ??= { first: 0, second: 0, third: 0 };
        items[k][place] += sign;
      }
      return;
    }
  }
}

const readAggStmt = () =>
  rawDb.prepare(
    "SELECT agg_json, sample_n FROM question_aggregates WHERE question_id = ? AND dim = ? AND dim_key = ?"
  );

const writeAggStmt = () =>
  rawDb.prepare(
    `INSERT INTO question_aggregates (question_id, dim, dim_key, agg_json, sample_n, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(question_id, dim, dim_key)
     DO UPDATE SET agg_json = excluded.agg_json, sample_n = excluded.sample_n, updated_at = excluded.updated_at`
  );

/**
 * Apply an answer to one aggregate dimension. previousPayload reverses the
 * device's earlier answer first (UPSERT semantics — sample_n unchanged then).
 * MUST be called inside the caller's transaction.
 */
export function updateAggregate(opts: {
  questionId: string;
  mode: Mode;
  dim: "overall" | "state" | "city";
  dimKey: string;
  payload: Record<string, unknown>;
  previousPayload: Record<string, unknown> | null;
}): void {
  const row = readAggStmt().get(opts.questionId, opts.dim, opts.dimKey) as
    | { agg_json: string; sample_n: number }
    | undefined;
  const agg: Agg = row ? JSON.parse(row.agg_json) : emptyAgg(opts.mode);
  let sampleN = row?.sample_n ?? 0;

  if (opts.previousPayload) {
    applyToAgg(opts.mode, agg, opts.previousPayload, -1);
  } else {
    sampleN += 1;
  }
  applyToAgg(opts.mode, agg, opts.payload, 1);

  writeAggStmt().run(opts.questionId, opts.dim, opts.dimKey, JSON.stringify(agg), sampleN);
}

/** Recompute one question's aggregates from scratch (periodic honesty job). */
export function recomputeQuestionAggregates(questionId: string, mode: Mode): void {
  const answers = rawDb
    .prepare(
      "SELECT payload_json, region_state, region_city FROM answers WHERE question_id = ?"
    )
    .all(questionId) as { payload_json: string; region_state: string | null; region_city: string | null }[];

  rawDb
    .prepare("DELETE FROM question_aggregates WHERE question_id = ?")
    .run(questionId);

  const dims = new Map<string, { dim: "overall" | "state" | "city"; dimKey: string; agg: Agg; n: number }>();
  const ensure = (dim: "overall" | "state" | "city", dimKey: string) => {
    const k = `${dim}:${dimKey}`;
    if (!dims.has(k)) dims.set(k, { dim, dimKey, agg: emptyAgg(mode), n: 0 });
    return dims.get(k)!;
  };

  for (const a of answers) {
    const payload = JSON.parse(a.payload_json) as Record<string, unknown>;
    const overall = ensure("overall", "");
    applyToAgg(mode, overall.agg, payload, 1);
    overall.n += 1;
    if (a.region_state) {
      const st = ensure("state", a.region_state);
      applyToAgg(mode, st.agg, payload, 1);
      st.n += 1;
    }
    if (a.region_city) {
      const ct = ensure("city", a.region_city);
      applyToAgg(mode, ct.agg, payload, 1);
      ct.n += 1;
    }
  }

  for (const { dim, dimKey, agg, n } of dims.values()) {
    writeAggStmt().run(questionId, dim, dimKey, JSON.stringify(agg), n);
  }
}
