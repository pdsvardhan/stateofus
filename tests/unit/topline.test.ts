/**
 * feat-og-image-gen — topline reducer tests (AC331's number must be honest).
 */
import { describe, expect, it } from "vitest";
import { computeTopline } from "@/lib/share/topline";

const opts = [
  { key: "opt-0", label: "Better transport" },
  { key: "opt-1", label: "Cleaner air" },
  { key: "opt-2", label: "Cheaper rent" },
];

describe("computeTopline", () => {
  it("pick modes: top option with true percentage", () => {
    const t = computeTopline(
      "quick_pick",
      { counts: { "opt-0": 60, "opt-1": 30, "opt-2": 10 } },
      opts,
      100
    );
    expect(t).toEqual({
      label: "Better transport",
      pct: 60,
      statement: "of the count picked this",
    });
  });

  it("swipe: highest yes-share card", () => {
    const t = computeTopline(
      "swipe_stack",
      { cards: { "opt-0": { yes: 9, no: 1 }, "opt-1": { yes: 2, no: 8 } } },
      opts,
      10
    );
    expect(t?.label).toBe("Better transport");
    expect(t?.pct).toBe(90);
  });

  it("rank: lowest average position wins, no fake percentage", () => {
    const t = computeTopline(
      "rank_order",
      {
        items: {
          "opt-0": { posSum: 30, count: 10, firsts: 2 },
          "opt-1": { posSum: 14, count: 10, firsts: 6 },
        },
      },
      opts,
      10
    );
    expect(t?.label).toBe("Cleaner air");
    expect(t?.pct).toBeNull();
    expect(t?.statement).toBe("ranked #1 overall");
  });

  it("sorter: most decisive item/target pairing", () => {
    const t = computeTopline(
      "bucket_sort",
      {
        items: {
          "opt-0": { Dealbreaker: 8, "Don't care": 2 },
          "opt-1": { Dealbreaker: 5, "Don't care": 5 },
        },
      },
      opts,
      10
    );
    expect(t?.label).toBe("Better transport");
    expect(t?.pct).toBe(80);
    expect(t?.statement).toContain("Dealbreaker");
  });

  it("returns null on empty aggregates — card falls back, never invents", () => {
    expect(computeTopline("quick_pick", { counts: {} }, opts, 0)).toBeNull();
    expect(computeTopline("quick_pick", null, opts, 50)).toBeNull();
  });
});
