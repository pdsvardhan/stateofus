/**
 * Interaction registry — feat-interaction-modes.
 *
 * One component per product mode (8). bucket_sort + tier_placement share the
 * sorter component (v5 'sort' token) parameterized by question.targets.
 *
 * Contract rails (locked):
 *  - Skip never calls onSubmit — the page's Skip chip routes onward and
 *    records nothing.
 *  - Early submit (LAB-002): sorter/swipe/podium submit partial payloads;
 *    untouched items are per-item skips. Rank's starting order is valid.
 *  - Every mode works tap-only at 375px (no drag required).
 */
import type { ComponentType } from "react";
import type { Mode } from "@/lib/catalogue/enums";
import type { QuestionPublic } from "@/lib/types";

export type InteractionProps = {
  question: QuestionPublic;
  /** POSTs to /api/answers; resolves when the result is ready to reveal */
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
};

export type InteractionDefinition = {
  mode: Mode;
  /** v5 mode-label chip text (M2 lime index tab), e.g. "QUICK PICK" */
  chipLabel: string;
  Component: ComponentType<InteractionProps>;
};

export type InteractionRegistry = Record<Mode, InteractionDefinition>;
