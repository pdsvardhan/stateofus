/**
 * Result reveal logic — feat-result-reveal.
 *
 * AC341: reveal pattern is per-question config: immediate | threshold |
 * progressive. AC342: below the gate the page shows the still-counting
 * placeholder (context + encouragement) — never an empty chart, never fake
 * precision. AC343: crossing the gate activates the result with no manual
 * step (the result endpoint simply starts returning the aggregate).
 */
export const MIN_REVEAL_N = 10;

/** progressive shows honest "early returns" from this floor */
export const PROGRESSIVE_FLOOR_N = 3;

export type RevealPattern = "immediate" | "threshold" | "progressive";

export type RevealDecision = {
  revealed: boolean;
  /** true when revealed under a progressive pattern below MIN_REVEAL_N */
  early_returns: boolean;
};

export function decideReveal(pattern: RevealPattern, sampleN: number): RevealDecision {
  switch (pattern) {
    case "immediate":
      return { revealed: sampleN >= 1, early_returns: sampleN < MIN_REVEAL_N };
    case "progressive":
      return {
        revealed: sampleN >= PROGRESSIVE_FLOOR_N,
        early_returns: sampleN < MIN_REVEAL_N,
      };
    case "threshold":
    default:
      return { revealed: sampleN >= MIN_REVEAL_N, early_returns: false };
  }
}
