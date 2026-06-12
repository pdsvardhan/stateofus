/**
 * Anonymous device identity — feat-anonymous-participation.
 *
 * No accounts, ever (product rail). A random 128-bit id lives in an httpOnly
 * cookie; the server persists only SHA-256(id + DEVICE_HASH_SALT). The raw id
 * never touches the database; the hash never touches the browser. Region is
 * attached later (feat-region-capture) at city/state granularity only.
 */
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { rawDb } from "@/lib/db/client";

export const DEVICE_COOKIE = "sou_device";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // 400 days, the Chrome cap

export function hashDeviceId(rawId: string): string {
  const salt = process.env.DEVICE_HASH_SALT;
  if (!salt) {
    // Refuse to mint unsalted identities — fail loudly, never silently degrade.
    throw new Error("DEVICE_HASH_SALT is not configured");
  }
  return createHash("sha256").update(`${rawId}:${salt}`).digest("hex");
}

export type DeviceRow = {
  id: number;
  device_hash: string;
  region_city: string | null;
  region_state: string | null;
  region_source: string | null;
};

/**
 * Resolve the device for this request, creating cookie + row on first visit.
 * Cookie writes require a Server Action or Route Handler context.
 */
export async function getOrCreateDevice(): Promise<DeviceRow> {
  const jar = await cookies();
  let rawId = jar.get(DEVICE_COOKIE)?.value;

  if (!rawId || !/^[a-f0-9]{32}$/.test(rawId)) {
    rawId = randomBytes(16).toString("hex");
    jar.set(DEVICE_COOKIE, rawId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }

  const hash = hashDeviceId(rawId);
  const existing = rawDb
    .prepare(
      "SELECT id, device_hash, region_city, region_state, region_source FROM devices WHERE device_hash = ?"
    )
    .get(hash) as DeviceRow | undefined;

  if (existing) {
    rawDb
      .prepare("UPDATE devices SET last_seen_at = datetime('now') WHERE id = ?")
      .run(existing.id);
    return existing;
  }

  const info = rawDb
    .prepare("INSERT INTO devices (device_hash) VALUES (?)")
    .run(hash);
  return {
    id: Number(info.lastInsertRowid),
    device_hash: hash,
    region_city: null,
    region_state: null,
    region_source: null,
  };
}

/** Read-only variant: returns null instead of minting (for GET paths). */
export async function getDevice(): Promise<DeviceRow | null> {
  const jar = await cookies();
  const rawId = jar.get(DEVICE_COOKIE)?.value;
  if (!rawId || !/^[a-f0-9]{32}$/.test(rawId)) return null;
  const hash = hashDeviceId(rawId);
  return (
    (rawDb
      .prepare(
        "SELECT id, device_hash, region_city, region_state, region_source FROM devices WHERE device_hash = ?"
      )
      .get(hash) as DeviceRow | undefined) ?? null
  );
}
