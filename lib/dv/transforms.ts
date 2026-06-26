/**
 * DV transforms — feat-dv-engine.
 *
 * Pure functions that turn the per-mode aggregate shapes (lib/aggregates.ts)
 * into renderer-ready rows. No React, no DOM — unit tested directly.
 *
 * Aggregate shapes consumed:
 *  pick   { counts: { [optionKey]: n } }
 *  swipe  { cards: { [optionKey]: { yes, no } } }
 *  place  { items: { [optionKey]: { [targetLabel]: n } } }
 *  rank   { items: { [optionKey]: { posSum, count, firsts } } }
 *  podium { items: { [optionKey]: { first, second, third } } }
 */
import type { Mode } from "@/lib/catalogue/enums";
import type { QuestionOption, QuestionTargets } from "@/lib/types";

export const PICK_MODES: Mode[] = [
  "quick_pick",
  "logo_quick_pick",
  "tradeoff_cards",
  // coin_allocation shares the pick aggregate shape ({ counts }); its counts are
  // total coins per option, so pick-family transforms render coin-share directly.
  "coin_allocation",
  // bracket also shares { counts } — each count is an option's championship wins,
  // so pick-family transforms render share-of-titles directly.
  "bracket",
];

type Agg = Record<string, unknown> | null | undefined;

/* ------------------------------------------------------------------ */
/* rounding + formatting                                               */
/* ------------------------------------------------------------------ */

/** Largest-remainder rounding: integer percents that sum to exactly 100. */
export function roundedShares(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const exact = values.map((v) => (v * 100) / total);
  const floors = exact.map(Math.floor);
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const byFrac = exact
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  const out = floors.slice();
  for (let k = 0; k < byFrac.length && remainder > 0; k++, remainder--) {
    out[byFrac[k].i] += 1;
  }
  return out;
}

/** "1204" → "1,204" (Indian grouping — this is State of Us, after all). */
export function formatCount(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString("en-IN");
}

