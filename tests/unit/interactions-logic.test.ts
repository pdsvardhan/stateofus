/**
 * Unit tests for the pure interaction reducers extracted from the v5
 * prototype handlers (components/interactions/logic.ts). These are the
 * pieces the payload contract depends on — payload shapes are asserted
 * against lib/interactions/payloads.ts schemas to keep the two halves in
 * lockstep.
 */
import { describe, expect, it } from "vitest";
import {
  TIER_COLORS,
  clearSlot,
  fileItem,
  moveInOrder,
  nextSortItem,
  placementsPayload,
  recordSwipe,
  slotsPayload,
  takeSlot,
  tierColor,
  unfileItem,
  type SlotState,
} from "@/components/interactions/logic";
import { payloadSchemas } from "@/lib/interactions/payloads";

describe("moveInOrder (rank arrows)", () => {
  const order = ["a", "b", "c", "d"];

  it("moves an item up by swapping with its neighbour", () => {
    expect(moveInOrder(order, 2, -1)).toEqual(["a", "c", "b", "d"]);
  });

  it("moves an item down", () => {
    expect(moveInOrder(order, 0, 1)).toEqual(["b", "a", "c", "d"]);
  });

  it("is a no-op at the edges (FB-018 — top ↑ / bottom ↓ disabled)", () => {
    expect(moveInOrder(order, 0, -1)).toBe(order);
    expect(moveInOrder(order, 3, 1)).toBe(order);
  });

  it("does not mutate the input", () => {
    moveInOrder(order, 1, 1);
    expect(order).toEqual(["a", "b", "c", "d"]);
  });

  it("any full order produced is a valid rank_order payload", () => {
    const next = moveInOrder(order, 1, 1);
    expect(payloadSchemas.rank_order.safeParse({ order: next }).success).toBe(true);
  });
});

describe("sorter reducers", () => {
  const keys = ["netflix", "prime", "yt", "spotify"];

  it("nextSortItem returns the first unfiled item when nothing is selected", () => {
    expect(nextSortItem(keys, {}, null)).toBe("netflix");
    expect(nextSortItem(keys, { netflix: 0 }, null)).toBe("prime");
  });

  it("nextSortItem honours an explicit unfiled selection", () => {
    expect(nextSortItem(keys, {}, "yt")).toBe("yt");
  });

  it("nextSortItem ignores a selection that is already filed", () => {
    expect(nextSortItem(keys, { yt: 1 }, "yt")).toBe("netflix");
  });

  it("nextSortItem ignores selections that are not real items", () => {
    expect(nextSortItem(keys, {}, "ghost-key")).toBe("netflix");
  });

  it("nextSortItem returns null when everything is filed", () => {
    const all = { netflix: 0, prime: 1, yt: 0, spotify: 2 };
    expect(nextSortItem(keys, all, null)).toBeNull();
  });

  it("fileItem places and unfileItem pulls back, immutably", () => {
    const a = fileItem({}, "netflix", 1, 3);
    expect(a).toEqual({ netflix: 1 });
    const b = fileItem(a, "prime", 0, 3);
    expect(b).toEqual({ netflix: 1, prime: 0 });
    expect(a).toEqual({ netflix: 1 });
    const c = unfileItem(b, "netflix");
    expect(c).toEqual({ prime: 0 });
    expect(b).toEqual({ netflix: 1, prime: 0 });
  });

  it("fileItem rejects out-of-range targets", () => {
    const start = { netflix: 0 };
    expect(fileItem(start, "prime", 5, 3)).toBe(start);
    expect(fileItem(start, "prime", -1, 3)).toBe(start);
  });

  it("unfileItem is a no-op for unfiled keys", () => {
    const start = { netflix: 0 };
    expect(unfileItem(start, "prime")).toBe(start);
  });

  it("placementsPayload maps target indices to target LABELS", () => {
    const labels = ["Keep", "Share acct", "Cancel"];
    expect(placementsPayload({ netflix: 0, yt: 2 }, labels)).toEqual({
      placements: { netflix: "Keep", yt: "Cancel" },
    });
  });

  it("placementsPayload drops placements pointing at missing labels", () => {
    expect(placementsPayload({ netflix: 7 }, ["Keep"])).toEqual({ placements: {} });
  });

  it("partial placements satisfy the bucket_sort/tier_placement schemas (LAB-002)", () => {
    const payload = placementsPayload({ netflix: 0 }, ["Keep", "Cancel"]);
    expect(payloadSchemas.bucket_sort.safeParse(payload).success).toBe(true);
    expect(payloadSchemas.tier_placement.safeParse(payload).success).toBe(true);
    // zero placements must NOT validate — submit gate is ≥1
    expect(payloadSchemas.bucket_sort.safeParse({ placements: {} }).success).toBe(
      false
    );
  });
});

