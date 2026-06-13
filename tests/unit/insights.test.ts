/**
 * feat-personal-insight-layer — template registry unit tests.
 *
 *  AC348: every answered result yields ≥1 insight (incl. still-counting fallback)
 *  AC349: templates only — exact strings with real-math numbers asserted here
 *  AC350: skipped/unanswered (your_payload null) → empty insight list
 *  + per-mode selection with crafted aggregates, deterministic priority order
 *    (region-differs > match/differ > majority/minority), max 3, small-sample
 *    region gate (state sample_n < 5 never emits).
 */
import { describe, expect, it } from "vitest";
import {
  buildInsights,
  MAX_INSIGHTS,
  REGION_MIN_SAMPLE,
} from "@/lib/insights/templates";
import type { Mode } from "@/lib/catalogue/enums";
import type { QuestionPublic, QuestionResult } from "@/lib/types";

function makeQuestion(mode: Mode, overrides: Partial<QuestionPublic> = {}): QuestionPublic {
  return {
    id: "T-01",
    category: "Daily Life and Livability",
    desk: "The Daily Grind",
    subcategory: null,
    title: null,
    text: "chai or coffee?",
    mode,
    options: [
      { key: "opt-0", label: "Chai" },
      { key: "opt-1", label: "Coffee" },
      { key: "opt-2", label: "Neither" },
    ],
    targets: null,
    skip_allowed: true,
    primary_dv: "split",
    secondary_dvs: [],
    insight_type: null,
    editorial_note: null,
    geo: false,
    status: "active",
    created_at: "2026-06-13T00:00:00Z",
    ...overrides,
  };
}

function makeResult(overrides: Partial<QuestionResult> = {}): QuestionResult {
  return {
    question_id: "T-01",
    status: "active",
    still_counting: false,
    sample_n: 100,
    aggregate: null,
    your_payload: null,
    ...overrides,
  };
}

describe("AC350 — no answer, no personal layer", () => {
  it("returns [] when your_payload is null", () => {
    const insights = buildInsights(
      makeQuestion("quick_pick"),
      makeResult({ aggregate: { counts: { "opt-0": 60, "opt-1": 40 } } })
    );
    expect(insights).toEqual([]);
  });
});

describe("AC348 — answered always yields ≥1 insight", () => {
  it("still-counting answered result gets the info fallback with real sample_n", () => {
    const insights = buildInsights(
      makeQuestion("quick_pick"),
      makeResult({
        still_counting: true,
        sample_n: 4,
        your_payload: { pick: "opt-0" },
      })
    );
    expect(insights).toHaveLength(1);
    expect(insights[0].template_id).toBe("counted");
    expect(insights[0].tone).toBe("info");
    expect(insights[0].headline).toBe("You're counted");
    expect(insights[0].body).toBe(
      "You're one of 4 counted so far — the picture sharpens as India weighs in."
    );
  });
});

describe("pick modes — counts math", () => {
  const counts = { "opt-0": 60, "opt-1": 30, "opt-2": 10 };

  it("you-matched-X% + majority when your pick is the ≥50% winner", () => {
    const insights = buildInsights(
      makeQuestion("quick_pick"),
      makeResult({ aggregate: { counts }, your_payload: { pick: "opt-0" } })
    );
    expect(insights.map((i) => i.template_id)).toEqual([
      "pick-matched",
      "pick-majority",
    ]);
    expect(insights[0].headline).toBe("You're with 60% of India");
    expect(insights[0].body).toBe(
      "“Chai” is the country's top answer — you and 60% of 100 counted votes picked it."
    );
    expect(insights[0].tone).toBe("match");
    expect(insights[1].headline).toBe("Majority position: 60%");
    expect(insights[1].tone).toBe("majority");
  });

  it("you-differ when your pick is not the majority", () => {
    const insights = buildInsights(
      makeQuestion("quick_pick"),
      makeResult({ aggregate: { counts }, your_payload: { pick: "opt-1" } })
    );
    expect(insights).toHaveLength(1);
    expect(insights[0].template_id).toBe("pick-differs");
    expect(insights[0].tone).toBe("differ");
    expect(insights[0].headline).toBe("India went the other way");
    expect(insights[0].body).toBe(
      "60% picked “Chai” — you're with the 30% who said “Coffee”."
    );
  });

  it("minority position at ≤25% share", () => {
    const insights = buildInsights(
      makeQuestion("tradeoff_cards"),
      makeResult({
        aggregate: { counts: { "opt-0": 80, "opt-1": 15, "opt-2": 5 } },
        your_payload: { pick: "opt-2" },
      })
    );
    expect(insights.map((i) => i.template_id)).toEqual([
      "pick-differs",
      "pick-minority",
    ]);
    expect(insights[1].headline).toBe("Minority report: 5%");
    expect(insights[1].body).toBe(
      "Only 5 of 100 votes landed on “Neither”. You're holding a rare line."
    );
    expect(insights[1].tone).toBe("minority");
  });
});

