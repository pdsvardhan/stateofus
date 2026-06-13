/**
 * GET /api/region — this device's current coarse region (AC376/AC378).
 *
 * City/state granularity only; the raw IP is read from the proxy header for
 * the lookup and never stored. If the device has never been regioned
 * (region_source IS NULL) this GET opportunistically resolves it via
 * ensureRegion — coarse region derives from IP on first visit without
 * prompting. No device cookie → all-null region (GET never mints identity).
 */
import { NextRequest, NextResponse } from "next/server";
import { getDevice } from "@/lib/identity";
import { ensureRegion } from "@/lib/region/resolve";

export async function GET(req: NextRequest) {
  let device;
  try {
    device = await getDevice();
  } catch {
    return NextResponse.json(
      { error: "identity unavailable (server misconfigured)" },
      { status: 503 }
    );
  }

  if (!device) {
    return NextResponse.json({ state: null, city: null, source: null });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const resolved = ensureRegion(device, ip);

  return NextResponse.json({
    state: resolved.region_state,
    city: resolved.region_city,
    source: resolved.region_source,
  });
}
