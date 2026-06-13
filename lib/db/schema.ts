/**
 * Drizzle schema — feat-question-data-model (build #1).
 *
 * Rails (CODING_GUIDELINES):
 *  - Aggregates are tables, not queries: result pages read question_aggregates
 *    only; the answers table is never scanned at request time.
 *  - Answer writes are idempotent per (question_id, device_id) — UNIQUE + UPSERT.
 *  - Region at city/state granularity only (non-negotiable #7).
 *  - questions carries every meaningful catalogue column (AC 366); the five
 *    duplicate score headers in the XLSX collapse to one set of score_* ints.
 */
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ------------------------------------------------------------------ */
/* questions — the catalogue (Doc 5 source #35 + authored content)     */
/* ------------------------------------------------------------------ */
export const questions = sqliteTable(
  "questions",
  {
    id: text("id").primaryKey(), // e.g. C1-21
    category: text("category").notNull(),
    subcategory: text("subcategory"),
    title: text("title"),
    text: text("text").notNull(),
    objective: text("objective"),
    mode: text("mode").notNull(), // canonical Mode enum
    interactionDescription: text("interaction_description"),
    answerStructure: text("answer_structure"),
    optionsJson: text("options_json").notNull().default("[]"),
    // sorter buckets / tier labels / podium slots: {kind, labels[]} or null
    targetsJson: text("targets_json"),
    skipAllowed: integer("skip_allowed").notNull().default(1),
    primaryDv: text("primary_dv").notNull(), // canonical DvId
    secondaryDvsJson: text("secondary_dvs_json").notNull().default("[]"),
    dvRaw: text("dv_raw"), // original catalogue label, fidelity trail
    insightType: text("insight_type"),
    expectedResultShape: text("expected_result_shape"),
    expectedEmotion: text("expected_emotion"),
    scoreParticipation: integer("score_participation"),
    scoreInterestingness: integer("score_interestingness"),
    scoreEase: integer("score_ease"),
    scoreDiscussion: integer("score_discussion"),
    scoreShareability: integer("score_shareability"),
    experienceRequirement: text("experience_requirement"),
    biasRisk: text("bias_risk"),
    whyExists: text("why_exists"),
    whatInteresting: text("what_interesting"),
    alternativeVersions: text("alternative_versions"),
    rejectedAlternatives: text("rejected_alternatives"),
    mvpPriority: text("mvp_priority"),
    notes: text("notes"),
    geo: integer("geo").notNull().default(0), // feeds map DVs + region insights
    // AC341 — per-question reveal config: immediate | threshold | progressive
    revealPattern: text("reveal_pattern").notNull().default("threshold"),
    source: text("source").notNull(), // catalogue | authored | manual
    status: text("status").notNull().default("draft"), // LifecycleState
    approvedBy: text("approved_by"), // AC 375: review recorded pre-activation
    approvedAt: text("approved_at"),
    importWarningsJson: text("import_warnings_json").notNull().default("[]"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("idx_questions_status").on(t.status),
    index("idx_questions_category").on(t.category, t.status),
  ]
);

/* ------------------------------------------------------------------ */
/* question_options — normalized options for aggregate keys            */
/* ------------------------------------------------------------------ */
export const questionOptions = sqliteTable(
  "question_options",
  {
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    key: text("key").notNull(), // stable option key, e.g. "opt-0"
    label: text("label").notNull(),
    sublabel: text("sublabel"),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.idx] })]
);

/* ------------------------------------------------------------------ */
/* devices — anonymous identity (Doc 5 source #36; non-negotiable #7)  */
/* ------------------------------------------------------------------ */
export const devices = sqliteTable(
  "devices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    deviceHash: text("device_hash").notNull(),
    firstSeenAt: text("first_seen_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    lastSeenAt: text("last_seen_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    regionCity: text("region_city"),
    regionState: text("region_state"),
    regionSource: text("region_source"), // ip-geo | user-corrected
  },
  (t) => [uniqueIndex("uq_devices_hash").on(t.deviceHash)]
);

/* ------------------------------------------------------------------ */
/* answers — append-only, idempotent per (question, device)            */
/* ------------------------------------------------------------------ */
export const answers = sqliteTable(
  "answers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    deviceId: integer("device_id")
      .notNull()
      .references(() => devices.id),
    payloadJson: text("payload_json").notNull(), // mode-shaped, zod-validated
    regionState: text("region_state"), // denormalized at answer time
    regionCity: text("region_city"),
    answeredAt: text("answered_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    uniqueIndex("uq_answers_question_device").on(t.questionId, t.deviceId),
    index("idx_answers_question").on(t.questionId),
  ]
);

/* ------------------------------------------------------------------ */
/* question_aggregates — precomputed result data (rail: tables!)       */
/* ------------------------------------------------------------------ */
export const questionAggregates = sqliteTable(
  "question_aggregates",
  {
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    dim: text("dim").notNull().default("overall"), // overall | state | city
    dimKey: text("dim_key").notNull().default(""),
    aggJson: text("agg_json").notNull(), // mode-shaped aggregate
    sampleN: integer("sample_n").notNull().default(0),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.dim, t.dimKey] })]
);

/* ------------------------------------------------------------------ */
/* reactions — quiet thumb pair (REA1)                                 */
/* ------------------------------------------------------------------ */
export const reactions = sqliteTable(
  "reactions",
  {
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    deviceId: integer("device_id")
      .notNull()
      .references(() => devices.id),
    kind: text("kind").notNull(), // up | down
    reactedAt: text("reacted_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.deviceId] })]
);

/* ------------------------------------------------------------------ */
/* lifecycle_events — governance trail (feat-question-lifecycle)       */
/* ------------------------------------------------------------------ */
export const lifecycleEvents = sqliteTable(
  "lifecycle_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    fromStatus: text("from_status").notNull(),
    toStatus: text("to_status").notNull(),
    actor: text("actor").notNull(), // admin | system | import
    reason: text("reason"),
    at: text("at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("idx_lifecycle_question").on(t.questionId)]
);

/* ------------------------------------------------------------------ */
/* rate_events — burst rejections + rate-limit hits (feat-vote-dedup)  */
/* ------------------------------------------------------------------ */
export const rateEvents = sqliteTable(
  "rate_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    scope: text("scope").notNull(), // ip | device
    scopeKey: text("scope_key").notNull(), // hashed ip / device hash
    kind: text("kind").notNull(), // burst-reject | rate-limit
    detail: text("detail"),
    at: text("at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("idx_rate_events_scope").on(t.scopeKey, t.at)]
);

/* ------------------------------------------------------------------ */
/* app_meta — schema/seed bookkeeping                                  */
/* ------------------------------------------------------------------ */
export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
