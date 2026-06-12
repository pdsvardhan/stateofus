/**
 * feat-anonymous-participation + feat-vote-dedup + feat-question-lifecycle —
 * acceptance criteria unit tests over the real write path (no mocks on db).
 *
 *  AC 371/379: one answer per (question, device) — UPSERT, never duplicate
 *  AC 380:     per-device + per-IP rate limits
 *  AC 381:     burst patterns rejected AND logged to rate_events
 *  AC 360:     lifecycle transition map enforced server-side
 *  AC 361:     frozen rejects answers, results stay available
 *  AC 375:     draft → active requires recorded approval
 */
import { rmSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_FILE = "./data/unit-answer-flow.db";
process.env.DEVICE_HASH_SALT = "test-salt";
rmSync("./data/unit-answer-flow.db", { force: true });
rmSync("./data/unit-answer-flow.db-wal", { force: true });

const { rawDb } = await import("@/lib/db/client");
const { updateAggregate } = await import("@/lib/aggregates");
const { checkRate, _resetRateWindows } = await import("@/lib/rate-limit");
const { transitionQuestion, isAnswerable, showsResults, ALLOWED_TRANSITIONS } =
  await import("@/lib/lifecycle");
const { validatePayload } = await import("@/lib/interactions/payloads");

function insertQuestion(id: string, mode: string, status = "active") {
  rawDb
    .prepare(
      `INSERT INTO questions (id, category, text, mode, options_json, primary_dv, source, status)
       VALUES (?, 'Fun and Internet Chaos', 'test?', ?, ?, 'split', 'manual', ?)`
    )
    .run(
      id,
      mode,
      JSON.stringify([
        { key: "opt-0", label: "A" },
        { key: "opt-1", label: "B" },
        { key: "opt-2", label: "C" },
      ]),
      status
    );
}

function insertDevice(hash: string): number {
  const info = rawDb.prepare("INSERT INTO devices (device_hash) VALUES (?)").run(hash);
  return Number(info.lastInsertRowid);
}

function upsertAnswer(questionId: string, deviceId: number, payload: object) {
  const previous = rawDb
    .prepare("SELECT payload_json FROM answers WHERE question_id = ? AND device_id = ?")
    .get(questionId, deviceId) as { payload_json: string } | undefined;
  rawDb
    .prepare(
      `INSERT INTO answers (question_id, device_id, payload_json)
       VALUES (?, ?, ?)
       ON CONFLICT(question_id, device_id)
       DO UPDATE SET payload_json = excluded.payload_json, answered_at = datetime('now')`
    )
    .run(questionId, deviceId, JSON.stringify(payload));
  updateAggregate({
    questionId,
    mode: "quick_pick",
    dim: "overall",
    dimKey: "",
    payload: payload as Record<string, unknown>,
    previousPayload: previous ? JSON.parse(previous.payload_json) : null,
  });
}

describe("AC 371/379 — dedup: update, never duplicate", () => {
  it("second answer from same device updates the row and keeps sample_n at 1", () => {
    insertQuestion("CT-01", "quick_pick");
    const dev = insertDevice("hash-dedup");
    upsertAnswer("CT-01", dev, { pick: "opt-0" });
    upsertAnswer("CT-01", dev, { pick: "opt-1" });

    const n = (
      rawDb
        .prepare("SELECT COUNT(*) AS n FROM answers WHERE question_id = 'CT-01'")
        .get() as { n: number }
    ).n;
    expect(n).toBe(1);

    const agg = rawDb
      .prepare(
        "SELECT agg_json, sample_n FROM question_aggregates WHERE question_id = 'CT-01' AND dim='overall'"
      )
      .get() as { agg_json: string; sample_n: number };
    expect(agg.sample_n).toBe(1);
    const counts = JSON.parse(agg.agg_json).counts;
    expect(counts["opt-1"]).toBe(1);
    expect(counts["opt-0"]).toBeUndefined(); // previous contribution reversed
  });
});

describe("AC 380/381 — rate limits + burst rejection with trail", () => {
  it("burst gate rejects the 11th answer in 10s and logs rate_events", () => {
    _resetRateWindows();
    const now = Date.now();
    let rejected = 0;
    for (let i = 0; i < 12; i++) {
      const d = checkRate({ scope: "device", key: "burst-device", now: now + i * 100 });
      if (!d.allowed) {
        rejected += 1;
        expect(d.reason).toBe("burst-reject");
      }
    }
    expect(rejected).toBeGreaterThan(0);
    const logged = (
      rawDb
        .prepare(
          "SELECT COUNT(*) AS n FROM rate_events WHERE scope_key = 'burst-device' AND kind = 'burst-reject'"
        )
        .get() as { n: number }
    ).n;
    expect(logged).toBe(rejected);
  });

  it("per-minute cap holds even with slow spacing", () => {
    _resetRateWindows();
    const now = Date.now();
    let rejected = 0;
    // 35 answers spaced 1.5s apart → under burst gate, over the 30/min cap
    for (let i = 0; i < 35; i++) {
      const d = checkRate({ scope: "device", key: "steady-device", now: now + i * 1500 });
      if (!d.allowed && d.reason === "rate-limit") rejected += 1;
    }
    expect(rejected).toBeGreaterThan(0);
  });
});

describe("AC 360 — lifecycle transition map", () => {
  it("archived is terminal", () => {
    expect(ALLOWED_TRANSITIONS.archived).toHaveLength(0);
  });

  it("forbidden transition is rejected with the map's reasoning", () => {
    insertQuestion("CT-02", "quick_pick", "frozen");
    const res = transitionQuestion({ questionId: "CT-02", to: "active", actor: "admin" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("forbidden-transition");
  });

  it("allowed transition writes a lifecycle_events row", () => {
    insertQuestion("CT-03", "quick_pick", "active");
    const res = transitionQuestion({
      questionId: "CT-03",
      to: "frozen",
      actor: "admin",
      reason: "test freeze",
    });
    expect(res.ok).toBe(true);
    const ev = rawDb
      .prepare(
        "SELECT from_status, to_status FROM lifecycle_events WHERE question_id = 'CT-03' ORDER BY id DESC LIMIT 1"
      )
      .get() as { from_status: string; to_status: string };
    expect(ev).toEqual({ from_status: "active", to_status: "frozen" });
  });
});

describe("AC 361 — frozen shows results, rejects answers", () => {
  it("isAnswerable false + showsResults true for frozen", () => {
    expect(isAnswerable("frozen")).toBe(false);
    expect(showsResults("frozen")).toBe(true);
  });
});

describe("AC 375 — activation requires recorded approval", () => {
  it("draft → active without approver fails with approval-required", () => {
    insertQuestion("CT-04", "quick_pick", "draft");
    const res = transitionQuestion({ questionId: "CT-04", to: "active", actor: "admin" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("approval-required");
  });

  it("draft → active with approver records approved_by + approved_at", () => {
    insertQuestion("CT-05", "quick_pick", "draft");
    const res = transitionQuestion({
      questionId: "CT-05",
      to: "active",
      actor: "system",
      approvedBy: "vardhan",
    });
    expect(res.ok).toBe(true);
    const q = rawDb
      .prepare("SELECT status, approved_by, approved_at FROM questions WHERE id = 'CT-05'")
      .get() as { status: string; approved_by: string; approved_at: string };
    expect(q.status).toBe("active");
    expect(q.approved_by).toBe("vardhan");
    expect(q.approved_at).toBeTruthy();
  });
});

describe("payload validation — unknown option keys rejected", () => {
  it("rejects picks outside the question's options", () => {
    const res = validatePayload("quick_pick", { pick: "opt-99" }, ["opt-0", "opt-1"]);
    expect(res.ok).toBe(false);
  });
  it("accepts partial sorter placements (LAB-002 early submit)", () => {
    const res = validatePayload(
      "bucket_sort",
      { placements: { "opt-0": "Keep" } },
      ["opt-0", "opt-1", "opt-2"]
    );
    expect(res.ok).toBe(true);
  });
});
