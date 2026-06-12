/**
 * Catalogue row normalization — feat-question-data-model.
 *
 * Two import sources, one canonical question shape:
 *  1. inputs/catalogue-full.json — 34-column XLSX export (116 rows)
 *  2. staging/content/authored-questions-v1.yaml — 80 authored questions
 *
 * AC 368: every question validates mode + DV ids against the approved enums.
 * Unknown mode → row rejected. Killed/non-DV labels remap with a warning
 * (never silently) — warnings persist on the row in import_warnings_json.
 */
import { z } from "zod";
import {
  CATEGORIES,
  DV_BY_LABEL,
  DV_IDS,
  LIFECYCLE_STATES,
  MODE_BY_LABEL,
  MODES,
  type DvId,
} from "./enums";

export const questionInsertSchema = z.object({
  // three id families in the merged catalogue: C1-21 (sheet), Q-203 (Gemini
  // import), NEW-7 (added rows); authored YAML continues the C ranges
  id: z.string().regex(/^(C[1-6]-\d{1,3}|Q-\d{3}|NEW-\d{1,3})$/, "question id like C1-21 / Q-203 / NEW-7"),
  category: z.enum(CATEGORIES),
  subcategory: z.string().nullable(),
  title: z.string().nullable(),
  text: z.string().min(1).max(200),
  objective: z.string().nullable(),
  mode: z.enum(MODES),
  interactionDescription: z.string().nullable(),
  answerStructure: z.string().nullable(),
  options: z.array(
    z.object({
      key: z.string(),
      label: z.string().min(1),
      sublabel: z.string().optional(),
    })
  ),
  skipAllowed: z.literal(1), // skip is ALWAYS allowed — product rail
  primaryDv: z.enum(DV_IDS),
  secondaryDvs: z.array(z.enum(DV_IDS)).max(2),
  dvRaw: z.string().nullable(),
  insightType: z.string().nullable(),
  expectedResultShape: z.string().nullable(),
  expectedEmotion: z.string().nullable(),
  scoreParticipation: z.number().int().min(1).max(10).nullable(),
  scoreInterestingness: z.number().int().min(1).max(10).nullable(),
  scoreEase: z.number().int().min(1).max(10).nullable(),
  scoreDiscussion: z.number().int().min(1).max(10).nullable(),
  scoreShareability: z.number().int().min(1).max(10).nullable(),
  experienceRequirement: z.string().nullable(),
  biasRisk: z.string().nullable(),
  whyExists: z.string().nullable(),
  whatInteresting: z.string().nullable(),
  alternativeVersions: z.string().nullable(),
  rejectedAlternatives: z.string().nullable(),
  mvpPriority: z.string().nullable(),
  notes: z.string().nullable(),
  geo: z.union([z.literal(0), z.literal(1)]),
  source: z.enum(["catalogue", "authored", "manual"]),
  status: z.enum(LIFECYCLE_STATES),
  importWarnings: z.array(z.string()),
});
export type QuestionInsert = z.infer<typeof questionInsertSchema>;

const PLACEHOLDER_OPTIONS = new Set(["A|B|C|D", "None", ""]);

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" || s === "None" ? null : s;
}

/**
 * Category labels arrive in two families: plain enum names and prefixed
 * variants like "C2 Daily Life & Livability" / "C6 Fun / Internet Chaos".
 * Canonicalize by stripping the C-prefix and folding &, / and commas.
 */
export function normalizeCategory(raw: string | null): string | null {
  if (!raw) return null;
  const folded = raw
    .replace(/^C[1-6]\s+/, "")
    .replace(/[&/]/g, "and")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  for (const c of CATEGORIES) {
    if (c.toLowerCase() === folded) return c;
  }
  return null;
}

export type ParsedTargets = { kind: "buckets" | "tiers"; labels: string[] } | null;

/**
 * Catalogue option syntaxes (all observed in the merged XLSX):
 *   "A | B | C"                                  plain pipes (pick modes)
 *   "Items: a, b, c | Buckets: X, Y, Z"          bucket sort
 *   "Items: a, b, c | Tiers: X, Y, Z"            tier placement
 *   "Cards: a, b, c"                             swipe stack
 */
export function parseCatalogueOptions(raw: string | null): {
  options: QuestionInsert["options"];
  targets: ParsedTargets;
} {
  if (!raw || PLACEHOLDER_OPTIONS.has(raw)) return { options: [], targets: null };

  const itemsMatch = raw.match(/^Items:\s*(.+?)\s*\|\s*(Buckets|Tiers):\s*(.+)$/i);
  if (itemsMatch) {
    const items = itemsMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
    const labels = itemsMatch[3].split(",").map((s) => s.trim()).filter(Boolean);
    return {
      options: items.map((label, i) => ({ key: `opt-${i}`, label })),
      targets: {
        kind: itemsMatch[2].toLowerCase() === "buckets" ? "buckets" : "tiers",
        labels,
      },
    };
  }

  const cardsMatch = raw.match(/^Cards:\s*(.+)$/i);
  if (cardsMatch) {
    const cards = cardsMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
    return {
      options: cards.map((label, i) => ({ key: `opt-${i}`, label })),
      targets: null,
    };
  }

  const bareItemsMatch = raw.match(/^Items:\s*(.+)$/i);
  if (bareItemsMatch) {
    const items = bareItemsMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
    return {
      options: items.map((label, i) => ({ key: `opt-${i}`, label })),
      targets: null,
    };
  }

  return { options: parseOptions(raw), targets: null };
}

