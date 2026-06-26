"use client";

/**
 * Spectrum — drag (or tap) to where you stand on a 0–100 scale.
 * The track reads from question.options[0].label (left/0) to options[1].label
 * (right/100), falling back to "Low" / "High". End labels are also tappable
 * (snap to 0 / 100) and ± nudge chips move 5 at a time, so the mode works
 * tap-only at 375px (RAILS: no drag-only). A value is always present (starts
 * mid-scale), so "Lock my answer" is a valid early submit; Skip never reaches
 * onSubmit. Submits { value } after the v5 420ms beat.
 */
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { useDelayedSubmit } from "./useDelayedSubmit";

const clampValue = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function Spectrum({ question, onSubmit, submitting }: InteractionProps) {
  const [value, setValue] = useState(50);
  const [locked, setLocked] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  const lowLabel = question.options[0]?.label ?? "Low";
  const highLabel = question.options[1]?.label ?? "High";
  const busy = locked || submitting;

  function setFromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    setValue(clampValue(((clientX - rect.left) / rect.width) * 100));
  }

  function onTrackPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setFromClientX(e.clientX);
  }

  function onTrackPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (busy || !dragging) return;
    setFromClientX(e.clientX);
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function nudge(by: number) {
    if (busy) return;
    setValue((v) => clampValue(v + by));
  }

  function snap(to: number) {
    if (busy) return;
    setValue(clampValue(to));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (busy) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      nudge(-5);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      nudge(5);
    } else if (e.key === "Home") {
      e.preventDefault();
      snap(0);
    } else if (e.key === "End") {
      e.preventDefault();
      snap(100);
    }
  }

  function lock() {
    if (busy) return;
    setLocked(true);
    submitAfter(420, { value }, () => setLocked(false));
  }

  return (
    <div>
      <div className="mb-4 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
        Tap or drag the scale to where you stand
      </div>

      <div className="mb-3 flex items-end justify-between gap-3">
        <button
          type="button"
          onClick={() => snap(0)}
          disabled={busy}
          className="max-w-[42%] text-left font-ui text-[13px] font-semibold leading-tight text-ink transition-colors hover:text-fire disabled:hover:text-ink"
        >
          {lowLabel}
        </button>
        <span className="font-ui text-[34px] font-extrabold leading-none tracking-[-0.02em] text-fire">
          {value}
        </span>
        <button
          type="button"
          onClick={() => snap(100)}
          disabled={busy}
          className="max-w-[42%] text-right font-ui text-[13px] font-semibold leading-tight text-ink transition-colors hover:text-fire disabled:hover:text-ink"
        >
          {highLabel}
        </button>
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={busy ? -1 : 0}
        aria-label={`${lowLabel} to ${highLabel}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value} of 100`}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className="relative h-[52px] w-full cursor-pointer touch-none select-none rounded-full border-2 border-ink bg-paper-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-l-full bg-lime"
          style={{ width: `${value}%` }}
        />
        <motion.span
          aria-hidden
          className="absolute top-1/2 z-10 h-[44px] w-[44px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-paper shadow-[2px_2px_0_var(--ink)]"
          style={{ left: `${value}%` }}
          animate={
            reduceMotion ? undefined : { scale: dragging ? 1.12 : 1 }
          }
          transition={{ duration: 0.15, ease: [0.2, 0.7, 0.2, 1] }}
        />
      </div>

      <div className="mt-3 flex items-center justify-center gap-2.5">
        <button
          type="button"
          aria-label="Move 5 toward the low end"
          onClick={() => nudge(-5)}
          disabled={busy}
          className="h-10 w-12 rounded-lg border-2 border-ink bg-paper font-ui text-sm font-extrabold transition-all duration-200 hover:-translate-x-0.5 hover:bg-fire-tint disabled:opacity-50"
        >
          −5
        </button>
        <button
          type="button"
          aria-label="Move 5 toward the high end"
          onClick={() => nudge(5)}
          disabled={busy}
          className="h-10 w-12 rounded-lg border-2 border-ink bg-paper font-ui text-sm font-extrabold transition-all duration-200 hover:translate-x-0.5 hover:bg-lime disabled:opacity-50"
        >
          +5
        </button>
      </div>

      <button
        type="button"
        onClick={lock}
        disabled={busy}
        className="mt-[18px] min-h-[56px] w-full rounded-lg border-2 border-ink bg-ink p-4 font-ui text-[14.5px] font-extrabold uppercase tracking-[0.04em] text-paper transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--ink-soft)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
      >
        {locked ? "Locked — counting…" : "Lock my answer"}{" "}
        <span className="text-lime">→</span>
      </button>
    </div>
  );
}
