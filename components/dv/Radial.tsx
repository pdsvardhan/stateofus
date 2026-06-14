"use client";
/**
 * S2 Radial split (donut) — feat-dv-engine.
 *
 * The v5 donut: conic-gradient ring swept in over ~700ms (the prototype's
 * reveal ramp), rank-colored legend bars growing alongside, YOU tag on the
 * reader's answer.
 */
import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { PICK_MODES, pickShares, yourPick } from "@/lib/dv/transforms";
import { rankSwatch } from "@/lib/dv/palette";
import { Caption, GrowBar, Plate, SampleLine, YouTag, mono, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

function Radial({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  const [sweep, setSweep] = useState(prefs.reduced ? 1 : 0);

  useEffect(() => {
    if (prefs.reduced) {
      setSweep(1);
      return;
    }
    const controls = animate(0, 1, {
      duration: 0.7,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (v) => setSweep(v),
    });
    return () => controls.stop();
  }, [prefs.reduced]);

  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const shares = pickShares(result.aggregate, question.options);
  const you = yourPick(result.your_payload);

  // rank options by share so the palette reads biggest → smallest
  const order = shares
    .map((_, i) => i)
    .sort((a, b) => shares[b].pct - shares[a].pct || a - b);
  const rankOf: number[] = [];
  order.forEach((idx, rk) => {
    rankOf[idx] = rk;
  });

  let acc = 0;
  const stops = shares.map((s, i) => {
    const seg = `${rankSwatch(rankOf[i]).bg} ${acc * sweep}% ${(acc + s.pct) * sweep}%`;
    acc += s.pct;
    return seg;
  });
  stops.push(`var(--paper-edge) ${100 * sweep}% 100%`);
  const topPct = shares.length > 0 ? Math.max(...shares.map((s) => s.pct)) : 0;

  return (
    <Plate style={{ display: "flex", gap: 30, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 210, height: 210, flexShrink: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid var(--ink)",
            background: `conic-gradient(${stops.join(", ")})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 50,
            borderRadius: "50%",
            border: "2px solid var(--ink)",
            background: "var(--paper-bright)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontWeight: 900, fontSize: 34, letterSpacing: "-.02em" }}>
            {Math.round(topPct * sweep)}%
          </span>
          <span style={{ ...mono(10, ".12em"), color: "var(--muted)" }}>top answer</span>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 220,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {shares.map((s, i) => (
          <div key={s.key}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 3,
                  border: "1.5px solid var(--ink)",
                  background: rankSwatch(rankOf[i]).bg,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{s.label}</span>
              {you === s.key && <YouTag />}
              <span style={{ ...mono(12.5, ".04em"), fontWeight: 700 }}>{s.pct}%</span>
            </div>
            <GrowBar pct={s.pct} fill={rankSwatch(rankOf[i]).bg} duration={0.8} delay={0.1 + i * 0.09} />
          </div>
        ))}
        <Caption style={{ marginTop: 2 }}>share of all votes</Caption>
        <SampleLine n={result.sample_n} style={{ marginTop: 0 }} />
      </div>
    </Plate>
  );
}

export const radialDefinition: DvDefinition = {
  id: "radial",
  family: "split",
  label: "Donut",
  supportedModes: [...PICK_MODES],
  Component: Radial,
};

export default Radial;
