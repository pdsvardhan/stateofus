/**
 * personalVerdict — the witty, data-derived headline + subline for the v5
 * "Where you landed" lime card (rebuilds the v5 prototype's personalBig /
 * personalSub, logic ported from `design/v5/State of Us v5.dc.html`).
 *
 * Keyed on the PRIMARY DV family (pass dvDefs[0].id), with a mode fallback.
 * Pure — no React, no DOM. Uses the same lib/dv/transforms the renderers use,
 * so the verdict always agrees with the chart on screen.
 *
 * NOTE: a few v5 verdicts are question-specific (the "elite tier" / "pay to
 * escape N chores" / "share a villain" lines). Where the question's intent
 * isn't knowable from data alone, this returns an on-tone generic; see the
 * TODO markers to wire authored per-question copy if you want the exact v5 wit.
 */
import type { Mode } from "@/lib/catalogue/enums";
import type { QuestionOption, QuestionPublic, QuestionResult } from "@/lib/types";
import {
  formatCount,
  rankRows,
  shareRowsFor,
  standingsFor,
  swipeYesShares,
  placementRows,
  yourOrder,
  yourPick,
  yourPlacements,
  yourVotes,
  yourTopPick,
  type ShareRow,
} from "@/lib/dv/transforms";

export type Verdict = { big: string; sub: string };

type Family = "pick" | "cups" | "sankey" | "podium" | "medal" | "board" | "placement" | "geo";

const ORD = ["", "gold", "silver", "bronze"];
const fmt = formatCount;

export function personalVerdict(
  question: QuestionPublic,
  result: QuestionResult,
  dvId?: string
): Verdict {
  const n = result.sample_n ?? 0;

  // governance / thin-data states first.
  if (question.status === "archived")
    return {
      big: "From the archives",
      sub: `This question retired with ${fmt(n)} votes on the record. The count is final — results stay public forever.`,
    };
  if (question.status === "frozen")
    return {
      big: "The books are closed",
      sub: `This one is sealed history — ${fmt(n)} votes, final. You're reading the record, not writing it.`,
    };
  if (result.still_counting || !result.aggregate)
    return {
      big: "The count is young",
      sub: `Only ${fmt(n)} votes in. Yours is counted — the picture forms as India wakes up.`,
    };

  const mode = question.mode as Mode;
  const opts = question.options;
  const payload = result.your_payload ?? null;
  const agg = result.aggregate as Record<string, unknown>;
  const family = dvFamily(dvId, mode);

  // swipe stacks read as agreement, whatever split-family DV is showing
  if (mode === "swipe_stack" && family !== "geo") {
    const cards = swipeYesShares(agg, opts);
    const votes = yourVotes(payload);
    let agree = 0;
    let considered = 0;
    for (const c of cards) {
      const you = votes?.[c.key];
      if (you === undefined) continue;
      considered++;
      if (c.pct >= 50 === (you === "yes")) agree++;
    }
    const total = considered || cards.length;
    return {
      big: `You matched India on ${agree} of ${total}`,
      sub:
        agree >= 4
          ? "Nationally calibrated conscience."
          : agree >= 2
            ? "Half in step with the public, half on your own moral planet."
            : "A private moral universe. Respect.",
    };
  }

  switch (family) {
    case "podium":
      return podiumVerdict(mode, agg, opts, payload);
    case "medal":
      return medalVerdict(mode, agg, opts, payload);
    case "board":
      return boardVerdict(mode, agg, opts, payload, question);
    case "placement":
      return placementVerdict(agg, opts, question, payload);
    case "geo":
      return mapVerdict(mode, result, opts, payload, n);
    case "sankey":
      return sankeyVerdict(mode, agg, opts, payload, n);
    case "cups":
      return cupsVerdict(mode, agg, opts, payload);
    default:
      return pickVerdict(mode, agg, opts, payload, n);
  }
}

/* ------------------------------------------------------------------ */

function dvFamily(dvId: string | undefined, mode: Mode): Family {
  switch (dvId) {
    case "podium":
      return "podium";
    case "medal":
      return "medal";
    case "board":
      return "board";
    case "tier":
    case "treemap":
    case "heatmatrix":
      return "placement";
    case "map":
    case "bubblemap":
      return "geo";
    case "sankey":
      return "sankey";
    case "cups":
      return "cups";
    case "radial":
    case "split":
    case "liquid":
    case "coins":
      return "pick";
  }
  if (mode === "podium_slots") return "podium";
  if (mode === "rank_order") return "board";
  if (mode === "bucket_sort" || mode === "tier_placement") return "placement";
  return "pick";
}