/** Compact bubble label: 1204 → "1.2K", 980 → "980". */
export function formatCompact(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}K`;
  }
  return String(Math.round(n));
}

/* ------------------------------------------------------------------ */
/* your_payload readers                                                */
/* ------------------------------------------------------------------ */

export function yourPick(payload: Record<string, unknown> | null): string | null {
  if (!payload || typeof payload.pick !== "string") return null;
  return payload.pick;
}

export function yourVotes(
  payload: Record<string, unknown> | null
): Record<string, "yes" | "no"> | null {
  if (!payload || typeof payload.votes !== "object" || payload.votes === null) return null;
  return payload.votes as Record<string, "yes" | "no">;
}

export function yourPlacements(
  payload: Record<string, unknown> | null
): Record<string, string> | null {
  if (!payload || typeof payload.placements !== "object" || payload.placements === null)
    return null;
  return payload.placements as Record<string, string>;
}

export function yourOrder(payload: Record<string, unknown> | null): string[] | null {
  if (!payload || !Array.isArray(payload.order)) return null;
  return payload.order as string[];
}

export function yourSlots(
  payload: Record<string, unknown> | null
): { first?: string; second?: string; third?: string } | null {
  if (!payload || typeof payload.slots !== "object" || payload.slots === null) return null;
  return payload.slots as { first?: string; second?: string; third?: string };
}

/** spectrum: the 0–100 position the reader placed themselves at. */
export function yourValue(payload: Record<string, unknown> | null): number | null {
  if (!payload || typeof payload.value !== "number") return null;
  return payload.value;
}

/** bracket: the option key the reader crowned champion. */
export function yourWinner(payload: Record<string, unknown> | null): string | null {
  if (!payload || typeof payload.winner !== "string") return null;
  return payload.winner;
}

/* ------------------------------------------------------------------ */
/* spectrum — histogram model from { buckets[11], sum, count }         */
/* ------------------------------------------------------------------ */

export type SpectrumModel = {
  /** the 11 bucket counts (0–9, 10–19, …, 100) */
  buckets: number[];
  /** count of the tallest bucket — for normalizing bar heights */
  peak: number;
  /** total answers counted */
  count: number;
  /** mean position 0–100, or null when nothing counted */
  mean: number | null;
};

export function spectrumModel(agg: Agg): SpectrumModel {
  const rawBuckets = (agg?.buckets ?? []) as number[];
  const buckets = Array.from({ length: 11 }, (_, i) => Math.max(0, rawBuckets[i] ?? 0));
  const sum = Math.max(0, (agg?.sum as number) ?? 0);
  const count = Math.max(0, (agg?.count as number) ?? 0);
  const peak = buckets.reduce((a, b) => Math.max(a, b), 0);
  return { buckets, peak, count, mean: count > 0 ? sum / count : null };
}

/* ------------------------------------------------------------------ */
/* pick family                                                         */
/* ------------------------------------------------------------------ */

export type ShareRow = { key: string; label: string; count: number; pct: number };

/** Vote shares for pick-family aggregates, in option order. */
export function pickShares(agg: Agg, options: QuestionOption[]): ShareRow[] {
  const counts = (agg?.counts ?? {}) as Record<string, number>;
  const raw = options.map((o) => Math.max(0, counts[o.key] ?? 0));
  const pcts = roundedShares(raw);
  return options.map((o, i) => ({ key: o.key, label: o.label, count: raw[i], pct: pcts[i] }));
}

/* ------------------------------------------------------------------ */
/* swipe family                                                        */
/* ------------------------------------------------------------------ */

export type YesShareRow = {
  key: string;
  label: string;
  yes: number;
  no: number;
  /** % of swipers calling this card yes (per-card, does NOT sum to 100) */
  pct: number;
};

export function swipeYesShares(agg: Agg, options: QuestionOption[]): YesShareRow[] {
  const cards = (agg?.cards ?? {}) as Record<string, { yes?: number; no?: number }>;
  return options.map((o) => {
    const c = cards[o.key] ?? {};
    const yes = Math.max(0, c.yes ?? 0);
    const no = Math.max(0, c.no ?? 0);
    const total = yes + no;
    return {
      key: o.key,
      label: o.label,
      yes,
      no,
      pct: total > 0 ? Math.round((yes * 100) / total) : 0,
    };
  });
}

/**
 * The one share extraction the split-family renderers need: vote share for
 * pick modes, per-card yes share for swipe_stack.
 */
export function shareRowsFor(mode: Mode, agg: Agg, options: QuestionOption[]): ShareRow[] {
  if (mode === "swipe_stack") {
    return swipeYesShares(agg, options).map(({ key, label, yes, pct }) => ({
      key,
      label,
      count: yes,
      pct,
    }));
  }
  return pickShares(agg, options);
}

/* ------------------------------------------------------------------ */
/* placements (bucket_sort / tier_placement)                           */
/* ------------------------------------------------------------------ */

export type PlacementRow = {
  key: string;
  label: string;
  /** total placements recorded for this item */
  total: number;
  /** counts aligned to targets order */
  perTarget: number[];
  /** rounded % per target — sums to 100 when total > 0 */
  pctPerTarget: number[];
  /** index of the target most of India chose (ties → earlier target) */
  consensusIdx: number;
  /** % of India that placed it in its consensus target */
  consensusPct: number;
};

export function placementRows(
  agg: Agg,
  options: QuestionOption[],
  targetLabels: string[]
): PlacementRow[] {
  const items = (agg?.items ?? {}) as Record<string, Record<string, number>>;
  return options.map((o) => {
    const placed = items[o.key] ?? {};
    const perTarget = targetLabels.map((t) => Math.max(0, placed[t] ?? 0));
    const total = perTarget.reduce((a, b) => a + b, 0);
    const pctPerTarget = roundedShares(perTarget);
    let consensusIdx = 0;
    perTarget.forEach((n, i) => {
      if (n > perTarget[consensusIdx]) consensusIdx = i;
    });
    return {
      key: o.key,
      label: o.label,
      total,
      perTarget,
      pctPerTarget,
      consensusIdx,
      consensusPct: pctPerTarget[consensusIdx] ?? 0,
    };
  });
}

/* ------------------------------------------------------------------ */
/* two_axis — 2×2 quadrant grid (place shape, quadrant targets q1..q4) */
/* ------------------------------------------------------------------ */

/** Quadrant ids, in grid reading order: top-left, top-right, bottom-left,
 *  bottom-right. Shared by the interaction (placement) and the heat matrix
 *  (render) so both agree on where each quadrant sits. */
export const QUADRANTS = ["q1", "q2", "q3", "q4"] as const;
export type Quadrant = (typeof QUADRANTS)[number];

export type QuadrantCell = {
  quadrant: Quadrant;
  /** option keys/labels India placed in this quadrant, by placement count desc */
  items: { key: string; label: string; count: number }[];
  /** total placements landing in this quadrant */
  count: number;
  /** share of all placements (0–100, rounded across the four cells) */
  pct: number;
};

/** Aggregate the place-shape items into the four quadrant cells. */
export function quadrantCells(agg: Agg, options: QuestionOption[]): QuadrantCell[] {
  const items = (agg?.items ?? {}) as Record<string, Record<string, number>>;
  const counts = QUADRANTS.map((q) =>
    options.reduce((sum, o) => sum + Math.max(0, items[o.key]?.[q] ?? 0), 0)
  );
  const pcts = roundedShares(counts);
  return QUADRANTS.map((q, qi) => {
    const cellItems = options
      .map((o) => ({ key: o.key, label: o.label, count: Math.max(0, items[o.key]?.[q] ?? 0) }))
      .filter((it) => it.count > 0)
      .sort((a, b) => b.count - a.count);
    return { quadrant: q, items: cellItems, count: counts[qi], pct: pcts[qi] };
  });
}

/* ------------------------------------------------------------------ */
/* rank_order                                                          */
/* ------------------------------------------------------------------ */

export type RankRow = {
  key: string;
  label: string;
  count: number;
  /** average position (1 = best); 0 when never ranked */
  avg: number;
  /** share of all #1 votes — sums to 100 across items when any exist */
  firstsPct: number;
  firsts: number;
};

export function rankRows(agg: Agg, options: QuestionOption[]): RankRow[] {
  const items = (agg?.items ?? {}) as Record<
    string,
    { posSum?: number; count?: number; firsts?: number }
  >;
  const firsts = options.map((o) => Math.max(0, items[o.key]?.firsts ?? 0));
  const firstsPcts = roundedShares(firsts);
  return options.map((o, i) => {
    const it = items[o.key] ?? {};
    const count = Math.max(0, it.count ?? 0);
    const posSum = Math.max(0, it.posSum ?? 0);
    return {
      key: o.key,
      label: o.label,
      count,
      avg: count > 0 ? posSum / count : 0,
      firsts: firsts[i],
      firstsPct: firstsPcts[i],
    };
  });
}

/* ------------------------------------------------------------------ */
/* podium_slots                                                        */
/* ------------------------------------------------------------------ */

export type PodiumRow = {
  key: string;
  label: string;
  first: number;
  second: number;
  third: number;
  /** weighted points: 3·first + 2·second + 1·third */
  points: number;
  /** share of all points — sums to 100 when any points exist */
  pct: number;
};

export function podiumRows(agg: Agg, options: QuestionOption[]): PodiumRow[] {
  const items = (agg?.items ?? {}) as Record<
    string,
    { first?: number; second?: number; third?: number }
  >;
  const rows = options.map((o) => {
    const it = items[o.key] ?? {};
    const first = Math.max(0, it.first ?? 0);
    const second = Math.max(0, it.second ?? 0);
    const third = Math.max(0, it.third ?? 0);
    return { key: o.key, label: o.label, first, second, third, points: first * 3 + second * 2 + third };
  });
  const pcts = roundedShares(rows.map((r) => r.points));
  return rows.map((r, i) => ({ ...r, pct: pcts[i] }));
}

/* ------------------------------------------------------------------ */
/* leaderboard (board) — one pct per item, any supported mode          */
/* ------------------------------------------------------------------ */

export type BoardRow = { key: string; label: string; pct: number };

export function boardRowsFor(
  mode: Mode,
  agg: Agg,
  options: QuestionOption[],
  targets: QuestionTargets
): { rows: BoardRow[]; caption: string } {
  if (mode === "rank_order") {
    const rows = rankRows(agg, options).map(({ key, label, firstsPct }) => ({
      key,
      label,
      pct: firstsPct,
    }));
    return { rows, caption: "The leaderboard · share of #1 votes" };
  }
  if (mode === "swipe_stack") {
    const rows = swipeYesShares(agg, options).map(({ key, label, pct }) => ({ key, label, pct }));
    return { rows, caption: "The leaderboard · % swiping yes" };
  }
  if (mode === "bracket") {
    // counts = championship wins per option — board by share of titles.
    const rows = pickShares(agg, options).map(({ key, label, pct }) => ({ key, label, pct }));
    return { rows, caption: "The leaderboard · share of championships" };
  }
  // bucket_sort / tier_placement — share filed under the top target
  const labels = targets?.labels ?? [];
  const top = labels[0] ?? "";
  const rows = placementRows(agg, options, labels).map((r) => ({
    key: r.key,
    label: r.label,
    pct: r.pctPerTarget[0] ?? 0,
  }));
  return { rows, caption: top ? `The leaderboard · % filing it under “${top}”` : "The leaderboard" };
}

/* ------------------------------------------------------------------ */
/* standings — top-N podium/medal input from any supported mode        */
/* ------------------------------------------------------------------ */

export function standingsFor(
  mode: Mode,
  agg: Agg,
  options: QuestionOption[]
): { rows: ShareRow[]; caption: string } {
  if (mode === "podium_slots") {
    const rows = podiumRows(agg, options).map(({ key, label, points, pct }) => ({
      key,
      label,
      count: points,
      pct,
    }));
    return { rows, caption: "weighted: 3 pts gold · 2 silver · 1 bronze" };
  }
  if (mode === "rank_order") {
    const rows = rankRows(agg, options).map(({ key, label, firsts, firstsPct }) => ({
      key,
      label,
      count: firsts,
      pct: firstsPct,
    }));
    return { rows, caption: "share of #1 votes" };
  }
  return { rows: pickShares(agg, options), caption: "share of all votes" };
}

/** What the user crowned, for podium/medal YOU tags. */
export function yourTopPick(
  mode: Mode,
  payload: Record<string, unknown> | null
): string | null {
  if (!payload) return null;
  if (mode === "podium_slots") return yourSlots(payload)?.first ?? null;
  if (mode === "rank_order") return yourOrder(payload)?.[0] ?? null;
  return yourPick(payload);
}

/* ------------------------------------------------------------------ */
/* geo — per-state winners + bubbles                                   */
/* ------------------------------------------------------------------ */

export type StateVerdict = {
  state: string;
  n: number;
  /** option key that wins this state (null when nothing recorded) */
  winnerKey: string | null;
  /** the winner's share within the state */
  winnerPct: number;
  /** below the reveal threshold — render cream + “no clear winner yet” */
  insufficient: boolean;
};

/** Winner of one aggregate, for any mode (used per-state on the map). */
export function aggregateWinner(
  mode: Mode,
  agg: Agg,
  options: QuestionOption[],
  targets: QuestionTargets
): { key: string; pct: number } | null {
  let rows: ShareRow[];
  if (mode === "swipe_stack") {
    rows = shareRowsFor(mode, agg, options);
  } else if (mode === "bucket_sort" || mode === "tier_placement") {
    const labels = targets?.labels ?? [];
    const placed = placementRows(agg, options, labels);
    const topCounts = placed.map((r) => r.perTarget[0] ?? 0);
    const pcts = roundedShares(topCounts);
    rows = placed.map((r, i) => ({ key: r.key, label: r.label, count: topCounts[i], pct: pcts[i] }));
  } else if (mode === "rank_order") {
    rows = rankRows(agg, options).map(({ key, label, firsts, firstsPct }) => ({
      key,
      label,
      count: firsts,
      pct: firstsPct,
    }));
  } else if (mode === "podium_slots") {
    const items = (agg?.items ?? {}) as Record<string, { first?: number }>;
    const firsts = options.map((o) => Math.max(0, items[o.key]?.first ?? 0));
    const pcts = roundedShares(firsts);
    rows = options.map((o, i) => ({ key: o.key, label: o.label, count: firsts[i], pct: pcts[i] }));
  } else {
    rows = pickShares(agg, options);
  }
  let best: ShareRow | null = null;
  for (const r of rows) {
    if (r.count > 0 && (best === null || r.count > best.count)) best = r;
  }
  return best ? { key: best.key, pct: best.pct } : null;
}

export function stateVerdicts(
  stateAggregates: Record<string, { agg: unknown; sample_n: number }> | null | undefined,
  mode: Mode,
  options: QuestionOption[],
  targets: QuestionTargets,
  minRevealN: number
): StateVerdict[] {
  if (!stateAggregates) return [];
  return Object.entries(stateAggregates).map(([state, { agg, sample_n }]) => {
    const insufficient = sample_n < minRevealN;
    const win = insufficient
      ? null
      : aggregateWinner(mode, agg as Agg, options, targets);
    return {
      state,
      n: sample_n,
      winnerKey: win?.key ?? null,
      winnerPct: win?.pct ?? 0,
      insufficient: insufficient || win === null,
    };
  });
}

export type StateBubble = { state: string; n: number };

export function stateBubbles(
  stateAggregates: Record<string, { agg: unknown; sample_n: number }> | null | undefined
): StateBubble[] {
  if (!stateAggregates) return [];
  return Object.entries(stateAggregates)
    .map(([state, { sample_n }]) => ({ state, n: sample_n }))
    .filter((b) => b.n > 0)
    .sort((a, b) => b.n - a.n);
}

/* ------------------------------------------------------------------ */
/* treemap — the v5 recursive halving layout, in % coordinates         */
/* ------------------------------------------------------------------ */

export type TreemapRect = {
  key: string;
  label: string;
  pct: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function treemapRects(items: { key: string; label: string; pct: number }[]): TreemapRect[] {
  const live = items.filter((it) => it.pct > 0);
  if (live.length === 0) return [];
  const out: TreemapRect[] = [];
  const rec = (
    list: { key: string; label: string; pct: number }[],
    x: number,
    y: number,
    w: number,
    h: number
  ): void => {
    if (list.length === 1) {
      out.push({ ...list[0], x, y, w, h });
      return;
    }
    const sum = list.reduce((a, b) => a + b.pct, 0);
    let acc = 0;
    let i = 0;
    while (i < list.length - 1 && acc + list[i].pct <= sum / 2) {
      acc += list[i].pct;
      i++;
    }
    if (i === 0) {
      acc = list[0].pct;
      i = 1;
    }
    const fr = acc / sum;
    if (w >= h) {
      rec(list.slice(0, i), x, y, w * fr, h);
      rec(list.slice(i), x + w * fr, y, w * (1 - fr), h);
    } else {
      rec(list.slice(0, i), x, y, w, h * fr);
      rec(list.slice(i), x, y + h * fr, w, h * (1 - fr));
    }
  };
  rec(
    live.slice().sort((a, b) => b.pct - a.pct),
    0,
    0,
    100,
    100
  );
  return out;
}

/* ------------------------------------------------------------------ */
/* sankey — where each state pours, into the top two answers           */
/* ------------------------------------------------------------------ */

export type SankeyModel = {
  /** left nodes: top states (or “All India” when no state data) */
  bands: { name: string; pct: number; split: [number, number] }[];
  /** right nodes: the top two answers with their overall share */
  right: { key: string; label: string; pct: number }[];
};

function pairSplit(a: number, b: number): [number, number] {
  const total = a + b;
  if (total <= 0) return [50, 50];
  const first = Math.round((a * 100) / total);
  return [first, 100 - first];
}

export function sankeyModel(
  mode: Mode,
  agg: Agg,
  stateAggregates: Record<string, { agg: unknown; sample_n: number }> | null | undefined,
  options: QuestionOption[],
  sampleN: number
): SankeyModel | null {
  const overall = shareRowsFor(mode, agg, options);
  const top2 = overall
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  if (top2.length < 2) return null;

  const countFor = (a: Agg, key: string): number => {
    if (mode === "swipe_stack") {
      const cards = (a?.cards ?? {}) as Record<string, { yes?: number }>;
      return Math.max(0, cards[key]?.yes ?? 0);
    }
    const counts = (a?.counts ?? {}) as Record<string, number>;
    return Math.max(0, counts[key] ?? 0);
  };

  const states = stateBubbles(stateAggregates);
  let bands: SankeyModel["bands"];
  if (states.length >= 2 && stateAggregates) {
    const top = states.slice(0, 4);
    const topN = top.reduce((a, b) => a + b.n, 0);
    const restN = Math.max(0, sampleN - topN);
    const weights = top.map((s) => s.n).concat(restN > 0 ? [restN] : []);
    const pcts = roundedShares(weights);
    bands = top.map((s, i) => ({
      name: s.state,
      pct: pcts[i],
      split: pairSplit(
        countFor(stateAggregates[s.state]?.agg as Agg, top2[0].key),
        countFor(stateAggregates[s.state]?.agg as Agg, top2[1].key)
      ),
    }));
    if (restN > 0) {
      bands.push({
        name: "Elsewhere",
        pct: pcts[pcts.length - 1],
        split: pairSplit(top2[0].count, top2[1].count),
      });
    }
  } else {
    bands = [
      { name: "All India", pct: 100, split: pairSplit(top2[0].count, top2[1].count) },
    ];
  }

  const rightTotals: [number, number] = [0, 1].map((j) =>
    bands.reduce((a, b) => a + (b.pct * b.split[j]) / 100, 0)
  ) as [number, number];

  return {
    bands,
    right: top2.map((o, j) => ({
      key: o.key,
      label: o.label,
      pct: Math.round(rightTotals[j]),
    })),
  };
}
