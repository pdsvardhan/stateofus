/**
 * Canonical enums — feat-question-data-model.
 *
 * Sources of truth:
 *  - Interaction modes: the 8 product modes (adr-005 §4 — design grew 5 → 8).
 *    v5 prototype tokens map 1:1 (quick/trade/swipe/sort/rank/slots/logoquick;
 *    bucket_sort + tier_placement both render through the sorter component).
 *  - DV ids: the 14 renderer tokens shipped in the v5 prototype (adr-006 §1).
 *  - Categories: the 6 desks (CA-020 added The Mirror / Identity).
 *  - Lifecycle: DOC-3 governance states.
 */

export const MODES = [
  "quick_pick",
  "tradeoff_cards",
  "swipe_stack",
  "bucket_sort",
  "tier_placement",
  "rank_order",
  "podium_slots",
  "logo_quick_pick",
  "spectrum",
  "coin_allocation",
  "two_axis",
  "bracket",
  "pin_map",
] as const;
export type Mode = (typeof MODES)[number];

/** Human label per interaction mode (v5 `q.modeLabel`). Used by the rail mini-cards
 *  and any server surface that can't import the (client) interaction registry. */
export const MODE_LABEL: Record<Mode, string> = {
  quick_pick: "Quick Pick",
  tradeoff_cards: "Trade-off",
  swipe_stack: "Swipe Stack",
  bucket_sort: "Bucket Sort",
  tier_placement: "Tier Placement",
  rank_order: "Rank Order",
  podium_slots: "Podium Slots",
  logo_quick_pick: "Quick Pick",
  spectrum: "Spectrum",
  coin_allocation: "Coin Allocation",
  two_axis: "Two-Axis",
  bracket: "Bracket",
  pin_map: "Pin on Map",
};

/** Per-mode default hint line (v5 `q.hint`) — the editorial micro-line under the
 *  mode chip on the answer screen. Stored per-question in `questions.hint`; this is
 *  the fallback/seed default when a question has no hand-authored hint. */
export const MODE_HINT: Record<Mode, string> = {
  quick_pick: "one tap, no overthinking",
  tradeoff_cards: "you must pick one",
  swipe_stack: "verdict per card",
  bucket_sort: "sort every one, one screen",
  tier_placement: "every item, one screen",
  rank_order: "put them in your strict order",
  podium_slots: "tap into your top three",
  logo_quick_pick: "tap the badge you trust",
  spectrum: "drag to where you stand",
  coin_allocation: "spend your 10 coins",
  two_axis: "place each in a quadrant",
  bracket: "tap the winner each round",
  pin_map: "tap where you stand",
};

export const DV_IDS = [
  "split", // S1 split cards
  "radial", // S2 radial split (donut)
  "liquid", // S3 liquid fill bars
  "cups", // liquid cups (alt of split/liquid family)
  "coins", // liquid coins
  "map", // India map, winner fill (G1)
  "bubblemap", // India map, bubbles (G2)
  "tier", // R1 tier board
  "board", // R2 dynamic leaderboard
  "podium", // R3 podium steps
  "medal", // medal board (podium alt)
  "treemap", // P1 treemap
  "heatmatrix", // heat matrix
  "sankey", // sankey flow
  "distribution", // spectrum histogram (0–100 scale)
] as const;
export type DvId = (typeof DV_IDS)[number];

export const CATEGORIES = [
  "City and Place Experience",
  "Daily Life and Livability",
  "Entertainment and Culture",
  "Consumption and Brand Experience",
  "Identity Opinion and Society",
  "Fun and Internet Chaos",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Desk names locked in V5 round-1 answers.
 *  `color`     — the bright accent: fills, dots, chips, and label text on DARK surfaces.
 *  `textColor` — the AA-contrast dark variant (#4): desk/category LABEL TEXT on LIGHT
 *                surfaces, where the bright accent would be unreadable. One designated
 *                colour per desk, used across the app. */
export const DESK_BY_CATEGORY: Record<Category, { desk: string; color: string; textColor: string }> = {
  // Colours match the v5 prototype CATS exactly (line 1180): fire / blue / pink /
  // gold / lime / lavender. (Daily/Culture/Bazaar were previously scrambled.)
  "City and Place Experience": { desk: "The City Desk", color: "var(--fire)", textColor: "var(--fire-ink)" },
  "Daily Life and Livability": { desk: "The Daily Grind", color: "var(--blue)", textColor: "var(--blue-ink)" },
  "Entertainment and Culture": { desk: "The Culture Desk", color: "var(--pink)", textColor: "var(--pink-ink)" },
  "Consumption and Brand Experience": { desk: "The Bazaar", color: "var(--gold)", textColor: "var(--gold-ink)" },
  "Identity Opinion and Society": { desk: "The Mirror", color: "var(--lavender)", textColor: "var(--lavender-ink)" },
  "Fun and Internet Chaos": { desk: "The Chaos Bureau", color: "var(--lime)", textColor: "var(--lime-ink)" },
};

export const LIFECYCLE_STATES = [
  "draft",
  "active",
  "paused",
  "frozen",
  "archived",
] as const;
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];

/* ------------------------------------------------------------------ */
/* Label → canonical mappings for the two import sources               */
/* ------------------------------------------------------------------ */

export const MODE_BY_LABEL: Record<string, Mode> = {
  "Quick Pick": "quick_pick",
  "Trade-off Cards": "tradeoff_cards",
  "Trade-off": "tradeoff_cards",
  "Swipe Stack": "swipe_stack",
  "Bucket Sort": "bucket_sort",
  "Tier Placement": "tier_placement",
  "Rank Order": "rank_order",
  "Podium Slots": "podium_slots",
  "Logo Quick Pick": "logo_quick_pick",
  Spectrum: "spectrum",
  "Coin Allocation": "coin_allocation",
  "Two-Axis": "two_axis",
  Bracket: "bracket",
  "Pin on Map": "pin_map",
  // authored YAML already uses canonical tokens
  quick_pick: "quick_pick",
  tradeoff_cards: "tradeoff_cards",
  swipe_stack: "swipe_stack",
  bucket_sort: "bucket_sort",
  tier_placement: "tier_placement",
  rank_order: "rank_order",
  podium_slots: "podium_slots",
  logo_quick_pick: "logo_quick_pick",
  spectrum: "spectrum",
  coin_allocation: "coin_allocation",
  two_axis: "two_axis",
  bracket: "bracket",
  pin_map: "pin_map",
};

/**
 * DV label → canonical id. `null` = not a DV (Insight Cards is the mandatory
 * personal layer, never a chart). Killed renderers remap to their successor
 * per design DECISIONS (circle packing → treemap) and surface an import
 * warning rather than failing the row.
 */
export const DV_BY_LABEL: Record<string, DvId | null> = {
  "S1 Split Cards": "split",
  "S2 Radial Split": "radial",
  "S3 Liquid Fill": "liquid",
  "G1 Heat Map": "map",
  "G1 Gradient Heat Map": "map", // authored YAML label variant
  "G2 Bubble Map": "bubblemap",
  "R1 Tier Board": "tier",
  "R2 Dynamic Leaderboard": "board",
  "R2 Leaderboard": "board",
  "R3 Podium": "podium",
  "P1 Treemap": "treemap",
  "P2 Circle Packing": "treemap", // killed DV — remap + warning
  "Insight Cards": null, // personal layer, not a DV
};
