/**
 * DV registry — feat-dv-engine.
 *
 * Each of the 14 v5 renderers registers here. Questions reference DV ids from
 * the catalogue enum; adding/trimming a variant never touches question data
 * (CODING_GUIDELINES architecture pattern).
 *
 * Renderer modules live in components/dv/<id>.tsx and self-describe via a
 * DvDefinition. The registry is assembled statically in components/dv/index.ts
 * (client bundle) so tree-shaking stays effective; this module holds only the
 * types + lookup helpers shared by server and client.
 */
import type { ComponentType } from "react";
import type { DvId } from "@/lib/catalogue/enums";
import type { QuestionPublic, QuestionResult } from "@/lib/types";

export type DvFamily =
  | "split" // split cards / radial / liquid family
  | "rank" // tier board / leaderboard / podium / medal
  | "proportion" // treemap
  | "geo" // india map winner / bubbles
  | "flow" // sankey
  | "matrix"; // heat matrix

export type DvProps = {
  question: QuestionPublic;
  result: QuestionResult; // aggregate + sample_n + your_payload
  /** id of the rendered variant (a question's primary or one of secondary) */
  dvId: DvId;
};

export type DvDefinition = {
  id: DvId;
  family: DvFamily;
  /** editorial label shown in the DV switcher pill (SW1) */
  label: string;
  /** which payload/aggregate shapes this renderer can draw */
  supportedModes: QuestionPublic["mode"][];
  Component: ComponentType<DvProps>;
};

export type DvRegistry = Record<DvId, DvDefinition>;

/** Resolve render order: primary first, then secondaries the renderer supports. */
export function dvsForQuestion(
  registry: Partial<DvRegistry>,
  question: QuestionPublic
): DvDefinition[] {
  const ids = [question.primary_dv, ...question.secondary_dvs];
  const out: DvDefinition[] = [];
  for (const id of ids) {
    const def = registry[id];
    if (def && def.supportedModes.includes(question.mode) && !out.some((d) => d.id === id)) {
      out.push(def);
    }
  }
  return out;
}
