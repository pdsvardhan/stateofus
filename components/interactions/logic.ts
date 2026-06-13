/**
 * Pure interaction logic — extracted from the v5 prototype handlers so the
 * reducers can be unit-tested without a DOM (tests/unit/interactions-logic).
 *
 * No React imports here — vitest runs these in a plain node environment.
 */

/** v5 TIERBG palette — solid bucket-card fills, cycled by target index. */
export const TIER_COLORS = [
  "var(--fire)",
  "var(--gold)",
  "var(--lime)",
  "var(--blue)",
] as const;

export function tierColor(index: number): string {
  return TIER_COLORS[index % TIER_COLORS.length];
}

/* ------------------------------------------------------------------ */
/* Rank order                                                          */
/* ------------------------------------------------------------------ */

/**
 * Arrow nudge (v5 rankMove): swap the item at `index` with its neighbour in
 * `dir` (-1 = up, +1 = down). Out-of-range moves return the original array.
 */
export function moveInOrder(order: string[], index: number, dir: -1 | 1): string[] {
  const j = index + dir;
  if (index < 0 || index >= order.length || j < 0 || j >= order.length) return order;
  const next = order.slice();
  const t = next[j];
  next[j] = next[index];
  next[index] = t;
  return next;
}

/* ------------------------------------------------------------------ */
/* Sorter (bucket_sort + tier_placement)                               */
/* ------------------------------------------------------------------ */

/**
 * v5 sortCurrent: the teed-up item is the explicit selection if it is still
 * unfiled, otherwise the first unfiled item in option order. Null when all
 * items are filed.
 */
export function nextSortItem(
  itemKeys: string[],
  placements: Record<string, number>,
  selected: string | null
): string | null {
  if (selected !== null && placements[selected] === undefined && itemKeys.includes(selected)) {
    return selected;
  }
  return itemKeys.find((k) => placements[k] === undefined) ?? null;
}

/** File an item into a target index. Unknown targets are a no-op. */
export function fileItem(
  placements: Record<string, number>,
  key: string,
  targetIndex: number,
  targetCount: number
): Record<string, number> {
  if (targetIndex < 0 || targetIndex >= targetCount) return placements;
  return { ...placements, [key]: targetIndex };
}

/** Pull an item back out of its bucket. */
export function unfileItem(
  placements: Record<string, number>,
  key: string
): Record<string, number> {
  if (placements[key] === undefined) return placements;
  const next = { ...placements };
  delete next[key];
  return next;
}

/**
 * Build the bucket_sort / tier_placement payload: option key → target LABEL
 * (lib/interactions/payloads.ts stores labels, not indices). Placements that
 * point at a missing label are dropped rather than emitting bad data.
 */
export function placementsPayload(
  placements: Record<string, number>,
  targetLabels: string[]
): { placements: Record<string, string> } {
  const out: Record<string, string> = {};
  for (const [key, ti] of Object.entries(placements)) {
    const label = targetLabels[ti];
    if (label !== undefined) out[key] = label;
  }
  return { placements: out };
}

/* ------------------------------------------------------------------ */
/* Podium slots                                                        */
/* ------------------------------------------------------------------ */

export type SlotState = [string | null, string | null, string | null];

/**
 * v5 slotTake: place an option into the first empty slot (gold fills first).
 * No-op when the option is already placed or the podium is full.
 */
export function takeSlot(slots: SlotState, key: string): SlotState {
  if (slots.includes(key)) return slots;
  const empty = slots.indexOf(null);
  if (empty < 0) return slots;
  const next = slots.slice() as SlotState;
  next[empty] = key;
  return next;
}

/** v5 slotClear: empty one slot (tap a filled slot to clear it). */
export function clearSlot(slots: SlotState, index: number): SlotState {
  if (index < 0 || index > 2 || slots[index] === null) return slots;
  const next = slots.slice() as SlotState;
  next[index] = null;
  return next;
}

/**
 * podium_slots payload. 1st place alone is a valid answer (LAB-002); returns
 * null while the gold slot is empty — the submit button stays disabled.
 */
export function slotsPayload(
  slots: SlotState
): { slots: { first: string; second?: string; third?: string } } | null {
  const [first, second, third] = slots;
  if (first === null) return null;
  const out: { first: string; second?: string; third?: string } = { first };
  if (second !== null) out.second = second;
  if (third !== null) out.third = third;
  return { slots: out };
}

/* ------------------------------------------------------------------ */
/* Swipe stack                                                         */
/* ------------------------------------------------------------------ */

/** Record one verdict; re-swiping a card keeps the latest verdict. */
export function recordSwipe(
  votes: Record<string, "yes" | "no">,
  key: string,
  isYes: boolean
): Record<string, "yes" | "no"> {
  return { ...votes, [key]: isYes ? "yes" : "no" };
}
