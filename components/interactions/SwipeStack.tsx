"use client";

/**
 * Swipe Stack — verdict per card (v5 `swipe`).
 * Drag the top card past ±90px (or tap a verdict button — AC340 tap-only
 * fallback) to file a yes/no per option. Card rotates with the drag (x/16),
 * verdict stamps fade in with distance, the card flies out at ±560px over
 * 300ms, and the next card rises from behind. LAB-002: after ≥1 swipe an
 * "Enough — show me the count" early submit appears; unswiped cards are
 * per-item skips.
 */
import { useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { recordSwipe } from "./logic";
import { useDelayedSubmit } from "./useDelayedSubmit";

const EXIT_EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];

export function SwipeStack({ question, onSubmit, submitting }: InteractionProps) {
  const cards = question.options;
  const [idx, setIdx] = useState(0);
  const [votes, setVotes] = useState<Record<string, "yes" | "no">>({});
  const [earlyOut, setEarlyOut] = useState(false);
  const exiting = useRef(false);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  const x = useMotionValue(0);
  const rotate = useTransform(x, (v) => v / 16);
  const yesOp = useTransform(x, [0, 80], [0, 1]);
  const noOp = useTransform(x, [-80, 0], [1, 0]);

  const done = idx >= cards.length;
  const shownIdx = Math.min(idx, cards.length - 1);
  const nextCard = cards[shownIdx + 1];

  function swipeOut(isYes: boolean) {
    if (exiting.current || done || submitting || earlyOut) return;
    exiting.current = true;
    const key = cards[idx].key;
    const nextVotes = recordSwipe(votes, key, isYes);
    const finish = () => {
      exiting.current = false;
      x.set(0);
      setVotes(nextVotes);
      setIdx(idx + 1);
      if (idx + 1 >= cards.length) {
        submitAfter(380, { votes: nextVotes });
      }
    };
    if (reduceMotion) {
      finish();
    } else {
      animate(x, isYes ? 560 : -560, {
        duration: 0.3,
        ease: EXIT_EASE,
        onComplete: finish,
      });
    }
  }

  function submitEarly() {
    if (exiting.current || done || submitting || Object.keys(votes).length < 1) return;
    setEarlyOut(true);
    submitAfter(0, { votes }, () => setEarlyOut(false));
  }

  return (
    <div>
      <div className="mb-3.5 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
        Card {Math.min(idx + 1, cards.length)} of {cards.length} · swipe it or tap a
        verdict
      </div>

      <div className="relative mb-[22px] h-[280px]">
        {nextCard && (
          <div className="absolute inset-0 flex translate-y-2 rotate-[2.5deg] scale-[0.96] items-center justify-center rounded-xl border-2 border-ink bg-paper-edge p-[30px]">
            <span className="text-center font-editorial text-[22px] font-semibold text-muted-warm">
              {nextCard.label}
            </span>
          </div>
        )}
        <motion.div
          drag={done || submitting || earlyOut ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 90) swipeOut(info.offset.x > 0);
          }}
          style={{ x, rotate, touchAction: "none" }}
          className="absolute inset-0 flex cursor-grab select-none items-center justify-center rounded-xl border-2 border-ink bg-paper-bright p-[30px] shadow-[6px_6px_0_var(--ink)] active:cursor-grabbing"
        >
          <span className="text-center font-editorial text-[27px] font-semibold leading-[1.2]">
            {cards[shownIdx]?.label}
          </span>
          <motion.span
            style={{ opacity: yesOp }}
            className="absolute left-[18px] top-[18px] -rotate-[10deg] rounded-md border-[2.5px] border-agree px-2.5 py-[5px] font-ui text-[17px] font-black uppercase text-agree"
          >
            Yes
          </motion.span>
          <motion.span
            style={{ opacity: noOp }}
            className="absolute right-[18px] top-[18px] rotate-[10deg] rounded-md border-[2.5px] border-fire px-2.5 py-[5px] font-ui text-[17px] font-black uppercase text-fire"
          >
            No
          </motion.span>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => swipeOut(false)}
          disabled={done || submitting || earlyOut}
          className="min-h-[54px] rounded-lg border-2 border-ink bg-fire p-[15px] font-ui text-sm font-extrabold uppercase tracking-[0.04em] text-ink transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
        >
          ✕ No
        </button>
        <button
          type="button"
          onClick={() => swipeOut(true)}
          disabled={done || submitting || earlyOut}
          className="min-h-[54px] rounded-lg border-2 border-ink bg-lime p-[15px] font-ui text-sm font-extrabold uppercase tracking-[0.04em] text-ink transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
        >
          ✓ Yes
        </button>
      </div>

      {/* LAB-002: never force the full stack */}
      {Object.keys(votes).length >= 1 && !done && (
        <motion.button
          type="button"
          onClick={submitEarly}
          disabled={submitting || earlyOut}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 min-h-[54px] w-full rounded-lg border-2 border-ink bg-ink p-[15px] font-ui text-sm font-extrabold uppercase tracking-[0.04em] text-paper transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--ink-soft)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
        >
          Enough — show me the count <span className="text-lime">→</span>
        </motion.button>
      )}
    </div>
  );
}
