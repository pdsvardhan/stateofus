/**
 * Admin helpers — feat-admin-console. Pure functions, unit-testable.
 */
import { timingSafeEqual } from "node:crypto";
import { rawDb } from "@/lib/db/client";

/** Constant-time token compare (AC364 — no timing side channel). */
export function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    // still do a comparison of equal-length buffers to keep timing flat
    timingSafeEqual(Buffer.alloc(b.length), b);
    return false;
  }
  return timingSafeEqual(a, b);
}

/** AC363 "feature" — toggle a question id in the editorial_picks app_meta key. */
export function toggleEditorialPick(questionId: string): { featured: boolean; picks: string[] } {
  const row = rawDb
    .prepare("SELECT value FROM app_meta WHERE key = 'editorial_picks'")
    .get() as { value: string } | undefined;
  let picks: string[] = [];
  if (row) {
    try {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed)) picks = parsed.filter((v) => typeof v === "string");
    } catch {
      picks = [];
    }
  }
  const featured = !picks.includes(questionId);
  picks = featured ? [...picks, questionId] : picks.filter((id) => id !== questionId);
  rawDb
    .prepare(
      "INSERT INTO app_meta (key, value) VALUES ('editorial_picks', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(JSON.stringify(picks));
  return { featured, picks };
}

export type ExportRow = Record<string, unknown>;

export function exportCatalogue(): ExportRow[] {
  return rawDb.prepare("SELECT * FROM questions ORDER BY id").all() as ExportRow[];
}

/** Flatten one export row to CSV-safe strings (arrays joined with |). */
export function toCsvValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      s = parsed.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join("|");
    }
  } catch {
    // plain scalar
  }
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => toCsvValue(r[h])).join(","));
  }
  return lines.join("\n");
}