function num(v: unknown): number | null {
  const s = str(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function parseOptions(raw: string | null): QuestionInsert["options"] {
  if (!raw || PLACEHOLDER_OPTIONS.has(raw)) return [];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((label, i) => ({ key: `opt-${i}`, label }));
}

function mapDv(
  label: string | null,
  warnings: string[]
): { dv: DvId | null } {
  if (!label) return { dv: null };
  if (label in DV_BY_LABEL) {
    const dv = DV_BY_LABEL[label];
    if (dv === null) {
      warnings.push(`dv label "${label}" is the personal layer, not a DV`);
      return { dv: null };
    }
    if (label === "P2 Circle Packing") {
      warnings.push(`dv "P2 Circle Packing" was killed in design — remapped to treemap`);
    }
    return { dv };
  }
  warnings.push(`unknown dv label "${label}"`);
  return { dv: null };
}

/** Geo heuristic for catalogue rows (authored YAML carries an explicit flag). */
function inferGeo(primaryDvLabel: string | null, secondaryDvLabel: string | null): 0 | 1 {
  const geoDvs = ["G1 Heat Map", "G2 Bubble Map"];
  return geoDvs.includes(primaryDvLabel ?? "") || geoDvs.includes(secondaryDvLabel ?? "")
    ? 1
    : 0;
}

export type CatalogueNormalizeResult =
  | { ok: true; question: QuestionInsert; targets: ParsedTargets }
  | { ok: false; id: string | null; errors: string[] };

/** Normalize one row of inputs/catalogue-full.json (34-column XLSX export). */
export function normalizeCatalogueRow(row: Record<string, unknown>): CatalogueNormalizeResult {
  const id = str(row["Question ID"]);
  const warnings: string[] = [];
  const errors: string[] = [];

  const modeLabel = str(row["Question Mode"]);
  const mode = modeLabel ? MODE_BY_LABEL[modeLabel] : undefined;
  if (!mode) errors.push(`unknown mode "${modeLabel}"`);

  const category = normalizeCategory(str(row["Category"]));
  if (!category) errors.push(`unknown category "${str(row["Category"])}"`);

  const { options, targets: parsedTargets } = parseCatalogueOptions(str(row["Exact Options"]));
  let targets = parsedTargets;
  if (mode === "bucket_sort" && !targets && options.length > 0) {
    warnings.push("bucket_sort without explicit buckets — defaulted, editorial pass recommended");
    targets = { kind: "buckets", labels: ["Keep", "Maybe", "Drop"] };
  }
  if (mode === "tier_placement" && !targets && options.length > 0) {
    warnings.push("tier_placement without explicit tiers — descriptive defaults applied");
    targets = { kind: "tiers", labels: ["Top tier", "Solid", "Meh", "Not for me"] };
  }

  const primaryLabel = str(row["Primary Result DV"]);
  const secondaryLabel = str(row["Secondary Result DV"]);
  const { dv: primaryDv } = mapDv(primaryLabel, warnings);
  const { dv: secondaryDv } = mapDv(secondaryLabel, warnings);

  // Rows whose "primary" is the insight layer get the house default split
  // cards — recorded as a warning, only ever activatable after human edit.
  const effectivePrimary: DvId = primaryDv ?? "split";
  if (!primaryDv) {
    warnings.push(`no mappable primary DV — defaulted to split (needs editorial pass before activation)`);
  }

  const candidate = {
    id: id ?? "",
    category: category as QuestionInsert["category"],
    subcategory: str(row["Subcategory"]),
    title: str(row["Question Title"]),
    text: str(row["Question Text"]) ?? "",
    objective: str(row["Objective"]),
    mode: mode as QuestionInsert["mode"],
    interactionDescription: str(row["Interaction Description"]),
    answerStructure: str(row["Answer Structure"]),
    options,
    skipAllowed: 1 as const,
    primaryDv: effectivePrimary,
    secondaryDvs: secondaryDv && secondaryDv !== effectivePrimary ? [secondaryDv] : [],
    dvRaw: [primaryLabel, secondaryLabel].filter(Boolean).join(" + ") || null,
    insightType: str(row["Personal Insight Type"]),
    expectedResultShape: str(row["Expected Result Shape"]),
    expectedEmotion: str(row["Expected User Emotion"]),
    scoreParticipation: num(row["Participation Score (1-10)"]),
    scoreInterestingness: num(row["Result Interestingness (1-10)"]),
    scoreEase: num(row["Ease (1-10)"]),
    scoreDiscussion: num(row["Discussion Potential (1-10)"]),
    scoreShareability: num(row["Shareability (1-10)"]),
    experienceRequirement: str(row["Experience Requirement"]),
    biasRisk: str(row["Bias Risk"]),
    whyExists: str(row["Why This Question Exists"]),
    whatInteresting: str(row["What Makes It Interesting"]),
    alternativeVersions: str(row["Alternative Versions"]),
    rejectedAlternatives: str(row["Rejected Alternatives"]),
    mvpPriority: str(row["MVP Priority"]),
    notes: str(row["Notes"]),
    geo: inferGeo(primaryLabel, secondaryLabel),
    source: "catalogue" as const,
    status: "draft" as const,
    importWarnings: warnings,
  };

  if (errors.length > 0) return { ok: false, id, errors };
  const parsed = questionInsertSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      id,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  return { ok: true, question: parsed.data, targets };
}

/** True when a catalogue row carries real, publishable options. */
export function isContentReady(row: Record<string, unknown>): boolean {
  const raw = str(row["Exact Options"]);
  return raw !== null && !PLACEHOLDER_OPTIONS.has(raw);
}
