"use client";
/**
 * G1 India winner map — feat-dv-engine.
 *
 * Real @svg-maps/india boundaries, MAPA brand-ink winner fills (the locked
 * default; DECISIONS 2026-06-12). States below the per-state confidence
 * floor stay cream and the legend carries the "no clear winner yet" chip
 * (CA-007) — trust visible, never fake certainty.
 *
 * v5 fidelity (lines 776-788): plate max-width 520 centred; a top caption,
 * pill legend chips carrying each option's national % + a YOU tag on the
 * reader's pick, and a bottom footnote.
 */
import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import type { QuestionOption } from "@/lib/types";
import { INDIA_VIEWBOX, locationForState, matchStateKey } from "@/lib/dv/india";
import { mapGradientStops, mapInk } from "@/lib/dv/palette";
import { PICK_MODES, pickShares, shareRowsFor, formatCount, yourPick, yourRegion } from "@/lib/dv/transforms";
import { IndiaPaths, useCentroids } from "./india-base";
import { Caption, EASE, Plate, SampleLine, mono, useMotionPrefs } from "./chrome";

/** a state needs this many answers before we call a winner (CA-007) */
const STATE_FLOOR_N = 3;

function WinnerMap({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const centroids = useCentroids(svgRef);
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

  // national vote share per option (legend %) + the reader's own pick (YOU tag)
  const nationalPct = useMemo(() => {
    const rows = shareRowsFor(
      question.mode,
      (result.aggregate ?? {}) as Record<string, unknown>,
      question.options
    );
    return new Map(rows.map((r) => [r.key, r.pct]));
  }, [question.mode, question.options, result.aggregate]);
  const youKey = yourPick(result.your_payload ?? null);

  return (
    <Plate>
      <motion.div
        initial={prefs.reduced ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column" }}
      >
        <Caption style={{ marginBottom: 10 }}>The winning answer, state by state</Caption>
        <svg
          ref={svgRef}
          viewBox={INDIA_VIEWBOX}
          role="img"
          aria-label="Winning answer by state"
          style={{ width: "100%", height: "auto", maxHeight: 480, order: 2 }}
        >
          <IndiaPaths
            fillFor={(name) => {
              const idx = winnerByLocation(name);
              return idx === null ? "var(--paper-edge)" : mapInk(idx);
            }}
          />
          {/* FIX 5 — abbreviated labels on states big enough to fit one + that
              have a winner; every state still names-on-hover via IndiaPaths <title>. */}
          {centroids &&
            Object.entries(centroids).map(([name, c]) => {
              const idx = winnerByLocation(name);
              if (idx === null || c.w < 26) return null;
              return (
                <text
                  key={`lbl-${name}`}
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  style={{ fontFamily: "var(--font-label)", fontSize: 8, fontWeight: 700, pointerEvents: "none" }}
                  fill={idx === 1 ? "var(--paper)" : "var(--ink)"}
                >
                  {name.slice(0, 3).toUpperCase()}
                </text>
              );
            })}
        </svg>

        {/* legend — pill chips: swatch + label + national % + YOU tag */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, order: 1 }}>
          {question.options.map((o, i) =>
            presentOptions.has(i) ? (
              <span
                key={o.key}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 12.5,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: "2px solid var(--ink)",
                  borderRadius: 100,
                  padding: "6px 12px",
                  background: o.key === youKey ? "var(--lime)" : "var(--paper-bright)",
                  color: "var(--ink)",
                }}
              >
                <span
                  aria-hidden
                  style={{ width: 12, height: 12, borderRadius: 4, background: mapInk(i), border: "1px solid var(--ink)" }}
                />
                {o.label}
                {nationalPct.has(o.key) && (
                  <strong style={{ fontWeight: 700 }}>{nationalPct.get(o.key)}%</strong>
                )}
                {o.key === youKey && (
                  <span
                    style={{
                      ...mono(8),
                      fontWeight: 700,
                      border: "1.5px solid var(--ink)",
                      borderRadius: 100,
                      padding: "1px 6px",
                      background: "var(--ink)",
                      color: "var(--lime)",
                    }}
                  >
                    YOU
                  </span>
                )}
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
                borderRadius: 100,
                padding: "3px 11px",
                background: "var(--paper-edge)",
                color: "var(--ink-soft)",
              }}
            >
              <span
                aria-hidden
                style={{ width: 12, height: 12, borderRadius: 4, background: "var(--paper-edge)", border: "1px dashed var(--muted)" }}
              />
              no clear winner yet
            </span>
          )}
        </div>

        <Caption style={{ marginTop: 8, order: 3 }}>
          State colour = its winning answer · real boundaries, house inks
        </Caption>

        {result.your_region?.state && (
          <Caption style={{ marginTop: 4, order: 4 }}>
            counting you in {result.your_region.state}
            {states[result.your_region.state]
              ? ` · ${formatCount(states[result.your_region.state].sample_n)} counted there`
              : ""}
          </Caption>
        )}
        <SampleLine n={result.sample_n} style={{ order: 5 }} />
      </motion.div>
    </Plate>
  );
}

