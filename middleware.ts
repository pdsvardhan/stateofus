/**
 * Admin gate middleware — protects /admin/* and /api/admin/* (non-negotiable #8).
 * /api/admin/login is the only ungated admin route (it issues the cookie).
 * ADMIN_TOKEN unset → 503 admin-disabled. Wrong/missing cookie → 401/redirect.
 */
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, expectedAdminCookie } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/api/admin/login") return NextResponse.next();

  const expected = await expectedAdminCookie();
  if (!expected) {
    return NextResponse.json(
      { error: "admin surface disabled: ADMIN_TOKEN not configured" },
      { status: 503 }
    );
  }

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (cookie === expected) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const login = req.nextUrl.clone();
  login.pathname = "/admin/login";
  login.searchParams.set("next", pathname);
  return pathname === "/admin/login"
    ? NextResponse.next()
    : NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
