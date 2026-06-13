"use client";
/**
 * G2 India vote-bubble map — feat-dv-engine.
 *
 * Lime bubbles (the locked default; fire is the alt) sized by each state's
 * counted answers, sitting on cream boundaries at measured centroids —
 * participation geography, a different information shape from the winner
 * map (AC347).
 */
import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { INDIA_VIEWBOX, matchStateKey } from "@/lib/dv/india";
import { MODES } from "@/lib/catalogue/enums";
import { formatCount } from "@/lib/dv/transforms";
import { IndiaPaths, useCentroids } from "./india-base";
import { Caption, EASE, Plate, SampleLine, mono, useMotionPrefs } from "./chrome";

function BubbleMap({ result }: DvProps) {
  const prefs = useMotionPrefs();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const centroids = useCentroids(svgRef);
  const states = result.state_aggregates ?? {};
  const stateKeys = Object.keys(states);

  const bubbles = useMemo(() => {
    if (!centroids) return [];
    const maxN = Math.max(1, ...stateKeys.map((k) => states[k].sample_n));
    const out: { name: string; x: number; y: number; r: number; n: number }[] = [];
    for (const [name, c] of Object.entries(centroids)) {
      const key = matchStateKey(name, stateKeys);
      if (!key) continue;
      const n = states[key].sample_n;
      if (n < 1) continue;
      out.push({
        name: key,
        x: c.x,
        y: c.y,
        r: 4 + 18 * Math.sqrt(n / maxN),
        n,
      });
    }
    return out.sort((a, b) => b.n - a.n);
  }, [centroids, states, stateKeys]);

  return (
    <Plate>
      <svg
        ref={svgRef}
        viewBox={INDIA_VIEWBOX}
        role="img"
        aria-label="Answers counted by state"
        style={{ width: "100%", height: "auto", maxHeight: 420 }}
      >
        <IndiaPaths fillFor={() => "var(--paper-edge)"} />
        {bubbles.map((b, i) => (
          <motion.circle
            key={b.name}
            cx={b.x}
            cy={b.y}
            initial={prefs.reduced ? { r: b.r } : { r: 0 }}
            animate={{ r: b.r }}
            transition={{ duration: 0.5, ease: EASE, delay: prefs.reduced ? 0 : 0.05 * Math.min(i, 8) }}
            fill="color-mix(in srgb, var(--lime) 78%, transparent)"
            stroke="var(--ink)"
            strokeWidth={1.2}
          />
        ))}
        {bubbles.slice(0, 3).map((b) => (
          <text
            key={`label-${b.name}`}
            x={b.x}
            y={b.y + 3}
            textAnchor="middle"
            style={{ fontFamily: "var(--font-label)", fontSize: 10, fontWeight: 700 }}
            fill="var(--ink)"
          >
            {formatCount(b.n)}
          </text>
        ))}
      </svg>
      <Caption style={{ marginTop: 10 }}>
        bubble size = answers counted in that state
      </Caption>
      {result.your_region?.state && (
        <Caption>counting you in {result.your_region.state}</Caption>
      )}
      <SampleLine n={result.sample_n} />
    </Plate>
  );
}

export const bubblemapDefinition: DvDefinition = {
  id: "bubblemap",
  family: "geo",
  label: "Vote bubbles",
  supportedModes: [...MODES],
  Component: BubbleMap,
};

export default BubbleMap;
