"use client";
/**
 * Heat matrix — feat-dv-engine.
 *
 * Two layouts, one renderer:
 *  - bucket_sort / tier_placement: the v5 items × tiers grid, every cell the
 *    % of India filing that item there, colored on the multi-stop house ramp
 *    (paper-bright → gold → fire → ink). Cells pop in on a diagonal stagger;
 *    a lime ring marks where the reader filed it.
 *  - two_axis: a 2×2 quadrant board (place shape, quadrant targets q1..q4).
 *    Cells = the four quadrants, heated by share of all placements, axis ends
 *    labelled from question.targets ([xLow,xHigh,yLow,yHigh]) or sensible
 *    defaults; the reader's own placements show as lime-ringed chips.
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import type { QuestionPublic } from "@/lib/types";
import { placementRows, quadrantCells, yourPlacements, type Quadrant } from "@/lib/dv/transforms";
import { HEAT_LEGEND_GRADIENT, heatSwatch } from "@/lib/dv/palette";
import { Caption, EASE, Plate, SampleLine, mono, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

/* ---- items × tiers (bucket_sort / tier_placement) ---- */
function MatrixGrid({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  const targets = question.targets?.labels ?? [];
  const rows = placementRows(result.aggregate!, question.options, targets);
  const yours = yourPlacements(result.your_payload);

  const all = rows.flatMap((r) => r.pctPerTarget);
  const min = all.length > 0 ? Math.min(...all) : 0;
  const max = all.length > 0 ? Math.max(...all) : 0;
  const heatT = (v: number) => (max > min ? (v - min) / (max - min) : 0.5);

  const cols = `1.5fr repeat(${Math.max(1, targets.length)}, 1fr)`;

  return (
    <>
      <Caption style={{ marginBottom: 14 }}>% of India placing each item in each tier</Caption>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 6, marginBottom: 6 }}>
        <span />
        {targets.map((t) => (
          <span key={t} style={{ ...mono(10, ".08em"), fontWeight: 700, textAlign: "center" }}>
            {t}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((r, i) => (
          <div
            key={r.key}
            style={{ display: "grid", gridTemplateColumns: cols, gap: 6, alignItems: "stretch" }}
          >
            <span style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center" }}>
              {r.label}
            </span>
            {r.pctPerTarget.map((v, j) => {
              const sw = heatSwatch(heatT(v));
              const isYou = yours?.[r.key] === targets[j];
              return (
                <motion.span
                  key={targets[j]}
                  initial={prefs.reduced ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: prefs.dur(0.35),
                    delay: prefs.delay(0.04 * (i * targets.length + j)),
                    ease: EASE,
                  }}
                  style={{
                    border: "1.5px solid var(--ink)",
                    borderRadius: 7,
                    background: sw.bg,
                    color: sw.fg,
                    ...mono(12, ".02em"),
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 46,
                    boxShadow: isYou ? "0 0 0 2.5px var(--lime)" : "none",
                  }}
                >
                  {v}%
                </motion.span>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <span style={{ ...mono(10, ".08em"), color: "var(--muted)" }}>cooler</span>
        <span
          style={{
            flex: 1,
            maxWidth: 190,
            height: 10,
            border: "1.5px solid var(--ink)",
            borderRadius: 100,
            background: HEAT_LEGEND_GRADIENT,
          }}
        />
        <span style={{ ...mono(10, ".08em"), color: "var(--muted)" }}>hotter</span>
        {yours && (
          <span style={{ ...mono(10, ".08em"), color: "var(--muted)" }}>· lime ring = your filing</span>
        )}
      </div>
    </>
  );
}

/* ---- two_axis quadrant board ---- */
/** Axis labels: question.targets.labels read as [xLow, xHigh, yLow, yHigh];
 *  missing entries fall back to the design defaults (boring/fun × useful/useless). */
function axisLabels(q: QuestionPublic): { xLow: string; xHigh: string; yLow: string; yHigh: string } {
  const t = q.targets?.labels ?? [];
  return {
    xLow: t[0] ?? "Boring",
    xHigh: t[1] ?? "Fun",
    yLow: t[2] ?? "Useful",
    yHigh: t[3] ?? "Useless",
  };
}

// quadrant id → grid position (matches QUADRANTS reading order in transforms +
// the TwoAxis interaction): q1 TL, q2 TR, q3 BL, q4 BR.
const QUAD_POS: Record<Quadrant, { row: 0 | 1; col: 0 | 1 }> = {
  q1: { row: 0, col: 0 },
  q2: { row: 0, col: 1 },
  q3: { row: 1, col: 0 },
  q4: { row: 1, col: 1 },
};

function QuadrantGrid({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  const cells = quadrantCells(result.aggregate!, question.options);
  const labels = axisLabels(question);
  const yours = yourPlacements(result.your_payload);

  const pcts = cells.map((c) => c.pct);
  const max = pcts.length > 0 ? Math.max(...pcts) : 0;
  const heatT = (v: number) => (max > 0 ? v / max : 0.5);
  const cellByPos = (row: 0 | 1, col: 0 | 1) =>
    cells.find((c) => QUAD_POS[c.quadrant].row === row && QUAD_POS[c.quadrant].col === col)!;

  return (
    <>
      <Caption style={{ marginBottom: 14 }}>Where India places each — {labels.xLow} ↔ {labels.xHigh}</Caption>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, alignItems: "center" }}>
        {/* y-axis high label (top) spanning the cell columns */}
        <span />
        <span style={{ ...mono(10, ".08em"), fontWeight: 700, textAlign: "center", color: "var(--muted)" }}>
          ↑ {labels.yLow}
        </span>

        {/* left y-axis label rotated + the 2×2 grid */}
        <span
          style={{
            ...mono(10, ".08em"),
            fontWeight: 700,
            color: "var(--muted)",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            textAlign: "center",
          }}
        >
          {labels.xLow} ↔ {labels.xHigh}
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 6 }}>
          {([0, 1] as const).flatMap((row) =>
            ([0, 1] as const).map((col) => {
              const cell = cellByPos(row, col);
              const sw = heatSwatch(heatT(cell.pct));
              const yourHere = yours
                ? question.options.filter((o) => yours[o.key] === cell.quadrant)
                : [];
              const idx = row * 2 + col;
              return (
                <motion.div
                  key={cell.quadrant}
                  initial={prefs.reduced ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: prefs.dur(0.35), delay: prefs.delay(0.06 * idx), ease: EASE }}
                  style={{
                    border: "1.5px solid var(--ink)",
                    borderRadius: 9,
                    background: sw.bg,
                    color: sw.fg,
                    minHeight: 104,
                    padding: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    boxShadow: yourHere.length > 0 ? "0 0 0 2.5px var(--lime)" : "none",
                  }}
                >
                  <span style={{ ...mono(13, ".02em"), fontWeight: 700 }}>{cell.pct}%</span>
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {cell.items.slice(0, 4).map((it) => (
                      <span
                        key={it.key}
                        style={{
                          ...mono(9.5, ".02em"),
                          fontWeight: 700,
                          background: "color-mix(in srgb, var(--paper) 78%, transparent)",
                          color: "var(--ink)",
                          border: "1px solid var(--ink)",
                          borderRadius: 100,
                          padding: "1px 7px",
                        }}
                      >
                        {it.label} · {it.count}
                      </span>
                    ))}
                  </span>
                </motion.div>
              );
            })
          )}
        </div>

        {/* y-axis low label (bottom) */}
        <span />
        <span style={{ ...mono(10, ".08em"), fontWeight: 700, textAlign: "center", color: "var(--muted)" }}>
          {labels.yHigh} ↓
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <span style={{ ...mono(10, ".08em"), color: "var(--muted)" }}>fewer</span>
        <span
          style={{
            flex: 1,
            maxWidth: 190,
            height: 10,
            border: "1.5px solid var(--ink)",
            borderRadius: 100,
            background: HEAT_LEGEND_GRADIENT,
          }}
        />
        <span style={{ ...mono(10, ".08em"), color: "var(--muted)" }}>more</span>
        {yours && (
          <span style={{ ...mono(10, ".08em"), color: "var(--muted)" }}>· lime ring = your quadrant</span>
        )}
      </div>
    </>
  );
}

function HeatMatrix({ question, result }: DvProps) {
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  return (
    <Plate>
      {question.mode === "two_axis" ? (
        <QuadrantGrid question={question} result={result} dvId="heatmatrix" />
      ) : (
        <MatrixGrid question={question} result={result} dvId="heatmatrix" />
      )}
      <SampleLine n={result.sample_n} />
    </Plate>
  );
}

export const heatmatrixDefinition: DvDefinition = {
  id: "heatmatrix",
  family: "matrix",
  label: "Heat matrix",
  supportedModes: ["bucket_sort", "tier_placement", "two_axis"],
  Component: HeatMatrix,
};

export default HeatMatrix;
