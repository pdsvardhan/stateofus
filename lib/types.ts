/**
 * Shared public types — the contracts between the experience page, the
 * interaction registry, and the DV registry. These shapes mirror the API
 * responses exactly (app/api/questions/[id]/route.ts and .../result).
 */
import type { DvId, LifecycleState, Mode } from "@/lib/catalogue/enums";

export type QuestionOption = { key: string; label: string; sublabel?: string | null };

export type QuestionTargets = {
  kind: "buckets" | "tiers";
  labels: string[];
} | null;

/** GET /api/questions/:id → question */
export type QuestionPublic = {
  id: string;
  category: string;
  desk: string | null;
  subcategory: string | null;
  title: string | null;
  text: string;
  mode: Mode;
  options: QuestionOption[];
  targets: QuestionTargets;
  skip_allowed: boolean;
  primary_dv: DvId;
  secondary_dvs: DvId[];
  insight_type: string | null;
  editorial_note: string | null;
  editorial_note_2?: string | null;
  /** SwipeStack per-card verdict labels (v5 q.yes / q.no). */
  swipe_yes_label?: string | null;
  swipe_no_label?: string | null;
  geo: boolean;
  status: LifecycleState;
  created_at: string;
};

/** GET /api/questions/:id/result */
export type QuestionResult = {
  question_id: string;
  status: LifecycleState;
  still_counting: boolean;
  /** revealed under a progressive pattern below the full threshold */
  early_returns?: boolean;
  reveal_pattern?: "immediate" | "threshold" | "progressive";
  sample_n: number;
  min_reveal_n?: number;
  aggregate?: Record<string, unknown> | null;
  updated_at?: string | null;
  state_aggregates?: Record<string, { agg: unknown; sample_n: number }> | null;
  your_payload: Record<string, unknown> | null;
  your_region?: { state: string | null; city: string | null } | null;
};

/** POST /api/answers response */
export type AnswerResponse = {
  outcome: "created" | "updated";
  question_id: string;
  aggregate: Record<string, unknown>;
  sample_n: number;
  your_payload: Record<string, unknown>;
};
