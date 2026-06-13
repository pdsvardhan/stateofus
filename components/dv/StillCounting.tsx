"use client";
/**
 * Still counting — feat-dv-engine.
 *
 * The below-threshold state from v5: context + encouragement + the visible
 * sample count, never an empty chart and never fake precision. Rendered by
 * DvSwitcher whenever result.still_counting (or the aggregate is withheld).
 */
import { motion } from "framer-motion";
import type { QuestionPublic, QuestionResult } from "@/lib/types";
import { formatCount } from "@/lib/dv/transforms";
import { EASE, mono, useMotionPrefs } from "./chrome";

export default function StillCounting({
  result,
}: {
  question?: QuestionPublic;
  result: QuestionResult;
}) {
  const prefs = useMotionPrefs();
  const n = result.sample_n;
  const minN = result.min_reveal_n ?? 10;
  const progress = Math.max(4, Math.min(100, Math.round((n / Math.max(1, minN)) * 100)));

  return (
    <div
      style={{
        border: "2px dashed var(--ink)",
        borderRadius: 12,
        background: "color-mix(in srgb, var(--paper-bright) 75%, transparent)",
        padding: "44px 26px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 10 }} aria-hidden>
        🗳️
      </div>
      <div
        style={{
          fontWeight: 900,
          fontSize: 26,
          textTransform: "uppercase",
          letterSpacing: "-.01em",
          marginBottom: 8,
        }}
      >
        Still counting
      </div>
      <div
        style={{
          fontFamily: "var(--font-editorial)",
          fontSize: 15.5,
          lineHeight: 1.45,
          color: "var(--ink-soft)",
          maxWidth: 380,
          margin: "0 auto 18px",
        }}
      >
        Only {formatCount(n)} {n === 1 ? "vote" : "votes"} so far — too few to call anything
        honestly. {result.your_payload ? "Your answer is in the pile; the" : "The"} picture forms
        as India wakes up.
      </div>
      <div
        style={{
          height: 10,
          maxWidth: 260,
          margin: "0 auto",
          border: "1.5px solid var(--ink)",
          borderRadius: 100,
          background: "var(--paper-edge)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={prefs.reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: prefs.dur(0.7), ease: EASE }}
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--gold)",
            transformOrigin: "left",
          }}
        />
      </div>
      <div style={{ ...mono(10, ".12em"), color: "var(--muted)", marginTop: 8 }}>
        {formatCount(n)} counted · results unlock at {formatCount(minN)} votes
      </div>
    </div>
  );
}
