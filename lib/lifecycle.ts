/**
 * Question lifecycle — feat-question-lifecycle.
 *
 * AC 360: states enforced server-side with an explicit allowed-transition map.
 * AC 361: frozen questions show results and reject new answers.
 * AC 375 (seed pipeline): draft → active requires recorded approval.
 */
import { rawDb } from "@/lib/db/client";
import type { LifecycleState } from "@/lib/catalogue/enums";
import { LIFECYCLE_STATES } from "@/lib/catalogue/enums";

export const ALLOWED_TRANSITIONS: Record<LifecycleState, LifecycleState[]> = {
  draft: ["active", "archived"],
  active: ["paused", "frozen", "archived"],
  paused: ["active", "frozen", "archived"],
  frozen: ["archived"],
  archived: [], // terminal
};

/** Only active questions accept answers. Frozen/paused/archived show results. */
export function isAnswerable(status: LifecycleState): boolean {
  return status === "active";
}

/** Results render for everything that ever collected answers. */
export function showsResults(status: LifecycleState): boolean {
  return status !== "draft";
}

export type TransitionResult =
  | { ok: true; from: LifecycleState; to: LifecycleState }
  | { ok: false; error: string; code: "not-found" | "invalid-state" | "forbidden-transition" | "approval-required" };

export function transitionQuestion(opts: {
  questionId: string;
  to: LifecycleState;
  actor: string; // admin | system | import
  reason?: string;
  approvedBy?: string; // required for draft → active
}): TransitionResult {
  const { questionId, to, actor, reason, approvedBy } = opts;

  if (!LIFECYCLE_STATES.includes(to)) {
    return { ok: false, error: `unknown target state "${to}"`, code: "invalid-state" };
  }

  const tx = rawDb.transaction((): TransitionResult => {
    const row = rawDb
      .prepare("SELECT status, approved_by FROM questions WHERE id = ?")
      .get(questionId) as { status: LifecycleState; approved_by: string | null } | undefined;
    if (!row) {
      return { ok: false, error: `question ${questionId} not found`, code: "not-found" };
    }
    const from = row.status;
    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
      return {
        ok: false,
        error: `transition ${from} → ${to} is not allowed`,
        code: "forbidden-transition",
      };
    }
    if (from === "draft" && to === "active") {
      const approver = approvedBy ?? row.approved_by;
      if (!approver) {
        return {
          ok: false,
          error: "draft → active requires recorded approval (approved_by)",
          code: "approval-required",
        };
      }
      rawDb
        .prepare(
          "UPDATE questions SET approved_by = ?, approved_at = COALESCE(approved_at, datetime('now')) WHERE id = ?"
        )
        .run(approver, questionId);
    }
    rawDb
      .prepare("UPDATE questions SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(to, questionId);
    rawDb
      .prepare(
        "INSERT INTO lifecycle_events (question_id, from_status, to_status, actor, reason) VALUES (?, ?, ?, ?, ?)"
      )
      .run(questionId, from, to, actor, reason ?? null);
    return { ok: true, from, to };
  });

  return tx();
}
