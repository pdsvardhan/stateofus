/**
 * India geography — feat-dv-engine.
 *
 * Thin wrapper over @svg-maps/india (real boundaries, house inks — the v5
 * prototype loaded the same package from CDN). Exposes the locations plus
 * the fuzzy name matcher the prototype used to join state aggregate keys
 * (e.g. "National Capital Territory of Delhi" from geo capture) to map
 * location names (e.g. "Delhi").
 */
import india from "@svg-maps/india";

export type IndiaLocation = { id: string; name: string; path: string };

const map = india as unknown as { label: string; viewBox: string; locations: IndiaLocation[] };

export const INDIA_VIEWBOX: string = map.viewBox;
export const INDIA_LOCATIONS: IndiaLocation[] = map.locations;

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Match one SVG location name against the aggregate state keys.
 * Exact match wins; otherwise the longest substring containment either way
 * (so "Delhi" ↔ "National Capital Territory of Delhi" joins).
 */
export function matchStateKey(locationName: string, stateKeys: string[]): string | null {
  const n = norm(locationName);
  if (!n) return null;
  let best: string | null = null;
  let bestLen = 0;
  for (const key of stateKeys) {
    const k = norm(key);
    if (!k) continue;
    if (k === n) return key;
    if ((n.includes(k) || k.includes(n)) && k.length > bestLen) {
      best = key;
      bestLen = k.length;
    }
  }
  return best;
}

/** Reverse join: which location renders this aggregate state key? */
export function locationForState(stateKey: string): IndiaLocation | null {
  const k = norm(stateKey);
  if (!k) return null;
  let best: IndiaLocation | null = null;
  let bestLen = 0;
  for (const loc of INDIA_LOCATIONS) {
    const n = norm(loc.name);
    if (n === k) return loc;
    if ((n.includes(k) || k.includes(n)) && n.length > bestLen) {
      best = loc;
      bestLen = n.length;
    }
  }
  return best;
}
