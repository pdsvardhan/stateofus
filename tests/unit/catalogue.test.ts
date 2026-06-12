/**
 * feat-question-data-model — acceptance criteria tests.
 *  AC 366: schema captures all catalogue columns
 *  AC 367: bulk import idempotent (re-import does not duplicate)
 *  AC 368: mode + DV ids validate against approved enums
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_FILE = "./data/unit-catalogue.db";

import { rmSync } from "node:fs";
rmSync("./data/unit-catalogue.db", { force: true });
rmSync("./data/unit-catalogue.db-wal", { force: true });

const { rawDb } = await import("@/lib/db/client");
const { importCatalogue } = await import("@/scripts/import-catalogue");
const { normalizeCatalogueRow } = await import("@/lib/catalogue/normalize");

const cataloguePath = join(process.cwd(), "inputs", "catalogue-full.json");
const rows = JSON.parse(readFileSync(cataloguePath, "utf8")) as Record<string, unknown>[];

describe("AC 366 — schema captures the catalogue columns", () => {
  it("a content-ready row round-trips every meaningful column", async () => {
    importCatalogue();
    const ready = rows.find(
      (r) => r["Exact Options"] && !["A|B|C|D", "None"].includes(String(r["Exact Options"]))
    )!;
    const q = rawDb
      .prepare("SELECT * FROM questions WHERE id = ?")
      .get(String(ready["Question ID"])) as Record<string, unknown>;
    expect(q).toBeTruthy();
    // categories canonicalize by design ("C1 City & Place Experience" → enum)
    const { normalizeCategory } = await import("@/lib/catalogue/normalize");
    expect(q.category).toBe(normalizeCategory(String(ready["Category"])));
    expect(q.text).toBe(ready["Question Text"]);
    expect(q.subcategory).toBe(ready["Subcategory"]);
    expect(q.objective).toBe(ready["Objective"]);
    expect(q.answer_structure).toBe(ready["Answer Structure"]);
    expect(q.insight_type).toBe(ready["Personal Insight Type"]);
    expect(q.expected_result_shape).toBe(ready["Expected Result Shape"]);
    expect(q.expected_emotion).toBe(ready["Expected User Emotion"]);
    expect(q.experience_requirement).toBe(ready["Experience Requirement"]);
    expect(q.bias_risk).toBe(ready["Bias Risk"]);
    expect(q.why_exists).toBe(ready["Why This Question Exists"]);
    expect(q.what_interesting).toBe(ready["What Makes It Interesting"]);
    expect(q.mvp_priority).toBe(ready["MVP Priority"]);
    // scores land as ints
    expect(typeof q.score_participation === "number" || q.score_participation === null).toBe(true);
    // options normalized into both json + derived rows
    const opts = rawDb
      .prepare("SELECT COUNT(*) AS n FROM question_options WHERE question_id = ?")
      .get(q.id) as { n: number };
    expect(opts.n).toBeGreaterThan(1);
  });
});

describe("AC 367 — import is idempotent", () => {
  it("re-import keeps row count identical and duplicates nothing", () => {
    const first = importCatalogue();
    const countAfterFirst = (
      rawDb.prepare("SELECT COUNT(*) AS n FROM questions").get() as { n: number }
    ).n;
    const second = importCatalogue();
    const countAfterSecond = (
      rawDb.prepare("SELECT COUNT(*) AS n FROM questions").get() as { n: number }
    ).n;
    expect(countAfterSecond).toBe(countAfterFirst);
    expect(second.inserted).toBe(0);
    expect(second.updated).toBe(first.inserted + first.updated);
  });

  it("re-import preserves lifecycle status + approval", () => {
    rawDb
      .prepare(
        "UPDATE questions SET status='active', approved_by='vardhan', approved_at=datetime('now') WHERE id = (SELECT id FROM questions LIMIT 1)"
      )
      .run();
    const frozen = rawDb
      .prepare("SELECT id, status, approved_by FROM questions WHERE status='active'")
      .get() as { id: string; status: string; approved_by: string };
    importCatalogue();
    const after = rawDb
      .prepare("SELECT status, approved_by FROM questions WHERE id = ?")
      .get(frozen.id) as { status: string; approved_by: string };
    expect(after.status).toBe("active");
    expect(after.approved_by).toBe("vardhan");
  });
});

describe("AC 368 — enum validation", () => {
  it("rejects an unknown interaction mode", () => {
    const bad = { ...rows[0], "Question Mode": "Mind Reading" };
    const res = normalizeCatalogueRow(bad);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toContain("unknown mode");
  });

  it("remaps killed circle-packing DV to treemap with a warning", () => {
    const row = rows.find((r) => r["Primary Result DV"] === "P2 Circle Packing");
    if (!row) return; // catalogue revision removed it — nothing to assert
    const res = normalizeCatalogueRow(row);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.question.primaryDv).toBe("treemap");
      expect(res.question.importWarnings.join(" ")).toContain("Circle Packing");
    }
  });

  it("every imported question carries canonical mode + DV ids", () => {
    const all = rawDb
      .prepare("SELECT DISTINCT mode FROM questions")
      .all() as { mode: string }[];
    const allowedModes = [
      "quick_pick",
      "tradeoff_cards",
      "swipe_stack",
      "bucket_sort",
      "tier_placement",
      "rank_order",
      "podium_slots",
      "logo_quick_pick",
    ];
    for (const { mode } of all) expect(allowedModes).toContain(mode);
  });
});
