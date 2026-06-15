"use client";

/**
 * Rank Order — strict order, no ties (v5 `rank`).
 * FB-019: drag-to-reorder is the primary interaction (framer-motion Reorder,
 * FLIP row slides, visible ⠿ drag handle). ↑/↓ nudge buttons remain as the
 * tap/keyboard fallback (AC340/AC385); after the first successful drag they
 * fade to a quiet state but return to full strength on row hover or keyboard
 * focus. FB-018: the top row's ↑ and bottom row's ↓ fade out smoothly
 * (opacity 0 + pointer-events none — no layout shift).
 * LAB-002: the starting order is already a valid answer — "Lock my order"
 * submits whenever the user is done.
 */
import { useState } from "react";
import { Reorder } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { moveInOrder } from "./logic";
import { useDelayedSubmit } from "./useDelayedSubmit";

export function RankOrder({ question, onSubmit, submitting }: InteractionProps) {
  const [order, setOrder] = useState<string[]>(() =>
    question.options.map((o) => o.key)
  );
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragUsed, setDragUsed] = useState(false);
  const [locked, setLocked] = useState(false);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  const labelByKey = new Map(question.options.map((o) => [o.key, o.label]));
  const lastIdx = order.length - 1;
  const busy = locked || submitting;

  function nudge(index: number, dir: -1 | 1) {
    if (busy) return;
    setOrder((cur) => moveInOrder(cur, index, dir));
  }

  function lock() {
    if (busy) return;
    setLocked(true);
    submitAfter(420, { order }, () => setLocked(false));
  }

  function arrowClass(atEdge: boolean): string {
    if (atEdge) return "pointer-events-none opacity-0";
    if (dragUsed)
      return "opacity-25 hover:opacity-100 focus-visible:opacity-100";
    return "opacity-100";
  }

  return (
    <div>
      <div className="mb-3.5 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
        Drag rows into place (or nudge with the arrows)
      </div>

      <Reorder.Group
        axis="y"
        values={order}
        onReorder={(next) => {
          if (!busy) setOrder(next);
        }}
        className="flex list-none flex-col gap-2.5 p-0"
      >
        {order.map((key, pos) => {
          const dragging = draggingKey === key;
          return (
            <Reorder.Item
              key={key}
              value={key}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }
              }
              onDragStart={() => setDraggingKey(key)}
              onDragEnd={() => {
                setDraggingKey(null);
                setDragUsed(true);
              }}
              dragListener={!busy}
              style={{
                touchAction: "none",
                boxShadow: dragging
                  ? "7px 9px 0 color-mix(in srgb, var(--ink) 30%, transparent)"
                  : "3px 3px 0 color-mix(in srgb, var(--ink) 15%, transparent)",
              }}
              className={`group relative flex h-[58px] cursor-grab select-none items-center gap-[11px] rounded-[9px] border-2 border-ink px-3.5 active:cursor-grabbing ${
                dragging ? "z-10 bg-paper-white" : "z-0 bg-paper-bright"
              }`}
            >
              <span className="shrink-0 text-[15px] tracking-[2px] text-muted-warm">
                ⠿
              </span>
              <span className="w-[34px] shrink-0 font-ui text-[18px] font-extrabold text-fire">
                {pos + 1}
              </span>
              <span className="flex-1 font-ui text-[15px] font-semibold">
                {labelByKey.get(key)}
              </span>
              <button
                type="button"
                aria-label={`Move ${labelByKey.get(key)} up`}
                onClick={() => nudge(pos, -1)}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={busy || pos === 0}
                className={`h-9 w-9 rounded-lg border-2 border-ink bg-paper font-ui text-sm font-extrabold transition-all duration-300 hover:-translate-y-0.5 hover:bg-lime ${arrowClass(
                  pos === 0
                )}`}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${labelByKey.get(key)} down`}
                onClick={() => nudge(pos, 1)}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={busy || pos === lastIdx}
                className={`h-9 w-9 rounded-lg border-2 border-ink bg-paper font-ui text-sm font-extrabold transition-all duration-300 hover:translate-y-0.5 hover:bg-fire-tint ${arrowClass(
                  pos === lastIdx
                )}`}
              >
                ↓
              </button>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      <button
        type="button"
        onClick={lock}
        disabled={busy}
        className="mt-[18px] min-h-[56px] w-full rounded-lg border-2 border-ink bg-ink p-4 font-ui text-[14.5px] font-extrabold uppercase tracking-[0.04em] text-paper transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--ink-soft)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
      >
        {locked ? "Locked — counting…" : "Lock my order"}{" "}
        <span className="text-lime">→</span>
      </button>
    </div>
  );
}
