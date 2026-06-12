/**
 * Rate limiting + burst rejection — feat-vote-dedup.
 *
 * Sliding in-memory windows per device and per (hashed) IP. Single-container
 * deployment makes in-process state the honest choice — documented limitation:
 * limits reset on container restart. Rejections persist to rate_events so
 * abuse review has a trail (AC 381).
 *
 * Limits (MVP):
 *  - device: 30 answers / 60s, burst gate 10 / 10s
 *  - ip:     90 answers / 60s, burst gate 25 / 10s  (carrier NAT headroom)
 */
import { createHash } from "node:crypto";
import { rawDb } from "@/lib/db/client";

type WindowState = { stamps: number[] };

const windows = new Map<string, WindowState>();

const LIMITS = {
  device: { perMinute: 30, burstCount: 10, burstWindowMs: 10_000 },
  ip: { perMinute: 90, burstCount: 25, burstWindowMs: 10_000 },
} as const;

export function hashIp(ip: string): string {
  const salt = process.env.DEVICE_HASH_SALT ?? "";
  return createHash("sha256").update(`ip:${ip}:${salt}`).digest("hex").slice(0, 32);
}

export type RateDecision =
  | { allowed: true }
  | { allowed: false; reason: "rate-limit" | "burst-reject"; scope: "device" | "ip" };

function logEvent(scope: "device" | "ip", scopeKey: string, kind: string, detail: string) {
  rawDb
    .prepare("INSERT INTO rate_events (scope, scope_key, kind, detail) VALUES (?, ?, ?, ?)")
    .run(scope, scopeKey, kind, detail);
}

export function checkRate(opts: {
  scope: "device" | "ip";
  key: string;
  now?: number;
}): RateDecision {
  const now = opts.now ?? Date.now();
  const limits = LIMITS[opts.scope];
  const mapKey = `${opts.scope}:${opts.key}`;
  const st = windows.get(mapKey) ?? { stamps: [] };

  st.stamps = st.stamps.filter((t) => now - t < 60_000);

  const inBurstWindow = st.stamps.filter((t) => now - t < limits.burstWindowMs).length;
  if (inBurstWindow >= limits.burstCount) {
    logEvent(opts.scope, opts.key, "burst-reject", `${inBurstWindow} in ${limits.burstWindowMs}ms`);
    windows.set(mapKey, st);
    return { allowed: false, reason: "burst-reject", scope: opts.scope };
  }
  if (st.stamps.length >= limits.perMinute) {
    logEvent(opts.scope, opts.key, "rate-limit", `${st.stamps.length} in 60s`);
    windows.set(mapKey, st);
    return { allowed: false, reason: "rate-limit", scope: opts.scope };
  }

  st.stamps.push(now);
  windows.set(mapKey, st);
  return { allowed: true };
}

/** Test hook — clears all in-memory windows. */
export function _resetRateWindows(): void {
  windows.clear();
}
