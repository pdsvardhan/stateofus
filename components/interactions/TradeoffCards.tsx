"use client";

/**
 * Trade-off Cards — you must pick one (v5 `trade`).
 * Two editorial cards with a fire "VS" stamp slamming in between them.
 * Card A on paper-bright, card B on gold-tint; the pick turns lime and the
 * CTA flips to "Counted ✓" before the 560ms submit beat.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { useDelayedSubmit } from "./useDelayedSubmit";

export function TradeoffCards({ question, onSubmit, submitting }: InteractionProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);
  // trade-off is strictly a two-option duel — extra options never render
  const duel = question.options.slice(0, 2);

  function pick(key: string) {
    if (picked !== null || submitting) return;
    setPicked(key);
    submitAfter(560, { pick: key }, () => setPicked(null));
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-3.5 exp:grid-cols-[1fr_auto_1fr]">
      {duel.map((o, i) => {
        const isPicked = picked === o.key;
        const card = (
          <motion.button
            key={o.key}
            type="button"
            onClick={() => pick(o.key)}
            disabled={picked !== null || submitting}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : i * 0.1 }}
            whileHover={
              picked === null && !reduceMotion
                ? { x: -2, y: -2, rotate: i === 0 ? -1 : 1, transition: { duration: 0.15, ease: [0.2, 0.7, 0.2, 1] } }
                : undefined
            }
            className={`flex min-h-[170px] flex-col gap-3.5 rounded-[10px] border-2 border-ink px-5 pb-[22px] pt-[26px] text-left font-ui transition-shadow duration-200 hover:shadow-[6px_6px_0_var(--ink)] disabled:hover:shadow-none ${
              isPicked ? "bg-lime" : i === 0 ? "bg-paper-bright" : "bg-gold-tint"
            }`}
          >
            <span className="font-label text-[10px] uppercase tracking-[0.14em] text-muted">
              {i === 0 ? "Option one" : "Option two"}
            </span>
            <span className="flex-1 font-editorial text-[22px] font-semibold leading-[1.2]">
              {o.label}
            </span>
            <span className="text-[13px] font-extrabold uppercase tracking-[0.05em]">
              {isPicked ? "Counted ✓" : "This one"}
            </span>
          </motion.button>
        );
        if (i === 0) return card;
        return [
          <motion.div
            key="vs"
            initial={reduceMotion ? false : { opacity: 0, scale: 2.6, rotate: -18 }}
            animate={
              reduceMotion
                ? { opacity: 1, rotate: -8 }
                : {
                    opacity: [0, 1, 1, 1],
                    scale: [2.6, 0.92, 1.05, 1],
                    rotate: [-18, -8, -8, -8],
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.5, delay: 0.25, times: [0, 0.55, 0.75, 1] }
            }
            className="justify-self-center self-center rounded-full border-2 border-ink bg-fire px-[13px] py-[7px] font-ui text-sm font-black text-paper"
          >
            VS
          </motion.div>,
          card,
        ];
      })}
    </div>
  );
}
