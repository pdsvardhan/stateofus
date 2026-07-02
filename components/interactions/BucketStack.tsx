"use client";

/**
 * BucketStack — bucket_sort's card-stack answer flow (iter-6 item-412).
 *
 * Replaces the Sorter's tap-chip-then-tap-bucket two-step for bucket_sort
 * (report #50 [7]; owner picked "card stack, one at a time" 2026-07-02).
 * tier_placement keeps the Sorter.
 *
 * Visual skeleton adapted from asset-library mc-stack (react-bits StackedCards,
 * MIT): depth-rotated card pile + spring settle. Primary action is TAP —
 * one item front-and-center, large bucket tap-targets below file it and the
 * next card springs forward (tap-only rail, AC340, works at 375px).
 *
 *  - Skip this card → moves it to the back of the queue (never forced).
 *  - Filed chips stay visible per bucket; tap a chip to unfile (undo).
 *  - LAB-002 early submit after ≥1 placement; unplaced items are per-item
 *    skips. Full file auto-counts after the v5 520ms beat.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { fileItem, placementsPayload, tierColor, unfileItem } from "./logic";
import { useDelayedSubmit } from "./useDelayedSubmit";

/** mc-stack's spring feel, kept verbatim so the pile settles like the source. */
const PILE_SPRING = { type: "spring" as const, stiffness: 260, damping: 20 };

