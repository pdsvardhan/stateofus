"use client";
/**
 * R3 Podium — feat-dv-engine.
 *
 * The v5 ceremony: silver–gold–bronze columns flooding up in sequence, the
 * gold pill stamping down “India's pick” (cwStamp), YOU tag over the
 * reader's column, the fourth place named in the footnote.
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { PICK_MODES, standingsFor, yourTopPick } from "@/lib/dv/transforms";
import { PODIUM_STEPS } from "@/lib/dv/palette";
import { Caption, EASE, FLOOD_EASE, Plate, SampleLine, YouTag, mono, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

function Podium({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const { rows, caption } = standingsFor(question.mode, result.aggregate, question.options);
  const youKey = yourTopPick(question.mode, result.your_payload);
  const order = rows
    .map((_, i) => i)
    .sort((a, b) => rows[b].pct - rows[a].pct || a - b);
  const top3 = order.slice(0, 3);
  // silver, gold, bronze — 2nd | 1st | 3rd, the prototype arrangement
  const arrange = [top3[1], top3[0], top3[2]].filter((i): i is number => i !== undefined);
  const fourth = order[3];

  return (
    <Plate>
      <Caption style={{ marginBottom: 6 }}>
        The national podium · top three answers · {caption}
      </Caption>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          height: 320,
          padding: "10px 10px 0",
        }}
      >
        {arrange.map((idx) => {
          const rk = top3.indexOf(idx) + 1;
          const step = PODIUM_STEPS[rk - 1];
          const row = rows[idx];
          const floodDelay = 0.15 + (rk - 1) * 0.3;
          return (
            <div
              key={row.key}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 9,
                height: "100%",
                minWidth: 0,
              }}
            >
              {rk === 1 && (
                <motion.span
                  initial={prefs.reduced ? false : { opacity: 0, scale: 2.6, rotate: -18 }}
                  animate={
                    prefs.reduced
                      ? { opacity: 1, scale: 1, rotate: -8 }
                      : {
                          opacity: [0, 1, 1, 1],
                          scale: [2.6, 0.92, 1.05, 1],
                          rotate: [-18, -8, -8, -8],
                        }
                  }
                  transition={{
                    duration: prefs.dur(0.5),
                    delay: prefs.delay(1.1),
                    times: [0, 0.55, 0.75, 1],
                    ease: EASE,
                  }}
                  style={{
                    ...mono(10, ".1em"),
                    background: "var(--gold)",
                    border: "1.5px solid var(--ink)",
                    borderRadius: 100,
                    padding: "4px 10px",
                    fontWeight: 700,
                  }}
                >
                  India's pick
                </motion.span>
              )}
              <motion.span
                initial={prefs.reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: prefs.dur(0.4), delay: prefs.delay(0.5 + (rk - 1) * 0.3) }}
                style={{
                  fontWeight: 700,
                  fontSize: 13.5,
                  textAlign: "center",
                  lineHeight: 1.15,
                }}
              >
                {row.label}
              </motion.span>
              {youKey === row.key && <YouTag />}
              <motion.div
                initial={prefs.reduced ? false : { height: 0 }}
                animate={{ height: `${Math.min(100, 26 + row.pct * 1.7)}%` }}
                transition={{
                  duration: prefs.dur(0.85),
                  delay: prefs.delay(floodDelay),
                  ease: FLOOD_EASE,
                }}
                style={{
                  width: "100%",
                  background: step.bg,
                  border: "2px solid var(--ink)",
                  borderBottom: "none",
                  borderRadius: "10px 10px 0 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontWeight: 900,
                    fontStyle: "italic",
                    fontSize: 30,
                    color: step.fg,
                  }}
                >
                  {rk}
                </span>
                <span style={{ ...mono(12, ".02em"), fontWeight: 700, color: step.fg }}>
                  {row.pct}%
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          borderTop: "2px solid var(--ink)",
          paddingTop: 12,
          ...mono(10, ".1em"),
          color: "var(--muted)",
        }}
      >
        {fourth !== undefined
          ? `Off the podium: ${rows[fourth].label} — ${rows[fourth].pct}%`
          : "Every answer made the podium"}
      </div>
      <SampleLine n={result.sample_n} />
    </Plate>
  );
}

export const podiumDefinition: DvDefinition = {
  id: "podium",
  family: "rank",
  label: "Podium",
  supportedModes: ["podium_slots", "rank_order", ...PICK_MODES],
  Component: Podium,
};

export default Podium;
