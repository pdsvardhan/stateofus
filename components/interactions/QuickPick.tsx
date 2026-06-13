"use client";

/**
 * Quick Pick — one tap, no overthinking (v5 `quick`).
 * Letter-badged option rows, staggered rise-in, picked row turns lime with a
 * "Counted ✓" pop, then submits after the v5 560ms beat.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { useDelayedSubmit } from "./useDelayedSubmit";

export function QuickPick({ question, onSubmit, submitting }: InteractionProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  function pick(key: string) {
    if (picked !== null || submitting) return;
    setPicked(key);
    submitAfter(560, { pick: key }, () => setPicked(null));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {question.options.map((o, i) => {
        const isPicked = picked === o.key;
        return (
          <motion.button
            key={o.key}
            type="button"
            data-testid="option"
            onClick={() => pick(o.key)}
            disabled={picked !== null || submitting}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : i * 0.06 }}
            whileHover={
              picked === null && !reduceMotion
                ? { x: -3, y: -4, scale: 1.018 }
                : undefined
            }
            className={`flex min-h-[54px] items-center gap-3 rounded-lg border-2 border-ink px-4 py-[15px] text-left font-ui transition-shadow duration-200 hover:shadow-[7px_9px_0_var(--ink)] disabled:hover:shadow-none ${
              isPicked ? "bg-lime" : "bg-paper-bright"
            }`}
          >
            <span className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded border-[1.5px] border-ink bg-paper font-label text-[11px] font-bold">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1 text-[16.5px] font-semibold">{o.label}</span>
            {isPicked && (
              <motion.span
                initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="font-label text-[10px] font-bold uppercase tracking-[0.1em]"
              >
                Counted ✓
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
