/**
 * Personal insight layer — feat-personal-insight-layer (AC348–AC350).
 *
 * A TYPED template registry: every headline/body is a template literal with
 * numeric/string slots filled from REAL aggregate math — no generative text,
 * no LLM, no invented numbers (AC349). Pure functions over
 * (QuestionPublic, QuestionResult); fully unit-testable.
 *
 * Template families (AC348):
 *  - region-differs  your state's winner differs from the national winner
 *                    (state_aggregates + your_region; skipped when the state
 *                    sample is below REGION_MIN_SAMPLE — small-sample honesty)
 *  - you-matched     your pick's share of the count (match tone)
 *  - you-differ      your pick vs the majority (differ tone)
 *  - majority        you stand with ≥50% (majority tone)
 *  - minority        you stand with ≤25% (minority tone)
 *  - counted (info)  fallback so every ANSWERED result yields ≥1 insight,
 *                    even pre-reveal (still_counting) — uses sample_n only.
 *
 * Selection is deterministic: priority region-differs > match/differ >
 * majority/minority > info, ties broken by template_id, max 3 returned.
 * Skipped/unanswered (your_payload null) → [] — aggregate only, no personal
 * layer (AC350).
 */
import type { Mode } from "@/lib/catalogue/enums";
import type { QuestionPublic, QuestionResult } from "@/lib/types";

/* FIX 3a (A2/C2) — vary the fixed-string insight bodies so two questions never
   read identically, while staying deterministic per question (no flicker) and
   fully no-LLM (only the prose rotates; every number stays sourced). */
function phrasingIndex(seed: string, poolSize: number): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % poolSize;
}
function pickPhrasing(questionId: string, templateId: string, pool: string[]): string {
  return pool[phrasingIndex(`${questionId}:${templateId}`, pool.length)];
}

export type InsightTone =
  | "match"
  | "differ"
  | "region"
  | "minority"
  | "majority"
  | "info";

export type Insight = {
  id: string;
  template_id: string;
  headline: string;
  body: string;
  tone: InsightTone;
};

/** State aggregates thinner than this never produce a region insight. */
export const REGION_MIN_SAMPLE = 5;

export const MAX_INSIGHTS = 3;

/* ------------------------------------------------------------------ */
/* aggregate shapes (mirror lib/aggregates.ts)                         */
/* ------------------------------------------------------------------ */
type Agg = Record<string, unknown>;
type SwipeCard = { yes?: number; no?: number };
type RankItem = { posSum?: number; count?: number; firsts?: number };
type PodiumItem = { first?: number; second?: number; third?: number };

const PICK_MODES: readonly Mode[] = ["quick_pick", "logo_quick_pick", "tradeoff_cards"];
const SORT_MODES: readonly Mode[] = ["bucket_sort", "tier_placement"];

type Candidate = Insight & { priority: number };

const PRIORITY = { region: 0, matchDiffer: 1, majorityMinority: 2, info: 9 } as const;

/* ------------------------------------------------------------------ */
/* helpers — all math is plain arithmetic over the aggregate            */
/* ------------------------------------------------------------------ */
const pct = (num: number, den: number): number =>
  den > 0 ? Math.round((num / den) * 100) : 0;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Deterministic argmax: highest score, ties broken by option order then key. */
function topKey(
  scores: Record<string, number>,
  optionIndex: Map<string, number>
): string | null {
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const key of Object.keys(scores).sort((a, b) => {
    const ia = optionIndex.get(a) ?? Number.MAX_SAFE_INTEGER;
    const ib = optionIndex.get(b) ?? Number.MAX_SAFE_INTEGER;
    return ia !== ib ? ia - ib : a.localeCompare(b);
  })) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key;
    }
  }
  return bestScore > 0 ? best : null;
}

function pickCounts(agg: Agg | null): Record<string, number> | null {
  const counts = asRecord(agg?.counts);
  if (!counts) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) out[k] = asNumber(v);
  return out;
}

/**
 * Mode-aware "winner" of an aggregate — the option a region/nation backs.
 *  pick: most-counted option · podium: most golds · rank: best average
 *  position · swipe: highest yes-share · sorter: none (no scalar winner).
 */
