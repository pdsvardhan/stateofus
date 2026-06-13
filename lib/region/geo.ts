/**
 * IP → coarse region lookup — feat-region-capture (AC376/AC378).
 *
 * geoip-lite resolves an IP to {country, region (ISO 3166-2 code), city};
 * we map ISO codes to full state names and return city/state ONLY — never
 * coordinates, never the raw IP (the IP is read, used, and dropped; nothing
 * here persists it). India-focused: non-IN countries resolve to null, as do
 * private/LAN/loopback addresses and IPs without a known state.
 */
import { lookup } from "geoip-lite";
import { stateFromIsoCode } from "@/lib/region/states";

export type RegionLookup = { state: string; city: string | null };

/** RFC1918 + loopback + link-local + CGNAT + unspecified — never geo-resolvable. */
export function isPrivateIp(ip: string): boolean {
  const v4 = ip.startsWith("::ffff:") ? ip.slice("::ffff:".length) : ip;

  if (/^(10\.|127\.|192\.168\.|169\.254\.|0\.)/.test(v4)) return true;
  // 172.16.0.0/12
  const m172 = v4.match(/^172\.(\d{1,3})\./);
  if (m172 && Number(m172[1]) >= 16 && Number(m172[1]) <= 31) return true;
  // 100.64.0.0/10 (carrier-grade NAT)
  const m100 = v4.match(/^100\.(\d{1,3})\./);
  if (m100 && Number(m100[1]) >= 64 && Number(m100[1]) <= 127) return true;

  // IPv6: loopback, link-local, unique-local, unspecified
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
    return true;
  }
  return false;
}

/**
 * Resolve an IP to {state, city} at city/state granularity, or null when the
 * IP is private, non-Indian, or unresolvable to a known state/UT.
 */
export function lookupRegion(ip: string | null | undefined): RegionLookup | null {
  if (!ip) return null;
  const trimmed = ip.trim();
  if (!trimmed || isPrivateIp(trimmed)) return null;

  const hit = lookup(trimmed);
  if (!hit || hit.country !== "IN") return null;

  const state = stateFromIsoCode(hit.region);
  if (!state) return null;

  return { state, city: hit.city ? hit.city : null };
}