describe("podium slot reducers", () => {
  it("takeSlot fills gold first, then silver, then bronze", () => {
    let s: SlotState = [null, null, null];
    s = takeSlot(s, "samosa");
    expect(s).toEqual(["samosa", null, null]);
    s = takeSlot(s, "vada-pav");
    expect(s).toEqual(["samosa", "vada-pav", null]);
    s = takeSlot(s, "momo");
    expect(s).toEqual(["samosa", "vada-pav", "momo"]);
  });

  it("takeSlot refuses duplicates and a full podium", () => {
    const full: SlotState = ["a", "b", "c"];
    expect(takeSlot(full, "d")).toBe(full);
    const partial: SlotState = ["a", null, null];
    expect(takeSlot(partial, "a")).toBe(partial);
  });

  it("takeSlot fills the earliest empty slot after a clear", () => {
    const s = clearSlot(["a", "b", "c"], 1);
    expect(s).toEqual(["a", null, "c"]);
    expect(takeSlot(s, "d")).toEqual(["a", "d", "c"]);
  });

  it("clearSlot empties one slot and no-ops out of range / already empty", () => {
    const s: SlotState = ["a", null, "c"];
    expect(clearSlot(s, 2)).toEqual(["a", null, null]);
    expect(clearSlot(s, 1)).toBe(s);
    expect(clearSlot(s, 5)).toBe(s);
  });

  it("slotsPayload requires 1st place (LAB-002 early submit floor)", () => {
    expect(slotsPayload([null, "b", null])).toBeNull();
    expect(slotsPayload(["a", null, null])).toEqual({ slots: { first: "a" } });
  });

  it("slotsPayload omits empty optional slots and validates against the schema", () => {
    const partial = slotsPayload(["a", null, "c"]);
    expect(partial).toEqual({ slots: { first: "a", third: "c" } });
    expect(payloadSchemas.podium_slots.safeParse(partial).success).toBe(true);
    const full = slotsPayload(["a", "b", "c"]);
    expect(full).toEqual({ slots: { first: "a", second: "b", third: "c" } });
    expect(payloadSchemas.podium_slots.safeParse(full).success).toBe(true);
  });
});

describe("swipe reducer", () => {
  it("records verdicts per option key", () => {
    const v1 = recordSwipe({}, "metro", true);
    expect(v1).toEqual({ metro: "yes" });
    const v2 = recordSwipe(v1, "rents", false);
    expect(v2).toEqual({ metro: "yes", rents: "no" });
    expect(v1).toEqual({ metro: "yes" });
  });

  it("keeps the latest verdict on a re-swipe", () => {
    const v = recordSwipe({ metro: "yes" }, "metro", false);
    expect(v).toEqual({ metro: "no" });
  });

  it("a single swipe satisfies the swipe_stack schema (LAB-002), zero does not", () => {
    expect(
      payloadSchemas.swipe_stack.safeParse({ votes: recordSwipe({}, "metro", true) })
        .success
    ).toBe(true);
    expect(payloadSchemas.swipe_stack.safeParse({ votes: {} }).success).toBe(false);
  });
});

describe("tier colours (S3 solid bucket cards)", () => {
  it("cycles the v5 TIERBG palette", () => {
    expect(tierColor(0)).toBe(TIER_COLORS[0]);
    expect(tierColor(3)).toBe(TIER_COLORS[3]);
    expect(tierColor(4)).toBe(TIER_COLORS[0]);
    expect(tierColor(6)).toBe(TIER_COLORS[2]);
  });

  it("palette only references CSS tokens, never raw hex", () => {
    for (const c of TIER_COLORS) {
      expect(c).toMatch(/^var\(--[a-z-]+\)$/);
    }
  });
});
