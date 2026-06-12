/**
 * Drizzle schema — scaffold.
 *
 * feat-question-data-model (build #1) owns the real tables:
 *   questions, question_options, devices, answers, answer_items,
 *   question_aggregates, reactions
 * Aggregates are tables, not queries (CODING_GUIDELINES): result pages read
 * question_aggregates only; the answers table is never scanned at request time.
 *
 * app_meta exists from the scaffold onward: schema/seed bookkeeping the
 * health endpoint and seed scripts rely on.
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
