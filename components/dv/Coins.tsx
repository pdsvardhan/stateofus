"use client";
/**
 * Liquid coins — feat-dv-engine.
 *
 * The v5 coin row: one circle per card filling with lime over a fire-tint
 * track (fill level = agreement), slosh wave gated by reduced-motion,
 * “you: yes/no” verdicts under each coin.
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { PICK_MODES, shareRowsFor, yourPick, yourVotes } from "@/lib/dv/transforms";
import { paperVeil } from "@/lib/dv/palette";
import {
  Caption,
  FLOOD_EASE,
  LiquidWave,
  Plate,
  SampleLine,
  YouTag,
  mono,
  useMotionPrefs,
} from "./chrome";
import StillCounting from "./StillCounting";

function Coins({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const isSwipe = question.mode === "swipe_stack";
  const rows = shareRowsFor(question.mode, result.aggregate, question.options);
  const youKey = yourPick(result.your_payload);
  const votes = yourVotes(result.your_payload);

  return (
    <Plate>
      <Caption style={{ marginBottom: 18 }}>
        {isSwipe
          ? "% of India saying yes · fill level = agreement"
          : "Share of the vote, coin by coin"}
      </Caption>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
        {rows.map((r, i) => {
          const youSaid = isSwipe ? votes?.[r.key] : undefined;
          return (
            <div
              key={r.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                width: 126,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 98,
                  height: 98,
                  border: "2.5px solid var(--ink)",
                  borderRadius: "50%",
                  background: "var(--fire-tint)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={prefs.reduced ? false : { height: 0 }}
                  animate={{ height: `${Math.max(8, Math.min(100, r.pct))}%` }}
                  transition={{
                    duration: prefs.dur(0.7),
                    delay: prefs.delay(i * 0.12),
                    ease: FLOOD_EASE,
                  }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "var(--lime)",
                  }}
                >
                  <LiquidWave size="small" tint={paperVeil(50)} />
                </motion.div>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 19,
                  }}
                >
                  {r.pct}%
                </span>
              </div>
              <span style={{ fontWeight: 600, fontSize: 11.5, textAlign: "center", lineHeight: 1.2 }}>
                {r.label}
              </span>
              {isSwipe && youSaid !== undefined && (
                <span
                  style={{
                    ...mono(10, ".06em"),
                    color: youSaid === "yes" ? "var(--agree)" : "var(--fire)",
                    fontWeight: 700,
                  }}
                >
                  you: {youSaid}
                </span>
              )}
              {!isSwipe && youKey === r.key && <YouTag />}
            </div>
          );
        })}
      </div>
      <SampleLine n={result.sample_n} />
    </Plate>
  );
}

export const coinsDefinition: DvDefinition = {
  id: "coins",
  family: "split",
  label: "Liquid coins",
  supportedModes: [...PICK_MODES, "swipe_stack"],
  Component: Coins,
};

export default Coins;
