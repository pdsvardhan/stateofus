"use client";
/**
 * Sankey (the flow) — feat-dv-engine.
 *
 * The v5 ribbons, fed by real geography: each contributing state (top four
 * + Elsewhere) pours into the top two answers, ribbon width = that group's
 * share of the vote. Without state aggregates the whole country pours as
 * one band. Fire vs ink-soft ribbons, labels on both banks (CA-008).
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { PICK_MODES, sankeyModel, yourPick } from "@/lib/dv/transforms";
import { FLOW_PAL } from "@/lib/dv/palette";
import { Caption, Plate, SampleLine, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

const S = 2.5; // % → px vertical scale, the v5 constant

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function Sankey({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const model = sankeyModel(
    question.mode,
    result.aggregate,
    result.state_aggregates,
    question.options,
    result.sample_n
  );
  if (!model) {
    return <StillCounting question={question} result={result} />;
  }

  const you = yourPick(result.your_payload);

  // left nodes
  let y = 14;
  const left = model.bands.map((b) => {
    const node = { y0: y, h: Math.max(2, b.pct * S) };
    y += node.h + 10;
    return node;
  });
  // right nodes
  let yr = 30;
  const right = model.right.map((r) => {
    const node = { y0: yr, h: Math.max(2, r.pct * S) };
    yr += node.h + 24;
    return node;
  });
  const height = Math.max(330, y + 10, yr + 10);

  // ribbons
  const rOff = right.map((r) => r.y0);
  const ribbons: { d: string; j: number; delay: number; key: string }[] = [];
  model.bands.forEach((b, i) => {
    let lOff = left[i].y0;
    ([0, 1] as const).forEach((j) => {
      const w = ((b.pct * b.split[j]) / 100) * S;
      const yT0 = lOff;
      const yB0 = lOff + w;
      const yT1 = rOff[j];
      const yB1 = rOff[j] + w;
      lOff += w;
      rOff[j] += w;
      ribbons.push({
        key: `${b.name}-${j}`,
        j,
        delay: 0.2 + i * 0.16 + j * 0.06,
        d: `M120,${yT0} C300,${yT0} 300,${yT1} 480,${yT1} L480,${yB1} C300,${yB1} 300,${yB0} 120,${yB0} Z`,
      });
    });
  });

  return (
    <Plate>
      <Caption style={{ marginBottom: 14 }}>
        {model.bands.length > 1
          ? "Where each state pours · top two answers"
          : "Where the country pours · top two answers"}
      </Caption>
      <svg
        viewBox={`0 0 600 ${height}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label="Flow of votes into the top two answers"
      >
        {ribbons.map((r) => (
          <motion.path
            key={r.key}
            d={r.d}
            fill={FLOW_PAL[r.j]}
            initial={prefs.reduced ? false : { opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: prefs.dur(0.8), delay: prefs.delay(r.delay) }}
          />
        ))}
        {model.bands.map((b, i) => (
          <g key={b.name}>
            <rect x={104} y={left[i].y0} width={16} height={left[i].h} fill="var(--ink)" rx={3} />
            <text
              x={94}
              y={left[i].y0 + left[i].h / 2 + 4}
              textAnchor="end"
              style={{ fontFamily: "var(--font-label)" }}
              fontSize={12}
              fontWeight={700}
              fill="var(--ink)"
            >
              {truncate(b.name, 16)}
            </text>
          </g>
        ))}
        {model.right.map((r, j) => (
          <g key={r.key}>
            <rect
              x={480}
              y={right[j].y0}
              width={16}
              height={right[j].h}
              fill={FLOW_PAL[j]}
              stroke="var(--ink)"
              strokeWidth={2}
              rx={3}
            />
            <text
              x={506}
              y={right[j].y0 + right[j].h / 2 - 3}
              style={{ fontFamily: "var(--font-ui)" }}
              fontSize={16}
              fontWeight={800}
              fill="var(--ink)"
            >
              {truncate(r.label, 11)}
            </text>
            <text
              x={506}
              y={right[j].y0 + right[j].h / 2 + 15}
              style={{ fontFamily: "var(--font-label)" }}
              fontSize={13}
              fontWeight={700}
              fill="var(--ink)"
            >
              {r.pct}%{you === r.key ? " · you" : ""}
            </text>
          </g>
        ))}
      </svg>
      <Caption style={{ marginTop: 10 }}>
        Ribbon width = that group&rsquo;s share of the vote
      </Caption>
      <SampleLine n={result.sample_n} />
    </Plate>
  );
}

export const sankeyDefinition: DvDefinition = {
  id: "sankey",
  family: "flow",
  label: "The flow",
  supportedModes: [...PICK_MODES],
  Component: Sankey,
};

export default Sankey;