export function BucketStack({ question, onSubmit, submitting }: InteractionProps) {
  const labels = question.targets?.labels ?? [];
  const items = question.options;
  const labelByKey = new Map(items.map((o) => [o.key, o.label]));

  const [placements, setPlacements] = useState<Record<string, number>>({});
  const [queue, setQueue] = useState<string[]>(() => items.map((o) => o.key));
  const [counting, setCounting] = useState(false);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  const pending = queue.filter((k) => placements[k] === undefined);
  const current = pending[0] ?? null;
  const filedCount = Object.keys(placements).length;
  const allFiled = filedCount >= items.length && items.length > 0;
  const locked = submitting || counting;

  if (labels.length === 0) {
    return (
      <div className="font-label text-[11px] uppercase tracking-[0.14em] text-muted">
        This question has no sort targets yet — check back soon.
      </div>
    );
  }

  function file(key: string, ti: number) {
    if (locked) return;
    const next = fileItem(placements, key, ti, labels.length);
    setPlacements(next);
    if (Object.keys(next).length >= items.length) {
      setCounting(true);
      submitAfter(520, placementsPayload(next, labels), () => setCounting(false));
    }
  }

  function unfile(key: string) {
    if (locked) return;
    setPlacements(unfileItem(placements, key));
  }

  function skip() {
    if (locked || !current || pending.length < 2) return;
    setQueue((q) => [...q.filter((k) => k !== current), current]);
  }

  function submitEarly() {
    if (locked || filedCount < 1) return;
    setCounting(true);
    submitAfter(0, placementsPayload(placements, labels), () => setCounting(false));
  }

  return (
    <div>
      <div aria-live="polite" className="mb-3.5 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
        {filedCount} of {items.length} filed · tap a bucket to file this card
      </div>

      {/* the pile — current card front-and-center, next two peeking behind */}
      <div className="relative mb-4" style={{ minHeight: 128 }}>
        <AnimatePresence initial={false}>
          {pending
            .slice(0, 3)
            .map((key, depth) => (
              <motion.div
                key={key}
                initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.94 }}
                animate={{
                  opacity: 1,
                  y: depth * -7,
                  x: 0,
                  scale: 1 - depth * 0.05,
                  rotateZ: depth * 3,
                  zIndex: 10 - depth,
                }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 92, scale: 0.82, rotateZ: -5, transition: { duration: 0.32, ease: [0.34, 1.1, 0.64, 1] } }
                }
                transition={PILE_SPRING}
                style={{ position: depth === 0 ? "relative" : "absolute", inset: depth === 0 ? undefined : 0, transformOrigin: "88% 92%" }}
                className="flex min-h-[112px] flex-col justify-between rounded-xl border-2 border-ink bg-paper-bright px-[18px] py-[15px] shadow-[4px_4px_0_color-mix(in_srgb,var(--ink)_18%,transparent)]"
                aria-hidden={depth !== 0}
              >
                <span className="font-label text-[9.5px] font-bold uppercase tracking-[.16em] text-fire">
                  {depth === 0 ? "Now filing" : " "}
                </span>
                <span className="font-editorial text-[20px] font-semibold leading-[1.15] text-ink">
                  {labelByKey.get(key)}
                </span>
                <span className="font-label text-[10px] uppercase tracking-[.1em] text-muted">
                  {pending.length - 1} more after this
                </span>
              </motion.div>
            ))
            .reverse()}
        </AnimatePresence>
        {!current && (
          <div className="flex min-h-[112px] items-center justify-center rounded-xl border-2 border-dashed border-ink bg-paper-bright/60 font-label text-[11px] uppercase tracking-[0.1em] text-muted">
            All filed — counting your sort…
          </div>
        )}
      </div>

      {/* skip — never force a card */}
      {current && pending.length > 1 && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={skip}
            disabled={locked}
            className="font-label text-[11px] font-bold uppercase tracking-[.1em] text-ink underline decoration-2 underline-offset-2 disabled:opacity-50"
          >
            Skip this card — decide later →
          </button>
        </div>
      )}

      {/* bucket tap-targets — file the front card; chips inside undo */}
      <div
        className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 exp:[grid-template-columns:repeat(var(--bucket-n),1fr)]"
        style={{ "--bucket-n": labels.length } as React.CSSProperties}
      >
        {labels.map((label, ti) => {
          const chips = items.filter((o) => placements[o.key] === ti);
          return (
            <div
              key={label}
              style={{
                background: tierColor(ti),
                outline: current ? "2px dashed var(--ink)" : "none",
                outlineOffset: "3px",
              }}
              className="flex min-h-[86px] flex-col overflow-hidden rounded-xl border-2 border-ink text-left transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[4px_6px_0_var(--ink)]"
            >
              <button
                type="button"
                onClick={() => {
                  if (current) file(current, ti);
                }}
                disabled={locked || !current}
                aria-label={current ? `File “${labelByKey.get(current)}” into ${label}` : label}
                className="flex min-h-[52px] items-center justify-between gap-2 px-[13px] py-[11px] text-left"
              >
                <span className="font-ui text-sm font-black uppercase text-ink">{label}</span>
                <span className="rounded-full border-[1.5px] border-ink bg-paper px-2 py-0.5 font-label text-[10px] font-bold text-ink">
                  {chips.length}
                </span>
              </button>
              {chips.length > 0 && (
                <div className="flex flex-1 flex-wrap content-start gap-1.5 px-[11px] pb-3">
                  <AnimatePresence initial={false}>
                    {chips.map((o) => (
                      <motion.button
                        key={o.key}
                        type="button"
                        onClick={() => unfile(o.key)}
                        disabled={locked}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-full border-[1.5px] border-ink bg-paper px-[11px] py-1.5 font-ui text-xs font-semibold text-ink transition-colors hover:bg-fire-tint"
                      >
                        {o.label} ×
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LAB-002: early submit — never force a full sort */}
      {(filedCount >= 1 && !allFiled) || (allFiled && !counting && !submitting) ? (
        <motion.button
          type="button"
          onClick={submitEarly}
          disabled={locked}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 min-h-[54px] w-full rounded-lg border-2 border-ink bg-ink p-[15px] font-ui text-sm font-extrabold uppercase tracking-[0.04em] text-paper transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--ink-soft)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
        >
          {allFiled
            ? "Count my sort"
            : `Count my ${filedCount} of ${items.length} — skip the rest`}{" "}
          <span className="text-lime">→</span>
        </motion.button>
      ) : null}
    </div>
  );
}
