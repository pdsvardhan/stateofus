"use client";

/**
 * Logo Quick Pick — brand-tile grid (v5 `logoquick`).
 * iter-3 #22 (adr-009-stateofus-brand-icons): real brand glyphs from Simple Icons,
 * bundled locally and rendered monochrome (ink) to fit the newspaper aesthetic.
 * Brands Simple Icons doesn't carry fall back to the original typographic mark
 * (first letter on a paper-white plate).
 * iter-4 #315: CONSISTENCY — real glyphs render only when EVERY option in the
 * question resolves to one. If any option lacks a glyph, all options use the
 * typographic tile, so a question is never a mix of logos and letters (no option
 * looks favoured). When the missing brand assets land, those questions light up
 * their logos again with no further change.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { useDelayedSubmit } from "./useDelayedSubmit";
import { tileSwatch } from "@/lib/dv/palette";
import { BRAND_ICONS, normalizeBrand } from "@/lib/brand-icons";

export function LogoQuickPick({ question, onSubmit, submitting }: InteractionProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  // iter-4 #315: all-or-nothing per question — logos only when every option has one.
  const allResolved = question.options.every(
    (o) => BRAND_ICONS[normalizeBrand(o.label)]
  );

  function pick(key: string) {
    if (picked !== null || submitting) return;
    setPicked(key);
    submitAfter(560, { pick: key }, () => setPicked(null));
  }

  return (
    <div className="grid grid-cols-2 gap-3 exp:grid-cols-3">
      {question.options.map((o, i) => {
        const isPicked = picked === o.key;
        const tile = tileSwatch(o.key);
        const icon = allResolved ? BRAND_ICONS[normalizeBrand(o.label)] : undefined;
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
                ? { x: -3, y: -4, scale: 1.02, transition: { duration: 0.18, ease: [0.2, 0.7, 0.2, 1] } }
                : undefined
            }
            className={`flex min-h-[122px] flex-col items-center gap-2.5 rounded-[10px] border-2 border-ink px-3 py-[18px] font-ui transition-shadow duration-200 hover:shadow-[7px_9px_0_var(--ink)] disabled:hover:shadow-none ${
              isPicked ? "bg-lime" : "bg-paper-bright"
            }`}
          >
            {icon ? (
              <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-xl border-2 border-ink bg-paper-white">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="var(--ink)" role="img" aria-hidden>
                  <path d={icon.path} />
                </svg>
              </span>
            ) : (
              <span
                className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-xl border-2 border-ink text-[19px] font-black"
                style={{ background: tile.bg, color: tile.fg }}
              >
                {(o.label.trim()[0] ?? "?").toUpperCase()}
              </span>
            )}
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
