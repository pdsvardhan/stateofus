/**
 * Per-mode answer payload schemas — feat-interaction-modes (server half).
 *
 * Rails: skip records NOTHING (a skip never reaches POST /api/answers).
 * Early submit (LAB-002): partial placements/swipes are valid answers —
 * untouched items count as skipped per-item, never block submission.
 */
import { z } from "zod";
import type { Mode } from "@/lib/catalogue/enums";

const optionKey = z.string().min(1).max(40);

/** coin_allocation budget — every voter spends up to this many coins. */
export const COIN_BUDGET = 10;

export const payloadSchemas = {
  quick_pick: z.object({ pick: optionKey }),
  logo_quick_pick: z.object({ pick: optionKey }),
  tradeoff_cards: z.object({ pick: optionKey }),
  swipe_stack: z
    .object({ votes: z.record(optionKey, z.enum(["yes", "no"])) })
    .refine((p) => Object.keys(p.votes).length >= 1, "swipe at least one card"),
  bucket_sort: z
    .object({ placements: z.record(optionKey, z.string().min(1).max(60)) })
    .refine((p) => Object.keys(p.placements).length >= 1, "place at least one item"),
  tier_placement: z
    .object({ placements: z.record(optionKey, z.string().min(1).max(60)) })
    .refine((p) => Object.keys(p.placements).length >= 1, "place at least one item"),
  rank_order: z
    .object({ order: z.array(optionKey).min(2) })
    .refine((p) => new Set(p.order).size === p.order.length, "duplicate items in order"),
  podium_slots: z
    .object({
      slots: z.object({
        first: optionKey, // early submit: 1st place alone is a valid answer
        second: optionKey.optional(),
        third: optionKey.optional(),
      }),
    })
    .refine((p) => {
      const filled = [p.slots.first, p.slots.second, p.slots.third].filter(
        (v): v is string => Boolean(v)
      );
      return new Set(filled).size === filled.length;
    }, "same item in multiple slots"),
  // spectrum carries a 0–100 position, not option keys — validatePayload's
  // key-reference check is a no-op for it (no pick/votes/placements/order/slots).
  spectrum: z.object({ value: z.number().int().min(0).max(100) }),
  coin_allocation: z
    .object({ alloc: z.record(optionKey, z.number().int().min(0)) })
    .refine((p) => {
      const total = Object.values(p.alloc).reduce((a, b) => a + b, 0);
      return total >= 1 && total <= COIN_BUDGET;
    }, `spend between 1 and ${COIN_BUDGET} coins`),
  two_axis: z
    .object({ placements: z.record(optionKey, z.enum(["q1", "q2", "q3", "q4"])) })
    .refine((p) => Object.keys(p.placements).length >= 1, "place at least one item"),
  bracket: z.object({ winner: optionKey }),
  pin_map: z.object({ region: optionKey }),
} satisfies Record<Mode, z.ZodTypeAny>;

export type AnswerPayload = {
  [M in Mode]: z.infer<(typeof payloadSchemas)[M]> & { mode?: never };
}[Mode];

/**
 * Validate payload against the question's mode AND its real option keys.
 * Unknown option keys are rejected — payloads can only reference the
 * question's own options.
 */
export function validatePayload(
  mode: Mode,
  payload: unknown,
  validOptionKeys: string[]
):
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; error: string } {
  const schema = payloadSchemas[mode];
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const keys = new Set(validOptionKeys);
  const referenced: string[] = [];
  const p = parsed.data as Record<string, unknown>;
  if ("pick" in p) referenced.push(p.pick as string);
  if ("winner" in p) referenced.push(p.winner as string);
  if ("region" in p) referenced.push(p.region as string);
  if ("votes" in p) referenced.push(...Object.keys(p.votes as object));
  if ("placements" in p) referenced.push(...Object.keys(p.placements as object));
  if ("alloc" in p) referenced.push(...Object.keys(p.alloc as object));
  if ("order" in p) referenced.push(...(p.order as string[]));
  if ("slots" in p) {
    const s = p.slots as Record<string, string | undefined>;
    referenced.push(...Object.values(s).filter((v): v is string => Boolean(v)));
  }
  const unknown = referenced.filter((k) => !keys.has(k));
  if (unknown.length > 0) {
    return { ok: false, error: `unknown option keys: ${unknown.join(", ")}` };
  }
  return { ok: true, payload: p };
}
