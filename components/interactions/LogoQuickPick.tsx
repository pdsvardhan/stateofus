"use client";

/**
 * Logo Quick Pick — brand-tile grid (v5 `logoquick`).
 * Real brand logos are not licensed yet, so each tile renders the locked v5
 * MVP treatment: a bold typographic mark (first letter on a paper-white
 * plate, ink border) above the brand name. Design-approved per DECISIONS —
 * not a stub.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { useDelayedSubmit } from "./useDelayedSubmit";

export function LogoQuickPick({ question, onSubmit, submitting }: InteractionProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  function pick(key: string) {
    if (picked !== null || submitting) return;
    setPicked(key);
    submitAfter(560, { pick: key }, () => setPicked(null));
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {question.options.map((o, i) => {
        const isPicked = picked === o.key;
        return (
          <motion.button
            key={o.key}
            type="button"
            onClick={() => pick(o.key)}
            disabled={picked !== null || submitting}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : i * 0.05 }}
            whileHover={
              picked === null && !reduceMotion
                ? { x: -3, y: -4, scale: 1.02 }
                : undefined
            }
            className={`flex min-h-[122px] flex-col items-center gap-2.5 rounded-[10px] border-2 border-ink px-3 py-[18px] font-ui transition-shadow duration-200 hover:shadow-[7px_9px_0_var(--ink)] disabled:hover:shadow-none ${
              isPicked ? "bg-lime" : "bg-paper-bright"
            }`}
          >
            <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-xl border-2 border-ink bg-paper-white text-[19px] font-black text-ink">
              {(o.label.trim()[0] ?? "?").toUpperCase()}
            </span>
            <span className="text-center text-sm font-bold">{o.label}</span>
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