function winnerOf(mode: Mode, agg: Agg | null, optionIndex: Map<string, number>): string | null {
  if (!agg) return null;
  if (PICK_MODES.includes(mode)) {
    const counts = pickCounts(agg);
    return counts ? topKey(counts, optionIndex) : null;
  }
  if (mode === "podium_slots") {
    const items = asRecord(agg.items);
    if (!items) return null;
    const scores: Record<string, number> = {};
    for (const [k, v] of Object.entries(items)) {
      scores[k] = asNumber((v as PodiumItem)?.first);
    }
    return topKey(scores, optionIndex);
  }
  if (mode === "rank_order") {
    const items = asRecord(agg.items);
    if (!items) return null;
    // lowest average position wins → score with negated average
    const scores: Record<string, number> = {};
    for (const [k, v] of Object.entries(items)) {
      const it = v as RankItem;
      const count = asNumber(it?.count);
      if (count > 0) scores[k] = 1000 - asNumber(it?.posSum) / count;
    }
    return topKey(scores, optionIndex);
  }
  if (mode === "swipe_stack") {
    const cards = asRecord(agg.cards);
    if (!cards) return null;
    const scores: Record<string, number> = {};
    for (const [k, v] of Object.entries(cards)) {
      const c = v as SwipeCard;
      const total = asNumber(c?.yes) + asNumber(c?.no);
      if (total > 0) scores[k] = asNumber(c?.yes) / total;
    }
    return topKey(scores, optionIndex);
  }
  return null; // sorter modes: no scalar winner — region family not emitted
}

