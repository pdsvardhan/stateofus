"use client";

/**
 * Podium Slots — tap your top three onto the steps (v5 `slots`).
 * Tap-to-place by design (AC340/AC385): tapping an option fills the first
 * empty slot (gold fills first), tapping a filled slot clears it. Steps read
 * 2 | 1 | 3 left-to-right with the gold step tallest. Placed options grey
 * out in the pool. LAB-002: 1st place alone is a valid answer — an early
 * submit appears once gold is filled; a full podium auto-counts after the
 * v5 600ms beat.
 *
 * Token note: the prototype's silver (#C9C5D6) and bronze (#D98E5F) step
 * fills have no globals.css token — paper-deep and muted-warm stand in until
 * --silver/--bronze tokens land (requested in the build manifest).
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { clearSlot, slotsPayload, takeSlot, type SlotState } from "./logic";
import { useDelayedSubmit } from "./useDelayedSubmit";

/** Visual order 2 | 1 | 3 — slotMeta indexed by slot (0 = gold). */
const ARRANGE = [1, 0, 2] as const;
const SLOT_META = [
  { rank: "1", place: "1st", h: 96, color: "var(--gold)" },
  { rank: "2", place: "2nd", h: 70, color: "var(--paper-deep)" },
  { rank: "3", place: "3rd", h: 52, color: "var(--muted-warm)" },
] as const;

export function PodiumSlots({ question, onSubmit, submitting }: InteractionProps) {
  const [slots, setSlots] = useState<SlotState>([null, null, null]);
  const [counting, setCounting] = useState(false);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  const labelByKey = new Map(question.options.map((o) => [o.key, o.label]));
  const allFilled = slots.every((s) => s !== null);
  const locked = submitting || counting;

  function take(key: string) {
    if (locked) return;
    const next = takeSlot(slots, key);
    if (next === slots) return;
    setSlots(next);
    if (next.every((s) => s !== null)) {
      const payload = slotsPayload(next);
      if (payload) {
        setCounting(true);
        submitAfter(600, payload, () => setCounting(false));
      }
    }
  }

  function clear(i: number) {
    if (locked) return;
    setSlots(clearSlot(slots, i));
  }

  function submitEarly() {
    if (locked) return;
    const payload = slotsPayload(slots);
    if (!payload) return;
    setCounting(true);
    submitAfter(0, payload, () => setCounting(false));
  }

  return (
    <div>
      <div className="mb-3.5 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
        Tap an option to place it · gold fills first · tap a slot to clear it
      </div>

      <div className="mb-5 flex items-end gap-3">
        {ARRANGE.map((si) => {
          const meta = SLOT_META[si];
          const filledKey = slots[si];
          const filled = filledKey !== null;
          return (
            <div key={meta.rank} className="flex flex-1 flex-col items-center gap-2">
              <motion.button
                type="button"
                onClick={() => clear(si)}
                disabled={locked || !filled}
                aria-label={
                  filled
                    ? `Clear ${labelByKey.get(filledKey)} from ${meta.place} place`
                    : `${meta.place} place — empty`
                }
                whileHover={!locked && !reduceMotion ? { y: -3 } : undefined}
                transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
                className={`min-h-[56px] w-full rounded-[10px] border-2 border-ink p-2 font-ui text-[13.5px] font-extrabold ${
                  filled ? "border-solid bg-lime" : "border-dashed bg-paper-bright"
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {filled ? (
                    <motion.span
                      key={filledKey}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="inline-block"
                    >
                      {labelByKey.get(filledKey)} ×
                    </motion.span>
                  ) : (
                    <motion.span
                      key="empty"
                      initial={false}
                      className="inline-block font-label text-[10px] font-bold uppercase tracking-[0.1em] text-muted"
                    >
                      {meta.place} place
                      <br />
                      tap an option ↓
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <div
                style={{
                  height: meta.h,
                  background: meta.color,
                  boxShadow:
                    "inset 0 -6px 0 color-mix(in srgb, var(--ink) 15%, transparent)",
                }}
                className="flex w-full items-center justify-center rounded-t-lg border-2 border-ink font-ui text-[21px] font-black italic text-ink"
              >
                {meta.rank}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-[9px]">
        {question.options.map((o) => {
          const taken = slots.includes(o.key);
          return (
            <motion.button
              key={o.key}
              type="button"
              onClick={() => take(o.key)}
              disabled={locked || taken}
              whileHover={
                !locked && !taken && !reduceMotion ? { x: -1, y: -3 } : undefined
              }
              transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
              className={`min-h-[46px] rounded-full border-2 border-ink px-[17px] py-[11px] font-ui text-sm font-bold transition-shadow duration-200 hover:shadow-[3px_4px_0_var(--ink)] disabled:shadow-none ${
                taken ? "bg-paper-edge opacity-40" : "bg-paper-bright"
              }`}
            >
              {o.label}
            </motion.button>
          );
        })}
      </div>

      {/* LAB-002: 1st place alone is a valid answer */}
      {slots[0] !== null && !allFilled && (
        <motion.button
          type="button"
          onClick={submitEarly}
          disabled={locked}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 min-h-[54px] w-full rounded-lg border-2 border-ink bg-ink p-[15px] font-ui text-sm font-extrabold uppercase tracking-[0.04em] text-paper transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--ink-soft)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
        >
          Count my podium as-is — skip the rest <span className="text-lime">→</span>
        </motion.button>
      )}
    </div>
  );
}
