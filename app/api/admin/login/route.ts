/**
 * POST /api/admin/login — the only ungated admin route (middleware allowlists
 * it). Constant-time compare against ADMIN_TOKEN; on match sets the
 * sou_admin cookie (SHA-256 of the token — raw token never persists in the
 * browser). On miss: small delay + 401.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, expectedAdminCookie } from "@/lib/auth";
import { tokenMatches } from "@/lib/admin/helpers";

const bodySchema = z.object({ token: z.string().min(8).max(200) });

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "admin disabled" }, { status: 503 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!tokenMatches(parsed.data.token, expected)) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "wrong token" }, { status: 401 });
  }
  const cookieValue = await expectedAdminCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, cookieValue!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return res;
}
