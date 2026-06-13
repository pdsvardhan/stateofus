/**
 * ensureRegion — resolve-on-first-visit (AC376), feat-region-capture.
 *
 * USAGE (experience page or any route handler that already has the device):
 *
 *   import { getOrCreateDevice } from "@/lib/identity";
 *   import { ensureRegion } from "@/lib/region/resolve";
 *
 *   const device = await getOrCreateDevice();
 *   const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
 *   const withRegion = ensureRegion(device, ip);   // synchronous, idempotent
 *
 * Behaviour:
 *  - Only acts when the device has never been regioned (region_source IS NULL)
 *    — an existing 'ip-geo' or 'user-corrected' region is NEVER overwritten,
 *    so a user correction (AC377) sticks across visits.
 *  - On a successful lookup it UPDATEs the devices row (guarded by
 *    region_source IS NULL to stay race-safe against a concurrent correction)
 *    and returns the updated row.
 *  - On a failed lookup (private IP, non-IN, unknown) it returns the device
 *    unchanged with region_source still NULL, so the next visit retries.
 *  - The IP is used for the lookup and dropped — never stored (rail).
 */
import { rawDb } from "@/lib/db/client";
import type { DeviceRow } from "@/lib/identity";
import { lookupRegion } from "@/lib/region/geo";

export function ensureRegion(device: DeviceRow, ip: string): DeviceRow {
  if (device.region_source !== null) return device;

  const hit = lookupRegion(ip);
  if (!hit) return device;

  const info = rawDb
    .prepare(
      "UPDATE devices SET region_state = ?, region_city = ?, region_source = 'ip-geo' WHERE id = ? AND region_source IS NULL"
    )
    .run(hit.state, hit.city, device.id);

  if (info.changes === 0) {
    // Lost a race to a user correction — re-read and honour it.
    const fresh = rawDb
      .prepare(
        "SELECT id, device_hash, region_city, region_state, region_source FROM devices WHERE id = ?"
      )
      .get(device.id) as DeviceRow | undefined;
    return fresh ?? device;
  }

  return {
    ...device,
    region_state: hit.state,
    region_city: hit.city,
    region_source: "ip-geo",
  };
}
