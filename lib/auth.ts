/**
 * Admin gate helpers (CODING_GUIDELINES non-negotiable #8).
 *
 * Two layers protect /admin and /api/admin:
 *  1. Authentik forward-auth at the NPM proxy (adr-006 §3) — deploy-time.
 *  2. This app-level token gate — defense in depth, also covers LAN access
 *     that bypasses the proxy.
 *
 * The cookie value is SHA-256(ADMIN_TOKEN); the raw token never persists in
 * the browser. If ADMIN_TOKEN is unset the admin surface is disabled (503),
 * never silently open.
 */

export const ADMIN_COOKIE = "sou_admin";

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedAdminCookie(): Promise<string | null> {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return null;
  return sha256Hex(token);
}

export async function isAdminCookieValid(
  cookieValue: string | undefined
): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await expectedAdminCookie();
  return expected !== null && cookieValue === expected;
}
