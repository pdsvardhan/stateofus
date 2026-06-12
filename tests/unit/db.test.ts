import { describe, expect, it } from "vitest";

describe("db client", () => {
  it("opens the database, enables WAL + foreign keys, answers SELECT 1", async () => {
    process.env.DATABASE_FILE = "./data/unit-test.db";
    const { rawDb } = await import("@/lib/db/client");
    expect((rawDb.prepare("SELECT 1 AS ok").get() as { ok: number }).ok).toBe(1);
    expect(rawDb.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(rawDb.pragma("foreign_keys", { simple: true })).toBe(1);
  });
});
