/**
 * Catalogue importer — feat-question-data-model (AC 367: idempotent).
 *
 * Reads inputs/catalogue-full.json (one-time 34-column XLSX export, committed),
 * normalizes + validates every row, UPSERTs by question id. Re-import never
 * duplicates and never clobbers lifecycle state or approval fields — only
 * content columns refresh. Run: npm run import:catalogue
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { db, rawDb } from "../lib/db/client";
import { appMeta, lifecycleEvents, questionOptions, questions } from "../lib/db/schema";
import {
  isContentReady,
  normalizeCatalogueRow,
  type QuestionInsert,
} from "../lib/catalogue/normalize";

export type ImportReport = {
  source: string;
  total: number;
  inserted: number;
  updated: number;
  rejected: { id: string | null; errors: string[] }[];
  warnings: { id: string; warnings: string[] }[];
  contentReady: number;
};

export function upsertQuestion(
  q: QuestionInsert,
  targets: { kind: string; labels: string[] } | null = null
): "inserted" | "updated" {
  const existing = rawDb
    .prepare("SELECT id FROM questions WHERE id = ?")
    .get(q.id) as { id: string } | undefined;

  const row = {
    id: q.id,
    targetsJson: targets ? JSON.stringify(targets) : null,
    category: q.category,
    subcategory: q.subcategory,
    title: q.title,
    text: q.text,
    objective: q.objective,
    mode: q.mode,
    interactionDescription: q.interactionDescription,
    answerStructure: q.answerStructure,
    optionsJson: JSON.stringify(q.options),
    skipAllowed: q.skipAllowed,
    primaryDv: q.primaryDv,
    secondaryDvsJson: JSON.stringify(q.secondaryDvs),
    dvRaw: q.dvRaw,
    insightType: q.insightType,
    expectedResultShape: q.expectedResultShape,
    expectedEmotion: q.expectedEmotion,
    scoreParticipation: q.scoreParticipation,
    scoreInterestingness: q.scoreInterestingness,
    scoreEase: q.scoreEase,
    scoreDiscussion: q.scoreDiscussion,
    scoreShareability: q.scoreShareability,
    experienceRequirement: q.experienceRequirement,
    biasRisk: q.biasRisk,
    whyExists: q.whyExists,
    whatInteresting: q.whatInteresting,
    alternativeVersions: q.alternativeVersions,
    rejectedAlternatives: q.rejectedAlternatives,
    mvpPriority: q.mvpPriority,
    notes: q.notes,
    geo: q.geo,
    source: q.source,
    status: q.status,
    importWarningsJson: JSON.stringify(q.importWarnings),
  };

  if (existing) {
    // Refresh content; NEVER touch status / approved_by / approved_at here —
    // lifecycle is owned by feat-question-lifecycle, approval by the seed flow.
    const contentCols: Partial<typeof row> = { ...row };
    delete contentCols.id;
    delete contentCols.status;
    db.update(questions)
      .set({ ...contentCols, updatedAt: sql`(datetime('now'))` })
      .where(sql`${questions.id} = ${q.id}`)
      .run();
  } else {
    db.insert(questions).values(row).run();
    db.insert(lifecycleEvents)
      .values({
        questionId: q.id,
        fromStatus: "none",
        toStatus: "draft",
        actor: "import",
        reason: `imported from ${q.source}`,
      })
      .run();
  }

  // Options are derived rows — replace wholesale.
  db.delete(questionOptions)
    .where(sql`${questionOptions.questionId} = ${q.id}`)
    .run();
  for (const [i, opt] of q.options.entries()) {
    db.insert(questionOptions)
      .values({
        questionId: q.id,
        idx: i,
        key: opt.key,
        label: opt.label,
        sublabel: opt.sublabel ?? null,
      })
      .run();
  }

  return existing ? "updated" : "inserted";
}

export function importCatalogue(jsonPath?: string): ImportReport {
  const file = jsonPath ?? join(process.cwd(), "inputs", "catalogue-full.json");
  const rows = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>[];

  const report: ImportReport = {
    source: "inputs/catalogue-full.json",
    total: rows.length,
    inserted: 0,
    updated: 0,
    rejected: [],
    warnings: [],
    contentReady: 0,
  };

  const runAll = rawDb.transaction(() => {
    for (const row of rows) {
      const res = normalizeCatalogueRow(row);
      if (!res.ok) {
        report.rejected.push({ id: res.id, errors: res.errors });
        continue;
      }
      const outcome = upsertQuestion(res.question, res.targets);
      report[outcome === "inserted" ? "inserted" : "updated"] += 1;
      if (res.question.importWarnings.length > 0) {
        report.warnings.push({ id: res.question.id, warnings: res.question.importWarnings });
      }
      if (isContentReady(row)) report.contentReady += 1;
    }
    db.insert(appMeta)
      .values({ key: "last_catalogue_import", value: JSON.stringify({ at: new Date().toISOString(), total: report.total, inserted: report.inserted, updated: report.updated, rejected: report.rejected.length }) })
      .onConflictDoUpdate({
        target: appMeta.key,
        set: { value: JSON.stringify({ at: new Date().toISOString(), total: report.total, inserted: report.inserted, updated: report.updated, rejected: report.rejected.length }) },
      })
      .run();
  });
  runAll();

  return report;
}

if (process.argv[1]?.endsWith("import-catalogue.ts")) {
  const report = importCatalogue();
  console.log(JSON.stringify(report, null, 2));
  if (report.rejected.length > 0) process.exit(1);
}
