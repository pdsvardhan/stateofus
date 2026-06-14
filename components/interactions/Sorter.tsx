"use client";

/**
 * Sorter — shared by bucket_sort and tier_placement (v5 `sort`), parameterized
 * by question.targets ({kind: "buckets"|"tiers", labels}).
 *
 * Locked interaction (LAB-001 + LAB-002 + FB-016/017):
 *  - S1 tray structure: pool of chips up top, current item teed up in a
 *    separate "Now sorting" focus zone clearly above the targets.
 *  - S3 bucket treatment: solid colour-filled chunky target cards (TIERBG
 *    palette fire/gold/lime/blue, cycled).
 *  - Tap-only path (AC340): tap a chip to tee it up, tap a bucket to file.
 *  - Drag path: drag any chip (pool or focus) — a lime ghost pill follows the
 *    pointer; drop inside a bucket to file straight in.
 *  - LAB-002 early submit after ≥1 placement; unplaced items are per-item
 *    skips. Full sort auto-counts after the v5 520ms filing beat.
 */
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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

type DragState = {
  key: string;
  x0: number;
  y0: number;
  moved: boolean;
};

export function Sorter({ question, onSubmit, submitting }: InteractionProps) {
  const labels = question.targets?.labels ?? [];
  const items = question.options;
  const itemKeys = items.map((o) => o.key);
  const labelByKey = new Map(items.map((o) => [o.key, o.label]));

  const [placements, setPlacements] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ key: string; x: number; y: number } | null>(null);
  const [counting, setCounting] = useState(false);
  const drag = useRef<DragState | null>(null);
  const bucketRefs = useRef<(HTMLDivElement | null)[]>([]);
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

  function hitBucket(x: number, y: number): number {
    for (let i = 0; i < labels.length; i++) {
      const el = bucketRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return -1;
  }

  function chipDown(key: string) {
    return (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (locked) return;
      drag.current = { key, x0: e.clientX, y0: e.clientY, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
  }

  function chipMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.sqrt(dx * dx + dy * dy) > 7) d.moved = true;
    if (d.moved) setGhost({ key: d.key, x: e.clientX, y: e.clientY });
  }

  function chipUp(e: ReactPointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (d.moved) {
      const ti = hitBucket(e.clientX, e.clientY);
      if (ti >= 0) file(d.key, ti);
      setGhost(null);
    } else {
      // plain tap: tee the chip up in the focus zone
      setSelected(d.key);
      setGhost(null);
    }
  }

  const pool = items.filter((o) => placements[o.key] === undefined && o.key !== current);
  const targetsActive = current !== null || ghost !== null;

  return (
    <div>
      <div className="mb-3 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
        {filedCount} of {items.length} filed · tap a chip to tee it up, then tap a
        bucket — or drag straight in
      </div>

      {/* S1 pool tray */}
      <div className="mb-3.5 flex min-h-[62px] flex-wrap items-center gap-2 rounded-[10px] border-2 border-dashed border-ink bg-paper-bright/60 p-[13px]">
        {pool.map((o) => {
          const ghosting = ghost?.key === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onPointerDown={chipDown(o.key)}
              onPointerMove={chipMove}
              onPointerUp={chipUp}
              disabled={locked}
              style={{ touchAction: "none" }}
              className={`inline-flex min-h-[44px] cursor-grab select-none items-center gap-2 rounded-full border-2 border-ink px-[15px] py-2.5 font-ui text-sm font-bold transition-colors duration-200 hover:-translate-x-px hover:-translate-y-px ${
                ghosting ? "bg-paper-edge text-muted-warm" : "bg-paper-bright text-ink"
              }`}
            >
              {o.label}
            </button>
          );
        })}
        {!current && pool.length === 0 && (
          <span className="font-label text-[11px] uppercase tracking-[0.1em] text-muted">
            All filed — counting your sort…
          </span>
        )}
      </div>

      {/* "Now sorting" focus zone — current item, clearly separated (FB-016/017) */}
      {current !== null && ghost?.key !== current && (
        <div className="mb-4 rounded-xl border-2 border-dashed border-ink bg-paper-bright/75 px-3.5 pb-3.5 pt-3 text-center">
          <div className="mb-[9px] font-label text-[10px] uppercase tracking-[0.16em] text-muted">
            Now sorting
          </div>
          <motion.button
            key={current}
            type="button"
            onPointerDown={chipDown(current)}
            onPointerMove={chipMove}
            onPointerUp={chipUp}
            disabled={locked}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
            animate={
              reduceMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 1, scale: 1, y: [0, -5, 0] }
            }
            transition={{
              opacity: { duration: 0.3 },
              scale: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
              y: { duration: 2.6, delay: 1, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{
              touchAction: "none",
              boxShadow: "6px 6px 0 color-mix(in srgb, var(--ink) 30%, transparent)",
            }}
            className="inline-flex cursor-grab select-none items-center gap-2.5 rounded-xl border-2 border-ink bg-ink px-[22px] py-[13px] text-paper"
          >
            <span className="text-base tracking-[2px] text-muted-warm">⠿</span>
            <span className="font-ui text-[16.5px] font-extrabold">
              {labelByKey.get(current)}
            </span>
          </motion.button>
          <div className="mt-[9px] font-label text-[10px] uppercase tracking-[0.12em] text-muted">
            ▼ drag it down, or just tap a bucket ▼
          </div>
        </div>
      )}

      {/* S3 solid-colour bucket cards (LAB-001) */}
      <div
        className="grid grid-cols-1 gap-3 exp:[grid-template-columns:repeat(var(--bucket-n),1fr)]"
        style={{ "--bucket-n": labels.length } as React.CSSProperties}
      >
        {labels.map((label, ti) => {
          const chips = items.filter((o) => placements[o.key] === ti);
          return (
            <div
              key={label}
              ref={(el) => {
                bucketRefs.current[ti] = el;
              }}
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

      {/* drag ghost — lime pill riding the pointer */}
      {ghost && (
        <div
          className="pointer-events-none fixed left-0 top-0 z-50"
          style={{
            transform: `translate(${ghost.x}px, ${ghost.y}px) translate(-50%, -50%) rotate(-4deg)`,
          }}
        >
          <span
            style={{
              boxShadow: "5px 5px 0 color-mix(in srgb, var(--ink) 30%, transparent)",
            }}
            className="inline-block rounded-full border-2 border-ink bg-lime px-4 py-2.5 font-ui text-sm font-bold text-ink"
          >
            {labelByKey.get(ghost.key)}
          </span>
        </div>
      )}
    </div>
  );
}
