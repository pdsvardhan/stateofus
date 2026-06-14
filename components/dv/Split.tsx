"use client";
/**
 * S1 Split cards — feat-dv-engine.
 *
 * The v5 face-off: one shadowed card per side, the winner on lime with the
 * rotated “India's pick” stamp, ink bars growing in, “← Your side” under
 * the reader's answer. For swipe_stack the cards carry per-card yes shares.
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { PICK_MODES, shareRowsFor, yourPick, yourVotes } from "@/lib/dv/transforms";
import { inkVeil } from "@/lib/dv/palette";
import { EASE, GrowBar, Plate, SampleLine, mono, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

function Split({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const isSwipe = question.mode === "swipe_stack";
  const rows = shareRowsFor(question.mode, result.aggregate, question.options);
  const youKey = yourPick(result.your_payload);
  const votes = yourVotes(result.your_payload);
  const winIdx = rows.reduce((w, r, i) => (r.pct > rows[w].pct ? i : w), 0);

  return (
    <div>
      <div className="grid grid-cols-1 gap-3.5 exp:grid-cols-2">
        {rows.map((r, i) => {
          const win = i === winIdx && r.pct > 0;
          const yourSide = isSwipe ? votes?.[r.key] === "yes" : youKey === r.key;
          return (
            <motion.div
              key={r.key}
              initial={prefs.reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefs.dur(0.5), delay: prefs.delay(i * 0.12), ease: EASE }}
              style={{
                border: "2px solid var(--ink)",
                borderRadius: 10,
                background: win ? "var(--lime)" : "var(--paper-bright)",
                boxShadow: "5px 5px 0 var(--ink)",
                padding: 24,
                position: "relative",
              }}
            >
              {win && (
                <span
                  style={{
                    ...mono(10, ".12em"),
                    position: "absolute",
                    top: -13,
                    right: 14,
                    background: "var(--ink)",
                    color: "var(--lime)",
                    borderRadius: 4,
                    padding: "4px 9px",
                    transform: "rotate(3deg)",
                  }}
                >
                  {isSwipe ? "Most agreed" : "India's pick"}
                </span>
              )}
              <div style={{ fontWeight: 900, fontSize: 52, letterSpacing: "-.03em", marginBottom: 8 }}>
                {r.pct}%
              </div>
              <div
                style={{
                  fontFamily: "var(--font-editorial)",
                  fontWeight: 600,
                  fontSize: 17,
                  lineHeight: 1.25,
                  marginBottom: 14,
                }}
              >
                {r.label}
              </div>
              <GrowBar
                pct={r.pct}
                fill="var(--ink)"
                track={inkVeil(8)}
                height={11}
                delay={0.2}
                style={{ marginBottom: 10 }}
              />
              {isSwipe && votes && votes[r.key] !== undefined && (
                <span style={{ ...mono(10, ".1em"), fontWeight: 700 }}>
                  you said: {votes[r.key]}
                </span>
              )}
              {!isSwipe && yourSide && (
                <span style={{ ...mono(10, ".1em"), fontWeight: 700 }}>← Your side</span>
              )}
            </motion.div>
          );
        })}
      </div>
      <SampleLine n={result.sample_n} />
    </div>
  );
}

export const splitDefinition: DvDefinition = {
  id: "split",
  family: "split",
  label: "Split cards",
  supportedModes: [...PICK_MODES, "swipe_stack"],
  Component: Split,
};

export default Split;
