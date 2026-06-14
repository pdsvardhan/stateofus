"use client";
/**
 * Liquid cups — feat-dv-engine.
 *
 * The v5 pour: tall rounded cups flooding up to their share with a rotating
 * slosh wave on the surface (gated by reduced-motion), the % at the lip and
 * the YOU tag floating in the reader's cup.
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { PICK_MODES, shareRowsFor, yourPick, yourVotes } from "@/lib/dv/transforms";
import { CUP_PAL, paperVeil } from "@/lib/dv/palette";
import { Caption, FLOOD_EASE, LiquidWave, Plate, SampleLine, YouTag, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

function Cups({ question, result }: DvProps) {
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
        {isSwipe ? "% saying yes, cup by cup" : "The national pour · % of all votes"}
      </Caption>
      <div
        style={{
          display: "flex",
          gap: 38,
          justifyContent: "center",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        {rows.map((r, i) => {
          const isYou = isSwipe ? votes?.[r.key] === "yes" : youKey === r.key;
          return (
            <div
              key={r.key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}
            >
              <div
                style={{
                  position: "relative",
                  width: 118,
                  height: 168,
                  border: "2.5px solid var(--ink)",
                  borderRadius: "10px 10px 36px 36px",
                  background: "var(--paper)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={prefs.reduced ? false : { height: 0 }}
                  animate={{ height: `${Math.max(0, Math.min(100, r.pct))}%` }}
                  transition={{
                    duration: prefs.dur(1.7),
                    delay: prefs.delay(i * 0.2),
                    ease: FLOOD_EASE,
                  }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: CUP_PAL[i % CUP_PAL.length],
                  }}
                >
                  <LiquidWave size="large" tint={paperVeil(35)} />
                </motion.div>
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 13,
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: 27,
                    color: "var(--ink)",
                  }}
                >
                  {r.pct}%
                </span>
                {isYou && (
                  <YouTag
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: 11,
                      transform: "translateX(-50%)",
                    }}
                  />
                )}
              </div>
              <span style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>
                {r.label}
              </span>
            </div>
          );
        })}
      </div>
      <SampleLine n={result.sample_n} />
    </Plate>
  );
}

export const cupsDefinition: DvDefinition = {
  id: "cups",
  family: "split",
  label: "The cups",
  supportedModes: [...PICK_MODES, "swipe_stack"],
  Component: Cups,
};

export default Cups;
