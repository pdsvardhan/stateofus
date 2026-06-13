"use client";
/**
 * PersonalCard — the v5 "Where you landed" lime hero card (prototype lines
 * 917–921). The single editorial verdict that turns a chart into a reward.
 * Feed it { big, sub } from lib/insights/personalVerdict.
 */
import { motion, useReducedMotion } from "framer-motion";

export function PersonalCard({ big, sub }: { big: string; sub: string }) {
  const reduced = useReducedMotion();
  const size = big.length > 22 ? 28 : 34; // v5 scales the headline to its length

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reduced ? 0 : 0.3, ease: [0.2, 0.7, 0.2, 1] }}
      className="rounded-[10px] border-2 border-ink bg-lime p-[22px] shadow-[5px_5px_0_var(--ink)]"
    >
      <div className="mb-[9px] font-label text-[10px] font-bold uppercase tracking-[.18em] text-ink">
        Where you landed
      </div>
      <div
        className="font-ui font-black uppercase leading-[1.02] tracking-[-.02em] text-ink"
        style={{ fontSize: size }}
      >
        {big}
      </div>
      <p className="mt-[9px] font-editorial text-[15.5px] leading-[1.4] text-ink">{sub}</p>
    </motion.div>
  );
}

export default PersonalCard;
