"use client";
/**
 * S3 Liquid fill (verdict bars) — feat-dv-engine.
 *
 * The v5 verdict bars: lime fill over a fire-tint track, the % stamped at
 * the left lip, “you: yes/no” verdicts per card for swipe stacks and the
 * YOU tag for pick modes.
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { PICK_MODES, shareRowsFor, yourPick, yourVotes } from "@/lib/dv/transforms";
import { Caption, EASE, Plate, Rise, SampleLine, YouTag, mono, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

function Liquid({ question, result }: DvProps) {
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
      <Caption style={{ marginBottom: 16 }}>
        {isSwipe ? (
          <>
            % of India saying{" "}
            <span style={{ color: "var(--agree)", fontWeight: 700 }}>yes</span>
          </>
        ) : (
          "% of India picking it"
        )}
      </Caption>
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {rows.map((r, i) => {
          const youSaid = isSwipe ? votes?.[r.key] : undefined;
          return (
            <Rise key={r.key} delay={0.08 + i * 0.1}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 5,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14.5 }}>{r.label}</span>
                {isSwipe && youSaid !== undefined && (
                  <span
                    style={{
                      ...mono(10, ".08em"),
                      color: youSaid === "yes" ? "var(--agree)" : "var(--fire)",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    you: {youSaid === "yes" ? (question.swipe_yes_label ?? "yes") : (question.swipe_no_label ?? "no")}
                  </span>
                )}
                {!isSwipe && youKey === r.key && <YouTag />}
              </div>
              <div
                style={{
                  position: "relative",
                  height: 28,
                  border: "2px solid var(--ink)",
                  borderRadius: 100,
                  background: "var(--fire-tint)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={prefs.reduced ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: prefs.dur(0.9),
                    delay: prefs.delay(0.08 + i * 0.1),
                    ease: EASE,
                  }}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.max(0, Math.min(100, r.pct))}%`,
                    background: "var(--lime)",
                    borderRight: "2px solid var(--ink)",
                    transformOrigin: "left",
                  }}
                />
                <span
                  style={{
                    ...mono(11, ".02em"),
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontWeight: 700,
                  }}
                >
                  {r.pct}%
                </span>
              </div>
            </Rise>
          );
        })}
      </div>
      <SampleLine n={result.sample_n} />
    </Plate>
  );
}

export const liquidDefinition: DvDefinition = {
  id: "liquid",
  family: "split",
  label: "Verdict bars",
  supportedModes: [...PICK_MODES, "swipe_stack"],
  Component: Liquid,
};

export default Liquid;