describe("region-differs — state vs national winner", () => {
  const geoQuestion = makeQuestion("quick_pick", { geo: true });
  const national = { counts: { "opt-0": 60, "opt-1": 30, "opt-2": 10 } };

  it("emits first (highest priority) with exact state/national numbers", () => {
    const insights = buildInsights(
      geoQuestion,
      makeResult({
        aggregate: national,
        your_payload: { pick: "opt-1" },
        your_region: { state: "Karnataka", city: "Bengaluru" },
        state_aggregates: {
          Karnataka: { agg: { counts: { "opt-1": 6, "opt-0": 2 } }, sample_n: 8 },
        },
      })
    );
    expect(insights[0].template_id).toBe("region-differs");
    expect(insights[0].tone).toBe("region");
    expect(insights[0].headline).toBe("Karnataka went its own way");
    expect(insights[0].body).toBe(
      "75% of Karnataka's 8 counted votes back “Coffee” — nationally, “Chai” leads with 60%."
    );
    expect(insights[1].template_id).toBe("pick-differs");
  });

  it(`never emits below the small-sample gate (state sample_n < ${REGION_MIN_SAMPLE})`, () => {
    const insights = buildInsights(
      geoQuestion,
      makeResult({
        aggregate: national,
        your_payload: { pick: "opt-1" },
        your_region: { state: "Karnataka", city: null },
        state_aggregates: {
          Karnataka: { agg: { counts: { "opt-1": 3, "opt-0": 1 } }, sample_n: 4 },
        },
      })
    );
    expect(insights.some((i) => i.template_id === "region-differs")).toBe(false);
  });

  it("not emitted when the state winner matches the national winner", () => {
    const insights = buildInsights(
      geoQuestion,
      makeResult({
        aggregate: national,
        your_payload: { pick: "opt-0" },
        your_region: { state: "Karnataka", city: null },
        state_aggregates: {
          Karnataka: { agg: { counts: { "opt-0": 5, "opt-1": 2 } }, sample_n: 7 },
        },
      })
    );
    expect(insights.some((i) => i.template_id === "region-differs")).toBe(false);
  });

  it("caps at 3, region first, deterministic order", () => {
    const insights = buildInsights(
      geoQuestion,
      makeResult({
        aggregate: national,
        your_payload: { pick: "opt-0" },
        your_region: { state: "Karnataka", city: null },
        state_aggregates: {
          Karnataka: { agg: { counts: { "opt-1": 6, "opt-0": 2 } }, sample_n: 8 },
        },
      })
    );
    expect(insights).toHaveLength(MAX_INSIGHTS);
    expect(insights.map((i) => i.template_id)).toEqual([
      "region-differs",
      "pick-matched",
      "pick-majority",
    ]);
  });
});

describe("swipe_stack — per-card yes-share vs your votes", () => {
  it("agreement %, near-consensus majority and lonely-call minority", () => {
    const insights = buildInsights(
      makeQuestion("swipe_stack"),
      makeResult({
        aggregate: {
          cards: {
            "opt-0": { yes: 8, no: 2 },
            "opt-1": { yes: 2, no: 8 },
            "opt-2": { yes: 5, no: 5 },
          },
        },
        your_payload: { votes: { "opt-0": "yes", "opt-1": "yes", "opt-2": "no" } },
      })
    );
    expect(insights.map((i) => i.template_id)).toEqual([
      "swipe-differs",
      "swipe-majority",
      "swipe-minority",
    ]);
    expect(insights[0].headline).toBe("You went against the room");
    expect(insights[0].body).toBe(
      "India's majority matched you on only 1 of 3 cards (33%)."
    );
    expect(insights[1].headline).toBe("80% of India backs you on “Chai”");
    expect(insights[2].headline).toBe("Lonely call: 20%");
    expect(insights[2].body).toBe(
      "Only 20% of India swiped “yes” on “Coffee” with you."
    );
  });
});

