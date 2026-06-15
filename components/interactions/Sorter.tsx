"use client";

/**
 * Sorter — shared by bucket_sort and tier_placement (v5 `sort`), parameterized
 * by question.targets ({kind: "buckets"|"tiers", labels}).
 *
 * iter-3 #26/#27/#28/#29 — TAP-ONLY (drag removed; the old drag path felt
 * broken). Tap a chip to tee it up into a slim staging strip, then tap a bucket
 * to file it. The "Now sorting" caption is gone and the strip is slimmed.
 *  - Tap-only path (AC340): tap a chip → tap a bucket.
 *  - LAB-002 early submit after ≥1 placement; unplaced items are per-item
 *    skips. Full sort auto-counts after the v5 520ms filing beat.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import {
  fileItem,
  nextSortItem,
  placementsPayload,
  tierColor,
  unfileItem,
} from "./logic";
import { useDelayedSubmit } from "./useDelayedSubmit";

export function Sorter({ question, onSubmit, submitting }: InteractionProps) {
  const labels = question.targets?.labels ?? [];
  const items = question.options;
  const itemKeys = items.map((o) => o.key);
  const labelByKey = new Map(items.map((o) => [o.key, o.label]));

  const [placements, setPlacements] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [counting, setCounting] = useState(false);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  const current = nextSortItem(itemKeys, placements, selected);
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
    setSelected(null);
    if (Object.keys(next).length >= items.length) {
      setCounting(true);
      submitAfter(520, placementsPayload(next, labels), () => setCounting(false));
    }
  }

  function unfile(key: string) {
    if (locked) return;
    setPlacements(unfileItem(placements, key));
  }

  function submitEarly() {
    if (locked || filedCount < 1) return;
    setCounting(true);
    submitAfter(0, placementsPayload(placements, labels), () => setCounting(false));
  }

  const pool = items.filter((o) => placements[o.key] === undefined && o.key !== current);
  const targetsActive = current !== null;

  return (
    <div>
      <div className="mb-3.5 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
        {filedCount} of {items.length} filed · tap a chip to tee it up, then tap a
        bucket to file it
      </div>

      {/* S1 pool tray — restyled tap chips (#27); no dashed frame, chunkier pills */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {pool.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => {
              if (!locked) setSelected(o.key);
            }}
            disabled={locked}
            className="inline-flex min-h-[42px] select-none items-center rounded-full border-2 border-ink bg-paper-bright px-[16px] py-2 font-ui text-sm font-bold text-ink shadow-[2px_2px_0_color-mix(in_srgb,var(--ink)_18%,transparent)] transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:bg-paper-white hover:shadow-[3px_3px_0_var(--ink)] disabled:opacity-50 disabled:shadow-none"
          >
            {o.label}
          </button>
        ))}
        {!current && pool.length === 0 && (
          <span className="font-label text-[11px] uppercase tracking-[0.1em] text-muted">
            All filed — counting your sort…
          </span>
        )}
      </div>

      {/* slim staging strip — teed-up item (#26 slimmed, #28 no caption, #29 reworded) */}
      {current !== null && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-ink bg-paper-bright/75 px-3 py-2">
          <motion.span
            key={current}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className="inline-flex items-center rounded-md border-2 border-ink bg-ink px-3 py-1.5 font-ui text-[14px] font-extrabold text-paper"
          >
            {labelByKey.get(current)}
          </motion.span>
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-muted">
            tap a bucket below to file it ↓
          </span>
        </div>
      )}

      {/* S3 solid-colour bucket cards (LAB-001) — tap to file */}
      <div
        className="grid grid-cols-1 gap-3 exp:[grid-template-columns:repeat(var(--bucket-n),1fr)]"
        style={{ "--bucket-n": labels.length } as React.CSSProperties}
      >
        {labels.map((label, ti) => {
          const chips = items.filter((o) => placements[o.key] === ti);
          return (
            <div
              key={label}
              onClick={() => {
                if (current) file(current, ti);
              }}
              style={{
                background: tierColor(ti),
                outline: targetsActive ? "2px dashed var(--ink)" : "none",
                outlineOffset: "3px",
              }}
              className="flex min-h-[124px] cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-ink text-left transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[4px_6px_0_var(--ink)]"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (current) file(current, ti);
                }}
                disabled={locked}
                className="flex items-center justify-between gap-2 px-[13px] pb-1.5 pt-[11px] text-left"
              >
                <span className="font-ui text-sm font-black uppercase text-ink">
                  {label}
                </span>
                <span className="rounded-full border-[1.5px] border-ink bg-paper px-2 py-0.5 font-label text-[10px] font-bold text-ink">
                  {chips.length}
                </span>
              </button>
              {current !== null && chips.length === 0 && (
                <span className="px-[13px] font-label text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
                  file it here ↓
                </span>
              )}
              <div className="flex flex-1 flex-wrap content-start gap-1.5 px-[11px] pb-3 pt-[9px]">
                <AnimatePresence initial={false}>
                  {chips.map((o) => (
                    <motion.button
                      key={o.key}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        unfile(o.key);
                      }}
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
