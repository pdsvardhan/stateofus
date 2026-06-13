"use client";
/**
 * R1 Tier board — feat-dv-engine.
 *
 * The v5 consensus board: one plate per tier, each item chip filed where
 * most of India put it, chip fill = share placing it there, “You too” when
 * the reader matched the public. Empty tiers say so out loud.
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { placementRows, yourPlacements } from "@/lib/dv/transforms";
import { tierInk } from "@/lib/dv/palette";
import { Caption, EASE, Rise, SampleLine, YouTag, mono, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

function Tier({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const targets = question.targets?.labels ?? [];
  const rows = placementRows(result.aggregate, question.options, targets);
  const yours = yourPlacements(result.your_payload);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      {targets.map((t, ti) => {
        const chips = rows
          .map((r, ri) => ({ ...r, ri }))
          .filter((r) => r.total > 0 && r.consensusIdx === ti);
        return (
          <Rise key={t} delay={ti * 0.12} duration={0.5}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(110px, 150px) 1fr",
                border: "2px solid var(--ink)",
                borderRadius: 12,
                background: "var(--paper-bright)",
                overflow: "hidden",
                boxShadow: "5px 5px 0 color-mix(in srgb, var(--ink) 18%, transparent)",
              }}
            >
              <div
                style={{
                  background: tierInk(ti),
                  borderRight: "2px solid var(--ink)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "18px 10px",
                }}
              >
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: 15,
                    textTransform: "uppercase",
                    lineHeight: 1,
                    textAlign: "center",
                    letterSpacing: "-.01em",
                  }}
                >
                  {t}
                </span>
              </div>
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 9,
                  alignItems: "center",
                  minHeight: 88,
                }}
              >
                {chips.map((ch) => {
                  const youToo = yours?.[ch.key] === t;
                  return (
                    <motion.span
                      key={ch.key}
                      initial={prefs.reduced ? false : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: prefs.dur(0.35),
                        delay: prefs.delay(0.15 + ch.ri * 0.08),
                        ease: EASE,
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        border: "2px solid var(--ink)",
                        borderRadius: 100,
                        padding: "10px 15px",
                        fontWeight: 700,
                        fontSize: 14.5,
                        background: `linear-gradient(90deg, ${tierInk(ti)} ${ch.consensusPct}%, var(--paper) ${ch.consensusPct}%)`,
                      }}
                    >
                      {ch.label}
                      <span style={{ ...mono(10.5, ".02em"), fontWeight: 700 }}>
                        {ch.consensusPct}%
                      </span>
                      {youToo && <YouTag label="You too" />}
                    </motion.span>
                  );
                })}
                {chips.length === 0 && (
                  <span style={{ ...mono(10, ".1em"), color: "var(--muted-warm)" }}>
                    nothing landed here
                  </span>
                )}
              </div>
            </div>
          </Rise>
        );
      })}
      <Caption>
        Chip fill = share of India placing it there · “You too” = you matched the public
      </Caption>
      <SampleLine n={result.sample_n} style={{ marginTop: 0 }} />
    </div>
  );
}

export const tierDefinition: DvDefinition = {
  id: "tier",
  family: "rank",
  label: "Tier board",
  supportedModes: ["bucket_sort", "tier_placement"],
  Component: Tier,
};

export default Tier;
