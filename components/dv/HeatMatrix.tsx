"use client";
/**
 * Heat matrix — feat-dv-engine.
 *
 * The v5 grid: items × tiers, every cell the % of India filing that item
 * there, colored on the multi-stop house ramp (paper-bright → gold → fire
 * → ink, per design DECISIONS — never flat single-color). Cells pop in on
 * a diagonal stagger; a lime ring marks where the reader filed it.
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { placementRows, yourPlacements } from "@/lib/dv/transforms";
import { HEAT_LEGEND_GRADIENT, heatSwatch } from "@/lib/dv/palette";
import { Caption, EASE, Plate, SampleLine, mono, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

function HeatMatrix({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const targets = question.targets?.labels ?? [];
  const rows = placementRows(result.aggregate, question.options, targets);
  const yours = yourPlacements(result.your_payload);

  // normalize the ramp to this board's range so the hottest cell hits ink
  const all = rows.flatMap((r) => r.pctPerTarget);
  const min = all.length > 0 ? Math.min(...all) : 0;
  const max = all.length > 0 ? Math.max(...all) : 0;
  const heatT = (v: number) => (max > min ? (v - min) / (max - min) : 0.5);

  const cols = `1.5fr repeat(${Math.max(1, targets.length)}, 1fr)`;

  return (
    <Plate>
      <Caption style={{ marginBottom: 14 }}>
        % of India placing each item in each tier
      </Caption>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 6, marginBottom: 6 }}>
        <span />
        {targets.map((t) => (
          <span
            key={t}
            style={{ ...mono(10, ".08em"), fontWeight: 700, textAlign: "center" }}
          >
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
                    delay: prefs.delay(0.06 * (i * targets.length + j)),
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
          <span style={{ ...mono(10, ".08em"), color: "var(--muted)" }}>
            · lime ring = your filing
          </span>
        )}
      </div>
      <SampleLine n={result.sample_n} />
    </Plate>
  );
}

export const heatmatrixDefinition: DvDefinition = {
  id: "heatmatrix",
  family: "matrix",
  label: "Heat matrix",
  supportedModes: ["bucket_sort", "tier_placement"],
  Component: HeatMatrix,
};

export default HeatMatrix;
