/**
 * feat-admin-console — AC363/364 helpers.
 */
import { rmSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_FILE = "./data/unit-admin.db";
process.env.DEVICE_HASH_SALT = "test-salt";
rmSync("./data/unit-admin.db", { force: true });
rmSync("./data/unit-admin.db-wal", { force: true });

const { rawDb } = await import("@/lib/db/client");
const { tokenMatches, toggleEditorialPick, exportCatalogue, toCsv } = await import(
  "@/lib/admin/helpers"
);

beforeAll(() => {
  rawDb
    .prepare(
      `INSERT INTO questions (id, category, text, mode, options_json, primary_dv, source, status)
       VALUES ('AT-01', 'Fun and Internet Chaos', 'admin test?', 'quick_pick',
               '[{"key":"opt-0","label":"A"},{"key":"opt-1","label":"B"}]', 'split', 'manual', 'draft')`
    )
    .run();
});

describe("AC364 — token compare", () => {
  it("matches only the exact token, constant-time", () => {
    expect(tokenMatches("secret-token-12345", "secret-token-12345")).toBe(true);
    expect(tokenMatches("secret-token-12346", "secret-token-12345")).toBe(false);
    expect(tokenMatches("short", "secret-token-12345")).toBe(false);
  });
});

describe("AC363 — feature toggle (editorial_picks contract)", () => {
  it("toggles on, then off, persisting to app_meta", () => {
    const on = toggleEditorialPick("AT-01");
    expect(on.featured).toBe(true);
    expect(on.picks).toContain("AT-01");
    const off = toggleEditorialPick("AT-01");
    expect(off.featured).toBe(false);
    expect(off.picks).not.toContain("AT-01");
  });
});

describe("AC363 — export", () => {
  it("JSON export includes the full row; CSV flattens arrays with |", () => {
    const rows = exportCatalogue();
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const csv = toCsv(rows);
    expect(csv.split("\n")[0]).toContain("options_json");
    // options array flattened: object entries joined with | (quoted, "" escaping)
    expect(csv).toContain('opt-0""');
    expect(csv).toContain("}|{");
  });
});
