/**
 * feat-discovery + feat-homepage-curation — AC351/352/353/354/355/356.
 * Runs against a real seeded sqlite db (no mocks).
 */
import { rmSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_FILE = "./data/unit-discovery.db";
process.env.DEVICE_HASH_SALT = "test-salt";
rmSync("./data/unit-discovery.db", { force: true });
rmSync("./data/unit-discovery.db-wal", { force: true });

const { rawDb } = await import("@/lib/db/client");
const { seed } = await import("@/scripts/seed");
const {
  applyDiversity,
  composeHomepage,
  getEditorialPicks,
  getRelated,
  getTrending,
  searchQuestions,
} = await import("@/lib/discovery/queries");
const { categoryToSlug, slugToCategory } = await import("@/lib/discovery/categories");

beforeAll(() => {
  seed();
});

describe("AC351/353 — reachability + related", () => {
  it("every active question yields >=1 related, never itself", () => {
    const sample = rawDb
      .prepare("SELECT id FROM questions WHERE status='active' ORDER BY RANDOM() LIMIT 10")
      .all() as { id: string }[];
    for (const { id } of sample) {
      const related = getRelated(id);
      expect(related.length).toBeGreaterThanOrEqual(1);
      expect(related.map((r) => r.id)).not.toContain(id);
    }
  });

  it("category slugs round-trip", () => {
    expect(slugToCategory(categoryToSlug("Fun and Internet Chaos"))).toBe(
      "Fun and Internet Chaos"
    );
    expect(slugToCategory("nonsense")).toBeNull();
  });
});

describe("AC352 — search scope", () => {
  it("finds questions by a word from their text, categories by name", () => {
    const q = rawDb
      .prepare("SELECT id, text FROM questions WHERE status='active' LIMIT 1")
      .get() as { id: string; text: string };
    const word = q.text.split(" ").find((w) => w.length > 4)?.replace(/[^a-zA-Z]/g, "");
    if (word) {
      const res = searchQuestions(word);
      expect(res.questions.length).toBeGreaterThanOrEqual(1);
    }
    expect(searchQuestions("chaos").categories).toContain("Fun and Internet Chaos");
  });
});

describe("NEW-01 regression — trending sorts numerically", () => {
  it("a 12.4K-count question beats a 214-count question", () => {
    const ids = (rawDb
      .prepare("SELECT id FROM questions WHERE status='active' LIMIT 2")
      .all() as { id: string }[]).map((r) => r.id);
    const upsert = rawDb.prepare(
      `INSERT INTO question_aggregates (question_id, dim, dim_key, agg_json, sample_n)
       VALUES (?, 'overall', '', '{}', ?)
       ON CONFLICT(question_id, dim, dim_key) DO UPDATE SET sample_n = excluded.sample_n`
    );
    upsert.run(ids[0], 214);
    upsert.run(ids[1], 12400);
    const trending = getTrending(5);
    const pos0 = trending.findIndex((c) => c.id === ids[0]);
    const pos1 = trending.findIndex((c) => c.id === ids[1]);
    expect(pos1).toBeGreaterThanOrEqual(0);
    expect(pos1).toBeLessThan(pos0 === -1 ? Infinity : pos0);
    expect(trending[0].sample_n).toBe(12400);
  });
});

describe("AC354/355 — homepage composition + diversity", () => {
  it("composes all four modules with cards", () => {
    const modules = composeHomepage();
    expect(modules.map((m) => m.kind)).toEqual(["editorial", "trending", "recent", "explore"]);
    for (const m of modules) expect(m.cards.length).toBeGreaterThan(0);
  });

  it("no category occupies 3+ consecutive slots after the diversity pass", () => {
    const mk = (id: string, category: string) =>
      ({ id, category, text: id, mode: "quick_pick", primary_dv: "split", geo: false, status: "active", sample_n: 0 });
    const modules = applyDiversity([
      { kind: "editorial" as const, cards: [mk("a", "X"), mk("b", "X"), mk("c", "X"), mk("d", "Y")] },
      { kind: "trending" as const, cards: [mk("e", "X"), mk("f", "Y"), mk("g", "X")] },
    ]);
    const flat = modules.flatMap((m) => m.cards.map((c) => c.category));
    for (let i = 2; i < flat.length; i++) {
      expect(flat[i] === flat[i - 1] && flat[i] === flat[i - 2]).toBe(false);
    }
  });
});

describe("AC356 — editorial picks contract", () => {
  it("reads app_meta editorial_picks in curator order; falls back when empty", () => {
    const ids = (rawDb
      .prepare("SELECT id FROM questions WHERE status='active' LIMIT 3")
      .all() as { id: string }[]).map((r) => r.id);
    rawDb
      .prepare(
        "INSERT INTO app_meta (key, value) VALUES ('editorial_picks', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      )
      .run(JSON.stringify([ids[2], ids[0]]));
    const picks = getEditorialPicks();
    expect(picks.map((p) => p.id).slice(0, 2)).toEqual([ids[2], ids[0]]);

    rawDb.prepare("DELETE FROM app_meta WHERE key = 'editorial_picks'").run();
    expect(getEditorialPicks(5).length).toBeGreaterThan(0); // fallback fills
  });
});