/**
 * pin_map view — here the question's OPTIONS are regions, and the overall
 * aggregate counts are votes-per-region. Each option is matched to an India
 * location (by label) and filled with intensity = its national share, so the
 * map reads as "where India pins itself". Regions that can't be matched to a
 * boundary still appear in the legend with their %, so no vote is hidden.
 */
function PinMap({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  const youKey = yourRegion(result.your_payload ?? null);

  const rows = useMemo(
    () => pickShares((result.aggregate ?? {}) as Record<string, unknown>, question.options),
    [question.options, result.aggregate]
  );
  const pctByKey = useMemo(() => new Map(rows.map((r) => [r.key, r.pct])), [rows]);
  const maxPct = useMemo(() => rows.reduce((m, r) => Math.max(m, r.pct), 0), [rows]);

  // option label → India location name (when it matches a real boundary)
  const locationByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of question.options) {
      const loc = locationForState(o.label);
      if (loc) map.set(o.key, loc.name);
    }
    return map;
  }, [question.options]);
  // reverse: location name → option key (first match wins)
  const keyByLocation = useMemo(() => {
    const map = new Map<string, string>();
    for (const [key, name] of locationByKey) if (!map.has(name)) map.set(name, key);
    return map;
  }, [locationByKey]);

  const stops = mapGradientStops("var(--fire)");
  const fillFor = (locationName: string): string => {
    const key = keyByLocation.get(locationName);
    if (!key) return "var(--paper-edge)";
    const pct = pctByKey.get(key) ?? 0;
    if (maxPct <= 0) return "var(--paper-edge)";
    const t = Math.max(0.12, pct / maxPct); // floor so a pinned region is always visible
    return `color-mix(in srgb, ${stops.to} ${Math.round(t * 100)}%, ${stops.from})`;
  };

  return (
    <Plate>
      <motion.div
        initial={prefs.reduced ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column" }}
      >
        <Caption style={{ marginBottom: 10 }}>Where India pins itself · darker = more votes</Caption>
        <svg
          viewBox={INDIA_VIEWBOX}
          role="img"
          aria-label="Votes by region"
          style={{ width: "100%", height: "auto", maxHeight: 480, order: 2 }}
        >
          <IndiaPaths
            fillFor={fillFor}
            titleFor={(name) => {
              const key = keyByLocation.get(name);
              return key ? `${name} · ${pctByKey.get(key) ?? 0}%` : name;
            }}
          />
        </svg>

        {/* legend — every region option with its national %, YOU on the reader's pin */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, order: 1 }}>
          {rows
            .slice()
            .sort((a, b) => b.pct - a.pct)
            .map((r) => (
              <span
                key={r.key}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 12.5,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: "2px solid var(--ink)",
                  borderRadius: 100,
                  padding: "6px 12px",
                  background: r.key === youKey ? "var(--lime)" : "var(--paper-bright)",
                  color: "var(--ink)",
                }}
              >
                {r.label}
                <strong>{r.pct}%</strong>
                {!locationByKey.has(r.key) && (
                  <span style={{ ...mono(8), color: "var(--muted)" }}>off-map</span>
                )}
                {r.key === youKey && (
                  <span
                    style={{
                      ...mono(8),
                      fontWeight: 700,
                      border: "1.5px solid var(--ink)",
                      borderRadius: 100,
                      padding: "1px 6px",
                      background: "var(--ink)",
                      color: "var(--lime)",
                    }}
                  >
                    YOU
                  </span>
                )}
              </span>
            ))}
        </div>

        <Caption style={{ marginTop: 8, order: 3 }}>
          Region colour = its share of all pins · real boundaries, house inks
        </Caption>
        <SampleLine n={result.sample_n} style={{ order: 5 }} />
      </motion.div>
    </Plate>
  );
}

function MapDv(props: DvProps) {
  const { question, result } = props;
  if (result.still_counting || !result.aggregate) {
    // WinnerMap/PinMap both surface the count; still-counting is handled by the
    // switcher upstream, but guard here too for direct renders.
    return <WinnerMap {...props} />;
  }
  return question.mode === "pin_map" ? <PinMap {...props} /> : <WinnerMap {...props} />;
}

export const mapDefinition: DvDefinition = {
  id: "map",
  family: "geo",
  // PICK_MODES now includes pin_map; swipe_stack rounds out the winner-map set.
  supportedModes: [...PICK_MODES, "swipe_stack"],
  Component: MapDv,
  label: "Winner map",
};

export default MapDv;
