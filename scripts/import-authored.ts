/**
 * Authored-content importer — feat-seed-content-pipeline.
 *
 * Source: staging/content/authored-questions-v1.yaml (80 questions, DRAFT,
 * approved by owner 2026-06-12 per adr-006 §4 — activation happens in seed.ts
 * with that approval recorded, AC 375).
 *
 * Bucket-sort options use the inline syntax
 *   "Items: A | B | C — Buckets: X / Y / Z"
 * Tier questions without explicit tiers get descriptive defaults + a warning
 * (never S/A/B — design DECISIONS).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { DV_BY_LABEL, MODE_BY_LABEL, type DvId, type Mode } from "../lib/catalogue/enums";
import { questionInsertSchema, type QuestionInsert } from "../lib/catalogue/normalize";
import { upsertQuestion } from "./import-catalogue";

const authoredItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  mode: z.string(),
  text: z.string(),
  options: z.string(),
  primary_dv: z.string(),
  secondary_dv: z.string().optional(),
  insight_type: z.string(),
  emotion: z.string(),
  priority: z.string(),
  rationale: z.string(),
  geo: z.boolean().optional(),
  overlap_note: z.string().optional(),
});

export type AuthoredImportReport = {
  source: string;
  total: number;
  inserted: number;
  updated: number;
  rejected: { id: string | null; errors: string[] }[];
  warnings: { id: string; warnings: string[] }[];
  ids: string[];
};

const DEFAULT_TIERS = ["Top tier", "Solid", "Meh", "Not for me"];
const DEFAULT_BUCKETS = ["Keep", "Maybe", "Drop"];

export function parseAuthoredOptions(
  raw: string,
  mode: Mode,
  warnings: string[]
): { options: QuestionInsert["options"]; targets: { kind: string; labels: string[] } | null } {
  // bucket syntax: "Items: A | B | C — Buckets: X / Y / Z" (em- or hyphen-dash)
  const bucketMatch = raw.match(/^Items:\s*(.+?)\s*[—-]\s*Buckets:\s*(.+)$/);
  if (bucketMatch) {
    const items = bucketMatch[1].split("|").map((s) => s.trim()).filter(Boolean);
    const buckets = bucketMatch[2].split("/").map((s) => s.trim()).filter(Boolean);
    return {
      options: items.map((label, i) => ({ key: `opt-${i}`, label })),
      targets: { kind: "buckets", labels: buckets },
    };
  }

  const options = raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((label, i) => ({ key: `opt-${i}`, label }));

  if (mode === "bucket_sort") {
    warnings.push("bucket_sort without explicit buckets — defaulted, editorial pass recommended");
    return { options, targets: { kind: "buckets", labels: DEFAULT_BUCKETS } };
  }
  if (mode === "tier_placement") {
    warnings.push("tier_placement without explicit tiers — descriptive defaults applied");
    return { options, targets: { kind: "tiers", labels: DEFAULT_TIERS } };
  }
  return { options, targets: null };
}

export function importAuthored(yamlPath?: string): AuthoredImportReport {
  const file =
    yamlPath ?? join(process.cwd(), "staging", "content", "authored-questions-v1.yaml");
  const doc = parseYaml(readFileSync(file, "utf8")) as {
    meta: unknown;
    questions: unknown[];
  };

  const report: AuthoredImportReport = {
    source: "staging/content/authored-questions-v1.yaml",
    total: 0,
    inserted: 0,
    updated: 0,
    rejected: [],
    warnings: [],
    ids: [],
  };

  for (const rawItem of doc.questions) {
    report.total += 1;
    const item = authoredItemSchema.safeParse(rawItem);
    if (!item.success) {
      const id = (rawItem as { id?: string })?.id ?? null;
      report.rejected.push({
        id,
        errors: item.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
      continue;
    }
    const a = item.data;
    const warnings: string[] = [];

    const mode = MODE_BY_LABEL[a.mode];
    if (!mode) {
      report.rejected.push({ id: a.id, errors: [`unknown mode "${a.mode}"`] });
      continue;
    }

    const primaryDv = DV_BY_LABEL[a.primary_dv] as DvId | null | undefined;
    if (!primaryDv) {
      report.rejected.push({ id: a.id, errors: [`unmappable primary dv "${a.primary_dv}"`] });
      continue;
    }
    const secondaryDv = a.secondary_dv ? (DV_BY_LABEL[a.secondary_dv] ?? null) : null;
    if (a.secondary_dv && !secondaryDv) {
      warnings.push(`unknown secondary dv "${a.secondary_dv}" dropped`);
    }

    const { options, targets } = parseAuthoredOptions(a.options, mode, warnings);

    const candidate: QuestionInsert = {
      id: a.id,
      category: a.category as QuestionInsert["category"],
      subcategory: null,
      title: null,
      text: a.text,
      objective: null,
      mode,
      interactionDescription: null,
      answerStructure: null,
      options,
      skipAllowed: 1,
      primaryDv,
      secondaryDvs: secondaryDv && secondaryDv !== primaryDv ? [secondaryDv] : [],
      dvRaw: [a.primary_dv, a.secondary_dv].filter(Boolean).join(" + "),
      insightType: a.insight_type,
      expectedResultShape: null,
      expectedEmotion: a.emotion,
      scoreParticipation: null,
      scoreInterestingness: null,
      scoreEase: null,
      scoreDiscussion: null,
      scoreShareability: null,
      experienceRequirement: null,
      biasRisk: null,
      whyExists: a.rationale,
      whatInteresting: null,
      alternativeVersions: null,
      rejectedAlternatives: a.overlap_note ?? null,
      mvpPriority: a.priority,
      notes: null,
      geo: a.geo ? 1 : 0,
      source: "authored",
      status: "draft",
      importWarnings: warnings,
    };

    const parsed = questionInsertSchema.safeParse(candidate);
    if (!parsed.success) {
      report.rejected.push({
        id: a.id,
        errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
      continue;
    }

    const outcome = upsertQuestion(parsed.data, targets);
    report[outcome === "inserted" ? "inserted" : "updated"] += 1;
    report.ids.push(a.id);
    if (warnings.length > 0) report.warnings.push({ id: a.id, warnings });
  }

  return report;
}

if (process.argv[1]?.endsWith("import-authored.ts")) {
  const report = importAuthored();
  console.log(JSON.stringify({ ...report, ids: `${report.ids.length} ids` }, null, 2));
  if (report.rejected.length > 0) process.exit(1);
}
