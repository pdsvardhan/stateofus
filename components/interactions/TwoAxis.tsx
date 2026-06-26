"use client";

/**
 * Two-Axis — place each option in a quadrant of a 2×2 grid.
 * Tap an option chip to arm it (or it auto-arms the next unplaced one), then
 * tap a quadrant cell to drop it there; tapping a placed chip in the pool
 * re-arms it to move it. Tap-only by design (RAILS: works at 375px, no drag).
 * A partial answer is valid — "Lock my map" enables once at least one option
 * is placed (LAB-002); Skip never reaches onSubmit. Submits { placements }
 * (option key → q1..q4) after the v5 520ms beat.
 *
 * Quadrant ids match transforms QUADRANTS + HeatMatrix QUAD_POS: q1 top-left,
 * q2 top-right, q3 bottom-left, q4 bottom-right. Axis ends read from
 * question.targets.labels ([xLow,xHigh,yLow,yHigh]) or sensible defaults.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { QUADRANTS, type Quadrant } from "@/lib/dv/transforms";
import { useDelayedSubmit } from "./useDelayedSubmit";

const QUAD_POS: Record<Quadrant, { row: 0 | 1; col: 0 | 1 }> = {
  q1: { row: 0, col: 0 },
  q2: { row: 0, col: 1 },
  q3: { row: 1, col: 0 },
  q4: { row: 1, col: 1 },
};

export function TwoAxis({ question, onSubmit, submitting }: InteractionProps) {
  const [placements, setPlacements] = useState<Record<string, Quadrant>>({});
  const [armed, setArmed] = useState<string | null>(null);
  const [counting, setCounting] = useState(false);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  const t = question.targets?.labels ?? [];
  const xLow = t[0] ?? "Boring";
  const xHigh = t[1] ?? "Fun";
  const yLow = t[2] ?? "Useful";
  const yHigh = t[3] ?? "Useless";

  const placedCount = Object.keys(placements).length;
  const busy = counting || submitting;
  const canSubmit = placedCount >= 1 && !busy;

  // the option a quadrant tap will place: the armed one, else the next unplaced.
  const activeKey =
    armed && placements[armed] === undefined
      ? armed
      : question.options.find((o) => placements[o.key] === undefined)?.key ?? null;

  function tapChip(key: string) {
    if (busy) return;
    setArmed(key); // re-arm to (re)place this option
  }

  function tapQuadrant(q: Quadrant) {
    if (busy || !activeKey) return;
    setPlacements((cur) => ({ ...cur, [activeKey]: q }));
    setArmed(null);
  }

  function lock() {
    if (!canSubmit) return;
    setCounting(true);
    submitAfter(520, { placements }, () => setCounting(false));
  }

  const cellAt = (row: 0 | 1, col: 0 | 1): Quadrant =>
    QUADRANTS.find((q) => QUAD_POS[q].row === row && QUAD_POS[q].col === col)!;

  const labelByKey = new Map(question.options.map((o) => [o.key, o.label]));

  return (
    <div>
      <div className="mb-3.5 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
        Tap an option, then tap a quadrant to place it
      </div>

      {/* option pool */}
      <div className="mb-4 flex flex-wrap gap-2">
        {question.options.map((o) => {
          const placed = placements[o.key];
          const isActive = activeKey === o.key;
          return (
            <button
              key={o.key}
              type="button"
              data-testid="option"
              onClick={() => tapChip(o.key)}
              disabled={busy}
              className={`rounded-full border-2 border-ink px-3.5 py-2 font-ui text-[13.5px] font-semibold transition-all duration-150 disabled:opacity-60 ${
                isActive
                  ? "bg-lime shadow-[3px_3px_0_var(--ink)]"
                  : placed
                    ? "bg-paper text-muted"
                    : "bg-paper-bright hover:-translate-y-0.5"
              }`}
            >
              {o.label}
              {placed && (
                <span className="ml-1.5 font-label text-[10px] uppercase tracking-[0.06em]">
                  ● placed
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2×2 grid with axis labels */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        <span />
        <span className="text-center font-label text-[10px] uppercase tracking-[0.08em] text-muted">
          ↑ {yLow}
        </span>

        <span
          className="text-center font-label text-[10px] uppercase tracking-[0.08em] text-muted"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {xLow} ↔ {xHigh}
        </span>
        <div className="grid grid-cols-2 grid-rows-2 gap-2">
          {([0, 1] as const).flatMap((row) =>
            ([0, 1] as const).map((col) => {
              const q = cellAt(row, col);
              const here = question.options.filter((o) => placements[o.key] === q);
              return (
                <motion.button
                  key={q}
                  type="button"
                  aria-label={`Place ${activeKey ? labelByKey.get(activeKey) : "an option"} in quadrant ${q}`}
                  onClick={() => tapQuadrant(q)}
                  disabled={busy || !activeKey}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: reduceMotion ? 0 : (row * 2 + col) * 0.04 }}
                  className={`flex min-h-[96px] flex-col items-start gap-1.5 rounded-lg border-2 border-ink bg-paper-bright p-2.5 text-left transition-colors duration-150 ${
                    activeKey && !busy ? "hover:bg-lime/40" : ""
                  } disabled:cursor-default`}
                >
                  <span className="flex flex-wrap gap-1">
                    {here.map((o) => (
                      <span
                        key={o.key}
                        className="rounded-full border border-ink bg-lime px-2 py-0.5 font-ui text-[11px] font-semibold"
                      >
                        {o.label}
                      </span>
                    ))}
                  </span>
                </motion.button>
              );
            })
          )}
        </div>

        <span />
        <span className="text-center font-label text-[10px] uppercase tracking-[0.08em] text-muted">
          {yHigh} ↓
        </span>
      </div>

      <button
        type="button"
        onClick={lock}
        disabled={!canSubmit}
        className="mt-[18px] min-h-[56px] w-full rounded-lg border-2 border-ink bg-ink p-4 font-ui text-[14.5px] font-extrabold uppercase tracking-[0.04em] text-paper transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--ink-soft)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
      >
        {counting ? "Locked — counting…" : "Lock my map"} <span className="text-lime">→</span>
      </button>
    </div>
  );
}
