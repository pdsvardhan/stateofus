import { NextResponse } from "next/server";
import { rawDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = "error";
  try {
    const row = rawDb.prepare("SELECT 1 AS ok").get() as { ok: number };
    if (row?.ok === 1) db = "connected";
  } catch {
    db = "error";
  }
  return NextResponse.json(
    {
      status: db === "connected" ? "ok" : "degraded",
      db,
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
    },
    { status: db === "connected" ? 200 : 503 }
  );
}
