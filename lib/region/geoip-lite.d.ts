/**
 * Ambient types for geoip-lite@2.0.2 — the package ships no .d.ts.
 * Shape verified against node_modules/geoip-lite/lib/geoip.js (module.exports)
 * and live lookups: region is the ISO 3166-2 subdivision code ("KA"), city is
 * "" when unresolved, lookup returns null for private ranges / unknown IPs.
 */
declare module "geoip-lite" {
  export type GeoLookup = {
    range: [number, number];
    country: string; // ISO 3166-1 alpha-2, e.g. "IN"
    region: string; // ISO 3166-2 subdivision code, e.g. "KA" ("" if unknown)
    eu: "0" | "1";
    timezone: string;
    city: string; // "" when unresolved
    ll: [number, number];
    metro: number;
    area: number;
  };

  export function lookup(ip: string | number): GeoLookup | null;
  export function pretty(n: number | string): string;
}