function maxByCount(rows: ShareRow[]): ShareRow | null {
  let best: ShareRow | null = null;
  for (const r of rows) if (best === null || r.count > best.count) best = r;
  return best;
}

function labelOf(opts: QuestionOption[], key: string | null | undefined): string {
  return opts.find((o) => o.key === key)?.label ?? "your pick";
}

/* ---- pick families (radial / split / liquid / coins-pick) ---- */
function pickVerdict(
  mode: Mode,
  agg: Record<string, unknown>,
  opts: QuestionOption[],
  payload: Record<string, unknown> | null,
  n: number
): Verdict {
  const rows = shareRowsFor(mode, agg, opts);
  const you = yourPick(payload);
  const top = maxByCount(rows);
  const youRow = rows.find((r) => r.key === you);
  if (!youRow || !top) {
    return {
      big: "You sat this one out",
      sub: top ? `"${top.label}" leads with ${top.pct}% of ${fmt(n)} counted.` : "No clear leader yet.",
    };
  }
  const isTop = you === top.key;
  return {
    big: isTop ? "You're with the majority" : "You're in the minority",
    sub: isTop
      ? `"${top.label}" is the country's top answer — you and ${top.pct}% of ${fmt(n)} counted votes picked it.`
      : `Only ${youRow.pct}% picked "${youRow.label}". A rarer read — India leans "${top.label}".`,
  };
}

function cupsVerdict(
  mode: Mode,
  agg: Record<string, unknown>,
  opts: QuestionOption[],
  payload: Record<string, unknown> | null
): Verdict {
  const rows = shareRowsFor(mode, agg, opts);
  const you = yourPick(payload);
  const top = maxByCount(rows);
  const youRow = rows.find((r) => r.key === you);
  const win = !!you && you === top?.key;
  return {
    big: win ? "Your cup runneth over" : "You're sipping with the minority",
    sub: `${youRow?.pct ?? 0}% of India pours the same. ${win ? "The national kitchen agrees with you." : "Rarer taste, stronger brew."}`,
  };
}

function sankeyVerdict(
  mode: Mode,
  agg: Record<string, unknown>,
  opts: QuestionOption[],
  payload: Record<string, unknown> | null,
  n: number
): Verdict {
  const rows = shareRowsFor(mode, agg, opts);
  const you = yourPick(payload);
  const top = maxByCount(rows);
  const youRow = rows.find((r) => r.key === you);
  const win = !!you && you === top?.key;
  void n;
  return {
    big: win ? "You're in the bigger river" : "You swim against the current",
    sub: `${youRow?.pct ?? 0}% of India pours the same cup. ${win ? "The national default is on your side." : "The mainstream flows the other way — more for you."}`,
  };
}

/* ---- podium / medal ---- */
function rankedStandings(
  mode: Mode,
  agg: Record<string, unknown>,
  opts: QuestionOption[],
  payload: Record<string, unknown> | null
) {
  const { rows } = standingsFor(mode, agg, opts);
  const sorted = [...rows].sort((a, b) => b.pct - a.pct);
  const you = yourTopPick(mode, payload);
  const idx = sorted.findIndex((r) => r.key === you);
  const rank = idx >= 0 && idx < 3 ? idx + 1 : -1;
  return { sorted, you, rank, youRow: sorted.find((r) => r.key === you) };
}

function podiumVerdict(
  mode: Mode,
  agg: Record<string, unknown>,
  opts: QuestionOption[],
  payload: Record<string, unknown> | null
): Verdict {
  const { rank, youRow } = rankedStandings(mode, agg, opts, payload);
  return {
    big: rank === 1 ? "Your pick took gold" : rank > 0 ? "Your pick made the podium" : "Your pick missed the podium",
    sub:
      rank > 0
        ? `${youRow?.pct ?? 0}% of India stood with you — ${rank === 1 ? "top of the pile." : `step ${rank} of the podium.`}`
        : `Only ${youRow?.pct ?? 0}% backed ${youRow?.label ?? "your pick"}. The podium disagrees, but podiums have been wrong before.`,
  };
}

