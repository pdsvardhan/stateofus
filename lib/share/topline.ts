/**
 * Share-card topline — feat-og-image-gen.
 * Reduces any mode's aggregate to one honest headline figure for the card:
 * the strongest single statement the data supports, with its number.
 * Pure + unit-testable. Never invents precision: returns null when the
 * aggregate can't support a statement (card falls back to sample-count only).
 */
import type { Mode } from "@/lib/catalogue/enums";
import type { QuestionOption } from "@/lib/types";

export type Topline = {
  /** option/item label the statement is about */
  label: string;
  /** 0-100 integer percent, or null for rank-style statements */
  pct: number | null;
  /** statement suffix, e.g. "of India picked this" / "ranked #1" */
  statement: string;
};

export function computeTopline(
  mode: Mode,
  aggregate: Record<string, unknown> | null,
  options: QuestionOption[],
  sampleN: number
): Topline | null {
  if (!aggregate || sampleN < 1) return null;
  const labelOf = (key: string) =>
    options.find((o) => o.key === key)?.label ?? key;

  switch (mode) {
    case "quick_pick":
    case "logo_quick_pick":
    case "tradeoff_cards": {
      const counts = (aggregate.counts ?? {}) as Record<string, number>;
      const entries = Object.entries(counts);
      if (entries.length === 0) return null;
      const [topKey, topN] = entries.sort((a, b) => b[1] - a[1])[0];
      return {
        label: labelOf(topKey),
        pct: Math.round((topN / sampleN) * 100),
        statement: "of the count picked this",
      };
    }
    case "coin_allocation": {
      // counts hold total coins per option — headline is the top option's
      // share of ALL coins spent, not of voters.
      const counts = (aggregate.counts ?? {}) as Record<string, number>;
      const entries = Object.entries(counts).filter(([, n]) => n > 0);
      if (entries.length === 0) return null;
      const totalCoins = entries.reduce((a, [, n]) => a + n, 0);
      const [topKey, topN] = entries.sort((a, b) => b[1] - a[1])[0];
      return {
        label: labelOf(topKey),
        pct: totalCoins > 0 ? Math.round((topN / totalCoins) * 100) : 0,
        statement: "of every coin went here",
      };
    }
    case "bracket": {
      // counts hold championship wins per option — headline is the most-crowned
      // option's share of all titles.
      const counts = (aggregate.counts ?? {}) as Record<string, number>;
      const entries = Object.entries(counts).filter(([, n]) => n > 0);
      if (entries.length === 0) return null;
      const totalTitles = entries.reduce((a, [, n]) => a + n, 0);
      const [topKey, topN] = entries.sort((a, b) => b[1] - a[1])[0];
      return {
        label: labelOf(topKey),
        pct: totalTitles > 0 ? Math.round((topN / totalTitles) * 100) : 0,
        statement: "of brackets crowned this",
      };
    }
    case "swipe_stack": {
      const cards = (aggregate.cards ?? {}) as Record<string, { yes: number; no: number }>;
      const entries = Object.entries(cards).filter(([, v]) => v.yes + v.no > 0);
      if (entries.length === 0) return null;
      const scored = entries
        .map(([k, v]) => ({ k, share: v.yes / (v.yes + v.no), n: v.yes + v.no }))
        .sort((a, b) => b.share - a.share);
      const top = scored[0];
      return {
        label: labelOf(top.k),
        pct: Math.round(top.share * 100),
        statement: "said yes to this",
      };
    }
    case "bucket_sort":
    case "tier_placement": {
      const items = (aggregate.items ?? {}) as Record<string, Record<string, number>>;
      let best: { label: string; target: string; share: number } | null = null;
      for (const [k, targets] of Object.entries(items)) {
        const total = Object.values(targets).reduce((a, b) => a + b, 0);
        if (total === 0) continue;
        const [target, n] = Object.entries(targets).sort((a, b) => b[1] - a[1])[0];
        const share = n / total;
        if (!best || share > best.share) best = { label: labelOf(k), target, share };
      }
      if (!best) return null;
      return {
        label: best.label,
        pct: Math.round(best.share * 100),
        statement: `filed under "${best.target}"`,
      };
    }
    case "two_axis": {
      // place shape, quadrant targets (q1..q4) — headline is the item with the
      // strongest single-quadrant consensus. Quadrant names need axis labels
      // (not available here), so the statement stays label-free.
      const items = (aggregate.items ?? {}) as Record<string, Record<string, number>>;
      let best: { label: string; share: number } | null = null;
      for (const [k, quads] of Object.entries(items)) {
        const total = Object.values(quads).reduce((a, b) => a + b, 0);
        if (total === 0) continue;
        const top = Object.values(quads).sort((a, b) => b - a)[0];
        const share = top / total;
        if (!best || share > best.share) best = { label: labelOf(k), share };
      }
      if (!best) return null;
      return {
        label: best.label,
        pct: Math.round(best.share * 100),
        statement: "landed in one quadrant",
      };
    }
    case "rank_order": {
      const items = (aggregate.items ?? {}) as Record<
        string,
        { posSum: number; count: number; firsts: number }
      >;
      const entries = Object.entries(items).filter(([, v]) => v.count > 0);
      if (entries.length === 0) return null;
      const top = entries.sort(
        (a, b) => a[1].posSum / a[1].count - b[1].posSum / b[1].count
      )[0];
      return { label: labelOf(top[0]), pct: null, statement: "ranked #1 overall" };
    }
    case "podium_slots": {
      const items = (aggregate.items ?? {}) as Record<
        string,
        { first: number; second: number; third: number }
      >;
      const entries = Object.entries(items).filter(([, v]) => v.first > 0);
      if (entries.length === 0) return null;
      const top = entries.sort((a, b) => b[1].first - a[1].first)[0];
      return {
        label: labelOf(top[0]),
        pct: Math.round((top[1].first / sampleN) * 100),
        statement: "put this in 1st place",
      };
    }
    case "spectrum": {
      const count = Math.max(0, (aggregate.count as number) ?? 0);
      const sum = Math.max(0, (aggregate.sum as number) ?? 0);
      if (count < 1) return null;
      const mean = Math.round(sum / count);
      // headline reads as a 0–100 lean toward whichever end the average favours.
      const leansHigh = mean >= 50;
      const label = leansHigh
        ? (options[1]?.label ?? "the high end")
        : (options[0]?.label ?? "the low end");
      return {
        label,
        pct: leansHigh ? mean : 100 - mean,
        statement: "is where India leans",
      };
    }
  }
}
