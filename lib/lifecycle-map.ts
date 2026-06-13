/**
 * Pure lifecycle map — client-safe (no db imports). lib/lifecycle.ts owns
 * the transactional transition; this module owns the rules.
 */
import type { LifecycleState } from "@/lib/catalogue/enums";

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