/** Share of an aggregate backing `key`, as a percentage (mode-aware). */
function shareOf(mode: Mode, agg: Agg | null, key: string): number | null {
  if (!agg) return null;
  if (PICK_MODES.includes(mode)) {
    const counts = pickCounts(agg);
    if (!counts) return null;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return total > 0 ? pct(counts[key] ?? 0, total) : null;
  }
  if (mode === "podium_slots") {
    const items = asRecord(agg.items);
    if (!items) return null;
    const totalFirsts = Object.values(items).reduce<number>(
      (a, v) => a + asNumber((v as PodiumItem | undefined)?.first),
      0
    );
    return totalFirsts > 0
      ? pct(asNumber((items[key] as PodiumItem)?.first), totalFirsts)
      : null;
  }
  if (mode === "rank_order") {
    const it = asRecord(agg.items)?.[key] as RankItem | undefined;
    const count = asNumber(it?.count);
    return count > 0 ? pct(asNumber(it?.firsts), count) : null;
  }
  if (mode === "swipe_stack") {
    const c = asRecord(agg.cards)?.[key] as SwipeCard | undefined;
    const total = asNumber(c?.yes) + asNumber(c?.no);
    return total > 0 ? pct(asNumber(c?.yes), total) : null;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* per-family builders                                                 */
/* ------------------------------------------------------------------ */
function regionInsight(
  question: QuestionPublic,
  result: QuestionResult,
  optionIndex: Map<string, number>,
  label: (k: string) => string
): Candidate | null {
  const state = result.your_region?.state;
  const entry = state ? result.state_aggregates?.[state] : undefined;
  if (!state || !entry || entry.sample_n < REGION_MIN_SAMPLE) return null;

  const nationalAgg = asRecord(result.aggregate);
  const stateAgg = asRecord(entry.agg);
  const nationalWinner = winnerOf(question.mode, nationalAgg, optionIndex);
  const stateWinner = winnerOf(question.mode, stateAgg, optionIndex);
  if (!nationalWinner || !stateWinner || nationalWinner === stateWinner) return null;

  const statePct = shareOf(question.mode, stateAgg, stateWinner);
  const natPct = shareOf(question.mode, nationalAgg, nationalWinner);
  if (statePct === null || natPct === null) return null;

  return {
    id: `${result.question_id}:region-differs`,
    template_id: "region-differs",
    headline: `${state} went its own way`,
    body: `${statePct}% of ${state}'s ${entry.sample_n} counted votes back “${label(stateWinner)}” — nationally, “${label(nationalWinner)}” leads with ${natPct}%.`,
    tone: "region",
    priority: PRIORITY.region,
  };
}

function pickInsights(
  result: QuestionResult,
  optionIndex: Map<string, number>,
  label: (k: string) => string
): Candidate[] {
  const payload = result.your_payload!;
  const yourKey = typeof payload.pick === "string" ? payload.pick : null;
  const counts = pickCounts(asRecord(result.aggregate));
  if (!yourKey || !counts) return [];
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total <= 0) return [];

  const yourN = counts[yourKey] ?? 0;
  const yourPct = pct(yourN, total);
  const top = topKey(counts, optionIndex);
  const out: Candidate[] = [];

  if (top === yourKey) {
    out.push({
      id: `${result.question_id}:pick-matched`,
      template_id: "pick-matched",
      headline: `You're with ${yourPct}% of India`,
      body: `“${label(yourKey)}” is the country's top answer — you and ${yourPct}% of ${total} counted votes picked it.`,
      tone: "match",
      priority: PRIORITY.matchDiffer,
    });
  } else if (top) {
    const topPct = pct(counts[top] ?? 0, total);
    out.push({
      id: `${result.question_id}:pick-differs`,
      template_id: "pick-differs",
      headline: `India went the other way`,
      body: `${topPct}% picked “${label(top)}” — you're with the ${yourPct}% who said “${label(yourKey)}”.`,
      tone: "differ",
      priority: PRIORITY.matchDiffer,
    });
  }

  if (yourPct >= 50) {
    out.push({
      id: `${result.question_id}:pick-majority`,
      template_id: "pick-majority",
      headline: `Majority position: ${yourPct}%`,
      body: pickPhrasing(result.question_id, "pick-majority", [
        `More than half the country lands where you do — ${yourPct}% strong.`,
        `You're with the ${yourPct}% mainstream on this one.`,
        `India leans your way: ${yourPct}% picked the same.`,
        `Comfortable majority — ${yourPct}% stand where you do.`,
      ]),
      tone: "majority",
      priority: PRIORITY.majorityMinority,
    });
  } else if (yourPct <= 25) {
    out.push({
      id: `${result.question_id}:pick-minority`,
      template_id: "pick-minority",
      headline: `Minority report: ${yourPct}%`,
      body: `Only ${yourN} of ${total} votes landed on “${label(yourKey)}”. You're holding a rare line.`,
      tone: "minority",
      priority: PRIORITY.majorityMinority,
    });
  }
  return out;
}

function swipeInsights(
  result: QuestionResult,
  label: (k: string) => string
): Candidate[] {
  const votes = asRecord(result.your_payload!.votes);
  const cards = asRecord(asRecord(result.aggregate)?.cards);
  if (!votes || !cards) return [];

  let considered = 0;
  let matched = 0;
  let loneliest: { key: string; vote: "yes" | "no"; sharePct: number } | null = null;
  let strongest: { key: string; vote: "yes" | "no"; sharePct: number } | null = null;

  for (const key of Object.keys(votes).sort()) {
    const vote = votes[key];
    if (vote !== "yes" && vote !== "no") continue;
    const card = cards[key] as SwipeCard | undefined;
    const total = asNumber(card?.yes) + asNumber(card?.no);
    if (total <= 0) continue;

    considered += 1;
    const yesShare = asNumber(card?.yes) / total;
    const crowdSays: "yes" | "no" = yesShare >= 0.5 ? "yes" : "no";
    if (crowdSays === vote) matched += 1;

    const yourSidePct = pct(vote === "yes" ? asNumber(card?.yes) : asNumber(card?.no), total);
    if (!loneliest || yourSidePct < loneliest.sharePct) {
      loneliest = { key, vote, sharePct: yourSidePct };
    }
    if (!strongest || yourSidePct > strongest.sharePct) {
      strongest = { key, vote, sharePct: yourSidePct };
    }
  }
  if (considered === 0) return [];

  const agreePct = pct(matched, considered);
  const out: Candidate[] = [];

  if (agreePct >= 50) {
    out.push({
      id: `${result.question_id}:swipe-matched`,
      template_id: "swipe-matched",
      headline: `You swiped with the crowd ${agreePct}% of the time`,
      body: `On ${matched} of ${considered} cards your call matched India's majority verdict.`,
      tone: "match",
      priority: PRIORITY.matchDiffer,
    });
  } else {
    out.push({
      id: `${result.question_id}:swipe-differs`,
      template_id: "swipe-differs",
      headline: `You went against the room`,
      body: `India's majority matched you on only ${matched} of ${considered} cards (${agreePct}%).`,
      tone: "differ",
      priority: PRIORITY.matchDiffer,
    });
  }

  if (strongest && strongest.sharePct >= 75) {
    out.push({
      id: `${result.question_id}:swipe-majority`,
      template_id: "swipe-majority",
      headline: `${strongest.sharePct}% of India backs you on “${label(strongest.key)}”`,
      body: `You and ${strongest.sharePct}% swiped “${strongest.vote}” — near-consensus.`,
      tone: "majority",
      priority: PRIORITY.majorityMinority,
    });
  }
  if (loneliest && loneliest.sharePct <= 25) {
    out.push({
      id: `${result.question_id}:swipe-minority`,
      template_id: "swipe-minority",
      headline: `Lonely call: ${loneliest.sharePct}%`,
      body: `Only ${loneliest.sharePct}% of India swiped “${loneliest.vote}” on “${label(loneliest.key)}” with you.`,
      tone: "minority",
      priority: PRIORITY.majorityMinority,
    });
  }
  return out;
}

function sorterInsights(
  question: QuestionPublic,
  result: QuestionResult,
  label: (k: string) => string
): Candidate[] {
  const placements = asRecord(result.your_payload!.placements);
  const items = asRecord(asRecord(result.aggregate)?.items);
  if (!placements || !items) return [];

  // dominant-target tie-break: the question's target order, then alphabetical
  const targetOrder = new Map<string, number>(
    (question.targets?.labels ?? []).map((t, i) => [t, i])
  );

  let considered = 0;
  let matched = 0;
  let hardestDiffer: {
    key: string;
    yours: string;
    dominant: string;
    consPct: number;
  } | null = null;
  let strongestMatch: { key: string; dominant: string; consPct: number } | null = null;

  for (const key of Object.keys(placements).sort()) {
    const yours = placements[key];
    if (typeof yours !== "string") continue;
    const dist = asRecord(items[key]);
    if (!dist) continue;
    const totals: Record<string, number> = {};
    let itemTotal = 0;
    for (const [target, n] of Object.entries(dist)) {
      totals[target] = asNumber(n);
      itemTotal += asNumber(n);
    }
    if (itemTotal <= 0) continue;
    const dominant = topKey(totals, targetOrder);
    if (!dominant) continue;

    considered += 1;
    const consPct = pct(totals[dominant], itemTotal);
    if (dominant === yours) {
      matched += 1;
      if (!strongestMatch || consPct > strongestMatch.consPct) {
        strongestMatch = { key, dominant, consPct };
      }
    } else if (!hardestDiffer || consPct > hardestDiffer.consPct) {
      hardestDiffer = { key, yours, dominant, consPct };
    }
  }
  if (considered === 0) return [];

  const agreePct = pct(matched, considered);
  const out: Candidate[] = [];

  if (agreePct >= 50) {
    out.push({
      id: `${result.question_id}:sort-matched`,
      template_id: "sort-matched",
      headline: `Your sort agrees with India ${agreePct}%`,
      body: `${matched} of ${considered} items landed exactly where the country files them.`,
      tone: "match",
      priority: PRIORITY.matchDiffer,
    });
  } else {
    out.push({
      id: `${result.question_id}:sort-differs`,
      template_id: "sort-differs",
      headline: `You file things differently`,
      body: `Only ${matched} of ${considered} placements matched the crowd's dominant choice (${agreePct}%).`,
      tone: "differ",
      priority: PRIORITY.matchDiffer,
    });
  }

  if (strongestMatch && strongestMatch.consPct >= 50) {
    out.push({
      id: `${result.question_id}:sort-majority`,
      template_id: "sort-majority",
      headline: `${strongestMatch.consPct}% file “${label(strongestMatch.key)}” with you`,
      body: `“${strongestMatch.dominant}” is the country's clear home for it.`,
      tone: "majority",
      priority: PRIORITY.majorityMinority,
    });
  }
  if (hardestDiffer) {
    out.push({
      id: `${result.question_id}:sort-minority`,
      template_id: "sort-minority",
      headline: `India says “${hardestDiffer.dominant}”, you say “${hardestDiffer.yours}”`,
      body: `${hardestDiffer.consPct}% of the country files “${label(hardestDiffer.key)}” under “${hardestDiffer.dominant}” — you put it in “${hardestDiffer.yours}”.`,
      tone: "minority",
      priority: PRIORITY.majorityMinority,
    });
  }
  return out;
}

function rankInsights(
  result: QuestionResult,
  optionIndex: Map<string, number>,
  label: (k: string) => string
): Candidate[] {
  const order = result.your_payload!.order;
  const items = asRecord(asRecord(result.aggregate)?.items);
  if (!Array.isArray(order) || order.length === 0 || !items) return [];
  const yourTop = order[0];
  if (typeof yourTop !== "string") return [];

  const ranked = Object.entries(items)
    .map(([key, v]) => {
      const it = v as RankItem;
      const count = asNumber(it?.count);
      return {
        key,
        count,
        firsts: asNumber(it?.firsts),
        avg: count > 0 ? asNumber(it?.posSum) / count : Infinity,
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => {
      if (a.avg !== b.avg) return a.avg - b.avg;
      if (a.firsts !== b.firsts) return b.firsts - a.firsts;
      const ia = optionIndex.get(a.key) ?? Number.MAX_SAFE_INTEGER;
      const ib = optionIndex.get(b.key) ?? Number.MAX_SAFE_INTEGER;
      return ia !== ib ? ia - ib : a.key.localeCompare(b.key);
    });
  if (ranked.length === 0) return [];

  const crowdTop = ranked[0];
  const yourEntry = ranked.find((r) => r.key === yourTop);
  const out: Candidate[] = [];

  if (crowdTop.key === yourTop) {
    const firstsPct = pct(crowdTop.firsts, crowdTop.count);
    out.push({
      id: `${result.question_id}:rank-matched`,
      template_id: "rank-matched",
      headline: `Your #1 is India's #1`,
      body: `“${label(yourTop)}” tops the national ranking — ${firstsPct}% of rankers also put it first.`,
      tone: "match",
      priority: PRIORITY.matchDiffer,
    });
  } else if (yourEntry) {
    const position = ranked.findIndex((r) => r.key === yourTop) + 1;
    out.push({
      id: `${result.question_id}:rank-differs`,
      template_id: "rank-differs",
      headline: `India ranks “${label(crowdTop.key)}” first`,
      body: `Your top pick “${label(yourTop)}” sits at #${position} nationally (average position ${yourEntry.avg.toFixed(1)}).`,
      tone: "differ",
      priority: PRIORITY.matchDiffer,
    });
  }

  if (yourEntry) {
    const yourFirstsPct = pct(yourEntry.firsts, yourEntry.count);
    if (yourFirstsPct >= 50) {
      out.push({
        id: `${result.question_id}:rank-majority`,
        template_id: "rank-majority",
        headline: `Majority position: ${yourFirstsPct}% rank it first`,
        body: `“${label(yourTop)}” is most of India's #1 too.`,
        tone: "majority",
        priority: PRIORITY.majorityMinority,
      });
    } else if (yourFirstsPct <= 25) {
      out.push({
        id: `${result.question_id}:rank-minority`,
        template_id: "rank-minority",
        headline: `Only ${yourFirstsPct}% put “${label(yourTop)}” first`,
        body: pickPhrasing(result.question_id, "rank-minority", [
          `Your gold pick is a rare one.`,
          `Few hands crown “${label(yourTop)}” the way you did.`,
          `That top spot is yours and a small minority's.`,
        ]),
        tone: "minority",
        priority: PRIORITY.majorityMinority,
      });
    }
  }
  return out;
}

function podiumInsights(
  result: QuestionResult,
  optionIndex: Map<string, number>,
  label: (k: string) => string
): Candidate[] {
  const slots = asRecord(result.your_payload!.slots);
  const items = asRecord(asRecord(result.aggregate)?.items);
  if (!slots || !items) return [];
  const yourGold = slots.first;
  if (typeof yourGold !== "string") return [];

  const firsts: Record<string, number> = {};
  let totalFirsts = 0;
  for (const [k, v] of Object.entries(items)) {
    firsts[k] = asNumber((v as PodiumItem)?.first);
    totalFirsts += firsts[k];
  }
  if (totalFirsts <= 0) return [];

  const crowdGold = topKey(firsts, optionIndex);
  if (!crowdGold) return [];
  const yourGoldPct = pct(firsts[yourGold] ?? 0, totalFirsts);
  const crowdGoldPct = pct(firsts[crowdGold], totalFirsts);
  const out: Candidate[] = [];

  if (crowdGold === yourGold) {
    out.push({
      id: `${result.question_id}:podium-matched`,
      template_id: "podium-matched",
      headline: `${yourGoldPct}% of India also gave “${label(yourGold)}” gold`,
      body: pickPhrasing(result.question_id, "podium-matched", [
        `Your podium top matches the country's.`,
        `You and India crowned the same champion.`,
        `Gold agreed — your top pick is the nation's too.`,
      ]),
      tone: "match",
      priority: PRIORITY.matchDiffer,
    });
  } else {
    out.push({
      id: `${result.question_id}:podium-differs`,
      template_id: "podium-differs",
      headline: `India's gold goes to “${label(crowdGold)}”`,
      body: `${crowdGoldPct}% crowned it — you gave gold to “${label(yourGold)}” (${yourGoldPct}%).`,
      tone: "differ",
      priority: PRIORITY.matchDiffer,
    });
  }

  if (yourGoldPct >= 50) {
    out.push({
      id: `${result.question_id}:podium-majority`,
      template_id: "podium-majority",
      headline: `Majority gold: ${yourGoldPct}%`,
      body: `Most of the country crowned “${label(yourGold)}” with you.`,
      tone: "majority",
      priority: PRIORITY.majorityMinority,
    });
  } else if (yourGoldPct <= 25) {
    out.push({
      id: `${result.question_id}:podium-minority`,
      template_id: "podium-minority",
      headline: `Minority gold: ${yourGoldPct}%`,
      body: `Few hands crowned “${label(yourGold)}” — you're among the ${yourGoldPct}%.`,
      tone: "minority",
      priority: PRIORITY.majorityMinority,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* entry point                                                          */
/* ------------------------------------------------------------------ */
export function buildInsights(
  question: QuestionPublic,
  result: QuestionResult
): Insight[] {
  // AC350 — skipped/unanswered: aggregate only, no personal layer.
  if (!result.your_payload) return [];

  const optionIndex = new Map<string, number>(
    question.options.map((o, i) => [o.key, i])
  );
  const labelByKey = new Map<string, string>(
    question.options.map((o) => [o.key, o.label])
  );
  const label = (k: string) => labelByKey.get(k) ?? k;

  const candidates: Candidate[] = [];

  if (!result.still_counting && result.aggregate) {
    if (question.geo) {
      const region = regionInsight(question, result, optionIndex, label);
      if (region) candidates.push(region);
    }

    if (PICK_MODES.includes(question.mode)) {
      candidates.push(...pickInsights(result, optionIndex, label));
    } else if (question.mode === "swipe_stack") {
      candidates.push(...swipeInsights(result, label));
    } else if (SORT_MODES.includes(question.mode)) {
      candidates.push(...sorterInsights(question, result, label));
    } else if (question.mode === "rank_order") {
      candidates.push(...rankInsights(result, optionIndex, label));
    } else if (question.mode === "podium_slots") {
      candidates.push(...podiumInsights(result, optionIndex, label));
    }
  }

  // AC348 — every answered result yields ≥1 insight: honest fallback that
  // only uses sample_n (real number), covering still_counting and thin data.
  if (candidates.length === 0) {
    candidates.push({
      id: `${result.question_id}:counted`,
      template_id: "counted",
      headline: `You're counted`,
      body: result.still_counting
        ? `You're one of ${result.sample_n} counted so far — the picture sharpens as India weighs in.`
        : pickPhrasing(result.question_id, "counted", [
            `Your answer is in a count of ${result.sample_n}.`,
            `Counted — you're one of ${result.sample_n} on the record.`,
            `Logged with ${result.sample_n} others. The tally stands.`,
          ]),
      tone: "info",
      priority: PRIORITY.info,
    });
  }

  return candidates
    .sort(
      (a, b) =>
        a.priority - b.priority || a.template_id.localeCompare(b.template_id)
    )
    .slice(0, MAX_INSIGHTS)
    .map(({ priority: _priority, ...insight }) => insight);
}