function medalVerdict(
  mode: Mode,
  agg: Record<string, unknown>,
  opts: QuestionOption[],
  payload: Record<string, unknown> | null
): Verdict {
  const { rank, youRow } = rankedStandings(mode, agg, opts, payload);
  return {
    big: rank === 1 ? "Gold — you called it" : rank > 0 ? `Your pick took ${ORD[rank]}` : "No medal for your pick",
    sub: rank > 0 ? `${youRow?.pct ?? 0}% of India stands with your choice.` : "The podium went a different way.",
  };
}

/* ---- leaderboard (rank_order / swipe board) ---- */
function boardVerdict(
  mode: Mode,
  agg: Record<string, unknown>,
  opts: QuestionOption[],
  payload: Record<string, unknown> | null,
  question: QuestionPublic
): Verdict {
  if (mode === "rank_order") {
    const rows = rankRows(agg, opts).map((r) => ({ key: r.key, label: r.label, pct: r.firstsPct }));
    const natTop = [...rows].sort((a, b) => b.pct - a.pct)[0];
    const yourTop = yourOrder(payload)?.[0];
    const match = !!yourTop && yourTop === natTop?.key;
    // v5 frames this as "share a villain" for worst-offender questions; generic
    // top-of-list framing is safe when the question polarity isn't known.
    return {
      big: match ? "You and India agree at the top" : "Your #1 is your own",
      sub: match
        ? `"${labelOf(opts, natTop.key)}" tops both your list and the country's.`
        : `India's #1 is "${natTop?.label ?? "—"}" — yours is "${labelOf(opts, yourTop)}".`,
    };
  }
  // swipe-stack board → agreement; bucket/tier board → placement consensus
  if (mode === "swipe_stack") return pickVerdict(mode, agg, opts, payload, 0);
  return placementVerdict(agg, opts, question, payload);
}

/* ---- placements (tier / treemap / heatmatrix; bucket/tier modes) ---- */
function placementVerdict(
  agg: Record<string, unknown>,
  opts: QuestionOption[],
  question: QuestionPublic,
  payload: Record<string, unknown> | null
): Verdict {
  const targets = question.targets?.labels ?? [];
  const rows = placementRows(agg, opts, targets);
  const yours = yourPlacements(payload);
  let matched = 0;
  let placed = 0;
  for (const r of rows) {
    const y = yours?.[r.key];
    if (!y) continue;
    placed++;
    if (targets[r.consensusIdx] === y) matched++;
  }
  // TODO(authored copy): v5 swaps in question-specific wit here — e.g.
  // "You'd pay to escape N chores" / "N brands made your elite tier". Wire a
  // per-question template if you want the exact prototype lines.
  if (placed === 0) return { big: "You skipped the sort", sub: "Nothing filed — the shelves stay India's alone." };
  return {
    big: `You filed with India on ${matched} of ${placed}`,
    sub:
      matched >= Math.ceil(placed * 0.6)
        ? "Your sorting instinct tracks the national consensus."
        : matched === 0
          ? "You file the world your own way — India disagrees on every shelf."
          : "Selective agreement — half the country's shelves, half your own.",
  };
}

/* ---- geo (map / bubblemap) ---- */
function mapVerdict(
  mode: Mode,
  result: QuestionResult,
  opts: QuestionOption[],
  payload: Record<string, unknown> | null,
  n: number
): Verdict {
  void n;
  const you = yourPick(payload);
  const youRow = shareRowsFor(mode, result.aggregate as Record<string, unknown>, opts).find(
    (r) => r.key === you
  );
  const label = youRow?.label ?? "Your pick";
  const states = (result.state_aggregates ?? {}) as Record<string, { agg: unknown; sample_n: number }>;
  const floor = result.min_reveal_n ?? 1;
  let k = 0;
  for (const key of Object.keys(states)) {
    const st = states[key];
    if (!st || (st.sample_n ?? 0) < floor) continue;
    const rows = shareRowsFor(mode, st.agg as Record<string, unknown>, opts);
    const win = maxByCount(rows);
    if (win && win.count > 0 && win.key === you) k++;
  }
  return {
    big: k > 0 ? `${label} takes ${k} state${k > 1 ? "s" : ""}` : `${label} wins nowhere`,
    sub:
      k > 0
        ? `Your pick has territory. ${youRow?.pct ?? 0}% of the country agrees.`
        : `No state crowned your pick — but ${youRow?.pct ?? 0}% of India quietly agrees anyway.`,
  };
}
