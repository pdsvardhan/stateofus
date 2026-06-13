"use client";
/**
 * P1 Treemap — feat-dv-engine.
 *
 * The v5 mosaic: the recursive halving layout, each block flooding with its
 * rank color from the bottom (smallest first, the leader lands last), label
 * + % fading in after the flood. Pick modes size blocks by vote share; sort
 * modes size by share of placements in the final target (the v5 “first on
 * the chopping block” read).
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import {
  PICK_MODES,
  pickShares,
  placementRows,
  roundedShares,
  treemapRects,
  yourPick,
  yourPlacements,
} from "@/lib/dv/transforms";
import { rankSwatch } from "@/lib/dv/palette";
import { Caption, FLOOD_EASE, Plate, SampleLine, YouTag, mono, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

function Treemap({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const isPlacement = question.mode === "bucket_sort" || question.mode === "tier_placement";
  const targets = question.targets?.labels ?? [];
  const lastTarget = targets[targets.length - 1] ?? "";

  let items: { key: string; label: string; pct: number }[];
  let caption: string;
  let youKeys: Set<string>;

  if (isPlacement) {
    const placed = placementRows(result.aggregate, question.options, targets);
    const lastCounts = placed.map((r) => r.perTarget[targets.length - 1] ?? 0);
    const pcts = roundedShares(lastCounts);
    items = placed.map((r, i) => ({ key: r.key, label: r.label, pct: pcts[i] }));
    caption = `Share of “${lastTarget}” placements · bigger block = more of India filed it there`;
    const yours = yourPlacements(result.your_payload);
    youKeys = new Set(
      yours ? Object.keys(yours).filter((k) => yours[k] === lastTarget) : []
    );
  } else {
    items = pickShares(result.aggregate, question.options);
    caption = "Share of the national vote · bigger block = more of India";
    const you = yourPick(result.your_payload);
    youKeys = new Set(you ? [you] : []);
  }

  const rects = treemapRects(items);
  const sortedPcts = rects
    .map((r) => r.pct)
    .slice()
    .sort((a, b) => b - a);
  const n = rects.length;

  return (
    <Plate>
      <Caption style={{ marginBottom: 14 }}>{caption}</Caption>
      <div
        style={{
          position: "relative",
          height: 320,
          border: "2px solid var(--ink)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {rects.map((r) => {
          const rank = sortedPcts.indexOf(r.pct);
          const swatch = rankSwatch(rank);
          const delay = 0.1 + (n - 1 - rank) * 0.22;
          const big = r.w * r.h > 800;
          return (
            <div
              key={r.key}
              style={{
                position: "absolute",
                left: `${r.x}%`,
                top: `${r.y}%`,
                width: `${r.w}%`,
                height: `${r.h}%`,
                background: "var(--paper-edge)",
                border: "1.5px solid var(--ink)",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={prefs.reduced ? false : { height: 0 }}
                animate={{ height: "100%" }}
                transition={{
                  duration: prefs.dur(0.7),
                  delay: prefs.delay(delay),
                  ease: FLOOD_EASE,
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: swatch.bg,
                }}
              />
              <motion.div
                initial={prefs.reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: prefs.dur(0.5), delay: prefs.delay(delay + 0.7) }}
                style={{
                  position: "relative",
                  height: "100%",
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: big ? 18 : 13,
                    lineHeight: 1.1,
                    color: swatch.fg,
                  }}
                >
                  {r.label}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ ...mono(11, ".02em"), fontWeight: 700, color: swatch.fg }}>
                    {r.pct}%
                  </span>
                  {youKeys.has(r.key) && (
                    <YouTag label={isPlacement ? "You too" : "You"} />
                  )}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
      <SampleLine n={result.sample_n} />
    </Plate>
  );
}

export const treemapDefinition: DvDefinition = {
  id: "treemap",
  family: "proportion",
  label: "Treemap",
  supportedModes: [...PICK_MODES, "bucket_sort", "tier_placement"],
  Component: Treemap,
};

export default Treemap;