describe("sorter modes — your placements vs crowd-dominant placement", () => {
  it("agreement %, strongest-consensus majority + hardest differ as minority", () => {
    const insights = buildInsights(
      makeQuestion("bucket_sort", {
        targets: { kind: "buckets", labels: ["Keep", "Cancel"] },
      }),
      makeResult({
        aggregate: {
          items: {
            "opt-0": { Keep: 7, Cancel: 3 },
            "opt-1": { Keep: 9, Cancel: 1 },
            "opt-2": { Keep: 2, Cancel: 8 },
          },
        },
        your_payload: {
          placements: { "opt-0": "Keep", "opt-1": "Cancel", "opt-2": "Cancel" },
        },
      })
    );
    expect(insights.map((i) => i.template_id)).toEqual([
      "sort-matched",
      "sort-majority",
      "sort-minority",
    ]);
    expect(insights[0].headline).toBe("Your sort agrees with India 67%");
    expect(insights[0].body).toBe(
      "2 of 3 items landed exactly where the country files them."
    );
    expect(insights[1].headline).toBe("80% file “Neither” with you");
    expect(insights[2].headline).toBe("India says “Keep”, you say “Cancel”");
    expect(insights[2].body).toBe(
      "90% of the country files “Coffee” under “Keep” — you put it in “Cancel”."
    );
  });
});

describe("rank_order — your top pick vs crowd #1 (avg-rank distance)", () => {
  const items = {
    "opt-0": { posSum: 12, count: 10, firsts: 8 }, // avg 1.2 → crowd #1
    "opt-1": { posSum: 20, count: 10, firsts: 2 }, // avg 2.0
    "opt-2": { posSum: 28, count: 10, firsts: 0 }, // avg 2.8
  };

  it("differ: crowd position + average position of your top pick", () => {
    const insights = buildInsights(
      makeQuestion("rank_order"),
      makeResult({
        aggregate: { items },
        your_payload: { order: ["opt-1", "opt-0", "opt-2"] },
      })
    );
    expect(insights.map((i) => i.template_id)).toEqual([
      "rank-differs",
      "rank-minority",
    ]);
    expect(insights[0].headline).toBe("India ranks “Chai” first");
    expect(insights[0].body).toBe(
      "Your top pick “Coffee” sits at #2 nationally (average position 2.0)."
    );
    expect(insights[1].headline).toBe("Only 20% put “Coffee” first");
  });

  it("match: firsts share of the shared #1", () => {
    const insights = buildInsights(
      makeQuestion("rank_order"),
      makeResult({
        aggregate: { items },
        your_payload: { order: ["opt-0", "opt-1", "opt-2"] },
      })
    );
    expect(insights.map((i) => i.template_id)).toEqual([
      "rank-matched",
      "rank-majority",
    ]);
    expect(insights[0].headline).toBe("Your #1 is India's #1");
    expect(insights[0].body).toBe(
      "“Chai” tops the national ranking — 80% of rankers also put it first."
    );
    expect(insights[1].headline).toBe("Majority position: 80% rank it first");
  });
});

describe("podium_slots — your 1st vs crowd 1st", () => {
  it("differ with both gold shares from first-place counts", () => {
    const insights = buildInsights(
      makeQuestion("podium_slots"),
      makeResult({
        aggregate: {
          items: {
            "opt-0": { first: 5, second: 3, third: 1 },
            "opt-1": { first: 4, second: 2, third: 2 },
            "opt-2": { first: 1, second: 1, third: 3 },
          },
        },
        your_payload: { slots: { first: "opt-1", second: "opt-0" } },
      })
    );
    expect(insights).toHaveLength(1);
    expect(insights[0].template_id).toBe("podium-differs");
    expect(insights[0].headline).toBe("India's gold goes to “Chai”");
    expect(insights[0].body).toBe(
      "50% crowned it — you gave gold to “Coffee” (40%)."
    );
  });

  it("match: your gold share when podium tops align", () => {
    const insights = buildInsights(
      makeQuestion("podium_slots"),
      makeResult({
        aggregate: {
          items: {
            "opt-0": { first: 6, second: 2, third: 1 },
            "opt-1": { first: 3, second: 4, third: 2 },
            "opt-2": { first: 1, second: 2, third: 4 },
          },
        },
        your_payload: { slots: { first: "opt-0" } },
      })
    );
    expect(insights.map((i) => i.template_id)).toEqual([
      "podium-matched",
      "podium-majority",
    ]);
    expect(insights[0].headline).toBe("60% of India also gave “Chai” gold");
    expect(insights[1].headline).toBe("Majority gold: 60%");
  });
});
