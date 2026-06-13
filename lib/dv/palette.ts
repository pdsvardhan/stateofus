/**
 * DV palettes — feat-dv-engine.
 *
 * Every color is a design token (var(--*)) or a color-mix() of tokens —
 * never hardcoded hex (house rule). Mixes reproduce the v5 prototype's
 * in-between shades (gray-lavender rank steps, silver, bronze) from the
 * locked token set in app/globals.css.
 */

export type Swatch = { bg: string; fg: string };

/** v5 RANKPAL/RANKFG — rank 0 (biggest) → rank 5+. */
export const RANK_PAL: Swatch[] = [
  { bg: "var(--fire)", fg: "var(--ink)" },
  { bg: "var(--ink-soft)", fg: "var(--paper)" },
  { bg: "var(--muted)", fg: "var(--paper)" },
  { bg: "color-mix(in srgb, var(--lavender) 62%, var(--paper-bright))", fg: "var(--ink)" },
  { bg: "color-mix(in srgb, var(--lavender) 32%, var(--paper-bright))", fg: "var(--ink)" },
  { bg: "var(--paper-deep)", fg: "var(--ink)" },
];

export function rankSwatch(rank: number): Swatch {
  return RANK_PAL[Math.min(Math.max(0, rank), RANK_PAL.length - 1)];
}

/** v5 MAPPAL — winner-map option inks (MAPA brand inks default). */
export const MAP_PAL: string[] = [
  "var(--fire)",
  "var(--ink)",
  "var(--gold)",
  "var(--lime)",
  "var(--blue)",
  "var(--pink)",
  "var(--lavender)",
  "var(--ink-soft)",
];

export function mapInk(optionIdx: number): string {
  return MAP_PAL[((optionIdx % MAP_PAL.length) + MAP_PAL.length) % MAP_PAL.length];
}

/** v5 TIERBG — tier-row plates, cycled past four. */
export const TIER_PAL: string[] = [
  "var(--fire)",
  "var(--gold)",
  "var(--lime)",
  "var(--blue)",
  "var(--pink)",
  "var(--lavender)",
];

export function tierInk(tierIdx: number): string {
  return TIER_PAL[((tierIdx % TIER_PAL.length) + TIER_PAL.length) % TIER_PAL.length];
}

/** Podium step colors — 1st / 2nd / 3rd (v5 podColors #FF5A47/#34304E/#9D98B1). */
export const PODIUM_STEPS: Swatch[] = [
  { bg: "var(--fire)", fg: "var(--ink)" },
  { bg: "var(--ink-soft)", fg: "var(--paper)" },
  { bg: "var(--muted-violet)", fg: "var(--ink)" },
];

/** Medal circles — gold / silver / bronze (v5 medColors #FFC53D/#C9C5D6/#D98E5F). */
export const MEDALS: { place: string; bg: string }[] = [
  { place: "1st", bg: "var(--gold)" },
  { place: "2nd", bg: "var(--silver)" },
  { place: "3rd", bg: "var(--bronze)" },
];

/** Cup pours — first two are the v5 cupColors, then house accents. */
export const CUP_PAL: string[] = [
  "var(--fire)",
  "var(--ink-soft)",
  "var(--gold)",
  "var(--blue)",
  "var(--pink)",
  "var(--lavender)",
];

/** Sankey ribbon inks (v5: fire vs ink-soft). */
export const FLOW_PAL: [string, string] = ["var(--fire)", "var(--ink-soft)"];

/** Translucent ink (e.g. 8 → rgba(ink, .08)) without leaving the tokens. */
export function inkVeil(pct: number): string {
  return `color-mix(in srgb, var(--ink) ${pct}%, transparent)`;
}

/** Translucent paper, for waves and bars on dark plates. */
export function paperVeil(pct: number): string {
  return `color-mix(in srgb, var(--paper) ${pct}%, transparent)`;
}

/**
 * Heat ramp — the v5 multi-stop gradient (paper-bright → gold → fire → ink),
 * per design DECISIONS: multi-color ramps, never flat single-color.
 * t in [0, 1].
 */
const HEAT_STOPS = ["var(--paper-bright)", "var(--gold)", "var(--fire)", "var(--ink)"];

export function heatSwatch(t: number): Swatch {
  const clamped = Math.max(0, Math.min(1, t));
  const seg = Math.min(2, Math.floor(clamped * 3));
  const lt = Math.round((clamped * 3 - seg) * 100);
  return {
    bg: `color-mix(in srgb, ${HEAT_STOPS[seg + 1]} ${lt}%, ${HEAT_STOPS[seg]})`,
    fg: clamped > 0.72 ? "var(--paper)" : "var(--ink)",
  };
}

/** The legend strip for the heat ramp. */
export const HEAT_LEGEND_GRADIENT = `linear-gradient(90deg, ${HEAT_STOPS.join(", ")})`;

/** Light→dark ramp of one map ink (gradient fills — never flat). */
export function mapGradientStops(ink: string): { from: string; to: string } {
  return { from: `color-mix(in srgb, ${ink} 50%, var(--paper-bright))`, to: ink };
}
