"use client";
/**
 * G1 India winner map — feat-dv-engine.
 *
 * Real @svg-maps/india boundaries, MAPA brand-ink winner fills (the locked
 * default; DECISIONS 2026-06-12). States below the per-state confidence
 * floor stay cream and the legend carries the "no clear winner yet" chip
 * (CA-007) — trust visible, never fake certainty.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import type { QuestionOption } from "@/lib/types";
import { INDIA_VIEWBOX, matchStateKey } from "@/lib/dv/india";
import { mapInk } from "@/lib/dv/palette";
import { PICK_MODES, shareRowsFor, formatCount } from "@/lib/dv/transforms";
import { IndiaPaths } from "./india-base";
import { Caption, EASE, Plate, SampleLine, mono, useMotionPrefs } from "./chrome";

/** a state needs this many answers before we call a winner (CA-007) */
const STATE_FLOOR_N = 3;

function MapDv({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  const states = result.state_aggregates ?? {};
  const stateKeys = Object.keys(states);

  const { winnerByLocation, presentOptions, hasCream } = useMemo(() => {
    const winners = new Map<string, number>(); // location name → option idx
    const present = new Set<number>();
    let cream = false;
    // resolved lazily per location via matchStateKey
    return {
      winnerByLocation: (locationName: string): number | null => {
        if (winners.has(locationName)) return winners.get(locationName)!;
        const key = matchStateKey(locationName, stateKeys);
        const entry = key ? states[key] : null;
        if (!entry || entry.sample_n < STATE_FLOOR_N) {
          cream = true;
          return null;
        }
        const rows = shareRowsFor(
          question.mode,
          entry.agg as Record<string, unknown>,
          question.options
        );
        // shareRowsFor returns rows in OPTIONS order, not sorted — pick the
        // actual winner by max count, else every state painted Option A.
        const winner = rows.reduce(
          (best, r) => (r.count > best.count ? r : best),
          rows[0] ?? { key: "", count: 0, label: "", pct: 0 }
        );
        if (!winner || winner.count === 0) {
          cream = true;
          return null;
        }
        const idx = question.options.findIndex((o: QuestionOption) => o.key === winner.key);
        winners.set(locationName, idx);
        present.add(idx);
        return idx;
      },
      presentOptions: present,
      hasCream: () => cream,
    };
  }, [states, stateKeys, question.mode, question.options]);

  return (
    <Plate>
      <motion.div
        initial={prefs.reduced ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <svg
          viewBox={INDIA_VIEWBOX}
          role="img"
          aria-label="Winning answer by state"
          style={{ width: "100%", height: "auto", maxHeight: 420 }}
        >
          <IndiaPaths
            fillFor={(name) => {
              const idx = winnerByLocation(name);
              return idx === null ? "var(--paper-edge)" : mapInk(idx);
            }}
          />
        </svg>

        {/* legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {question.options.map((o, i) =>
            presentOptions.has(i) ? (
              <span
                key={o.key}
                style={{
                  ...mono(10),
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: "2px solid var(--ink)",
                  padding: "3px 8px",
                  background: "var(--paper-bright)",
                  color: "var(--ink)",
                }}
              >
                <span
                  aria-hidden
                  style={{ width: 12, height: 12, background: mapInk(i), border: "1px solid var(--ink)" }}
                />
                {o.label}
              </span>
            ) : null
          )}
          {hasCream() && (
            <span
              style={{
                ...mono(10),
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "2px dashed var(--muted)",
                padding: "3px 8px",
                background: "var(--paper-edge)",
                color: "var(--ink-soft)",
              }}
            >
              <span
                aria-hidden
                style={{ width: 12, height: 12, background: "var(--paper-edge)", border: "1px dashed var(--muted)" }}
              />
              no clear winner yet
            </span>
          )}
        </div>

        {result.your_region?.state && (
          <Caption style={{ marginTop: 8 }}>
            counting you in {result.your_region.state}
            {states[result.your_region.state]
              ? ` · ${formatCount(states[result.your_region.state].sample_n)} counted there`
              : ""}
          </Caption>
        )}
        <SampleLine n={result.sample_n} />
      </motion.div>
    </Plate>
  );
}

export const mapDefinition: DvDefinition = {
  id: "map",
  family: "geo",
  label: "Winner map",
  supportedModes: [...PICK_MODES, "swipe_stack"],
  Component: MapDv,
};

export default MapDv;
