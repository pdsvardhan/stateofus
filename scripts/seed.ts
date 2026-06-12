/**
 * Launch seed — feat-seed-content-pipeline.
 *
 * 1. Import the 116-row catalogue (25 content-ready)         — AC 372
 * 2. Import the 80 authored questions                        — (DOC-3 checked at authoring)
 * 3. Activate 25 content-ready + 80 authored with approval
 *    recorded: owner sign-off 2026-06-12, adr-006 §4         — AC 375
 * 4. Verify ≥100 active across all 6 categories + 5 modes    — AC 373
 *
 * Idempotent: re-running re-imports content (no duplicates) and skips
 * questions already active.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { rawDb } from "../lib/db/client";
import { CATEGORIES } from "../lib/catalogue/enums";
import { isContentReady } from "../lib/catalogue/normalize";
import { transitionQuestion } from "../lib/lifecycle";
import { importCatalogue } from "./import-catalogue";
import { importAuthored } from "./import-authored";

const APPROVAL = {
  approvedBy: "vardhan",
  reason: "owner sign-off 2026-06-12 (adr-006 §4): all 105 launch questions approved active",
};

export type SeedReport = {
  catalogue: ReturnType<typeof importCatalogue>;
  authored: ReturnType<typeof importAuthored>;
  activated: number;
  alreadyActive: number;
  activationFailures: { id: string; error: string }[];
  totals: {
    active: number;
    perCategory: Record<string, number>;
    perMode: Record<string, number>;
  };
  launchGate: { pass: boolean; reasons: string[] };
};

export function seed(): SeedReport {
  const catalogue = importCatalogue();
  const authored = importAuthored();

  // content-ready catalogue ids
  const catalogueRows = JSON.parse(
    readFileSync(join(process.cwd(), "inputs", "catalogue-full.json"), "utf8")
  ) as Record<string, unknown>[];
  const readyIds = catalogueRows
    .filter(isContentReady)
    .map((r) => String(r["Question ID"]));

  const toActivate = [...readyIds, ...authored.ids];
  let activated = 0;
  let alreadyActive = 0;
  const activationFailures: { id: string; error: string }[] = [];

  for (const id of toActivate) {
    const current = rawDb
      .prepare("SELECT status FROM questions WHERE id = ?")
      .get(id) as { status: string } | undefined;
    if (!current) {
      activationFailures.push({ id, error: "not found after import" });
      continue;
    }
    if (current.status === "active") {
      alreadyActive += 1;
      continue;
    }
    if (current.status !== "draft") {
      activationFailures.push({ id, error: `in state ${current.status}, not draft` });
      continue;
    }
    const res = transitionQuestion({
      questionId: id,
      to: "active",
      actor: "system",
      reason: APPROVAL.reason,
      approvedBy: APPROVAL.approvedBy,
    });
    if (res.ok) activated += 1;
    else activationFailures.push({ id, error: res.error });
  }

  const active = (
    rawDb.prepare("SELECT COUNT(*) AS n FROM questions WHERE status = 'active'").get() as {
      n: number;
    }
  ).n;
  const perCategory = Object.fromEntries(
    (
      rawDb
        .prepare(
          "SELECT category, COUNT(*) AS n FROM questions WHERE status='active' GROUP BY category"
        )
        .all() as { category: string; n: number }[]
    ).map((r) => [r.category, r.n])
  );
  const perMode = Object.fromEntries(
    (
      rawDb
        .prepare(
          "SELECT mode, COUNT(*) AS n FROM questions WHERE status='active' GROUP BY mode"
        )
        .all() as { mode: string; n: number }[]
    ).map((r) => [r.mode, r.n])
  );

  // AC 373 launch gate: ≥100 active, all 6 categories, all 5 core modes
  const reasons: string[] = [];
  if (active < 100) reasons.push(`only ${active} active questions (<100)`);
  for (const c of CATEGORIES) {
    if (!perCategory[c]) reasons.push(`category "${c}" has no active questions`);
  }
  const coreModes = ["quick_pick", "tradeoff_cards", "swipe_stack", "bucket_sort", "tier_placement"];
  for (const m of coreModes) {
    if (!perMode[m]) reasons.push(`mode "${m}" has no active questions`);
  }

  return {
    catalogue,
    authored,
    activated,
    alreadyActive,
    activationFailures,
    totals: { active, perCategory, perMode },
    launchGate: { pass: reasons.length === 0, reasons },
  };
}

if (process.argv[1]?.endsWith("seed.ts")) {
  const report = seed();
  console.log(
    JSON.stringify(
      {
        catalogue: { ...report.catalogue, rejected: report.catalogue.rejected.length, warnings: report.catalogue.warnings.length },
        authored: { ...report.authored, ids: report.authored.ids.length, rejected: report.authored.rejected, warnings: report.authored.warnings.length },
        activated: report.activated,
        alreadyActive: report.alreadyActive,
        activationFailures: report.activationFailures,
        totals: report.totals,
        launchGate: report.launchGate,
      },
      null,
      2
    )
  );
  if (!report.launchGate.pass || report.activationFailures.length > 0) process.exit(1);
}
