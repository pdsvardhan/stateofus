"use client";
/**
 * Medal board — feat-dv-engine (podium alt).
 *
 * The v5 medal rows: gold/silver/bronze discs with the inset rim shadow,
 * medal-colored bars growing to each share, YOU tag on the reader's pick.
 */
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { PICK_MODES, standingsFor, yourTopPick } from "@/lib/dv/transforms";
import { MEDALS, inkVeil } from "@/lib/dv/palette";
import { Caption, GrowBar, Plate, Rise, SampleLine, YouTag, mono } from "./chrome";
import StillCounting from "./StillCounting";

function Medal({ question, result }: DvProps) {
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const { rows, caption } = standingsFor(question.mode, result.aggregate, question.options);
  const youKey = yourTopPick(question.mode, result.your_payload);
  const top3 = rows
    .slice()
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  return (
    <Plate>
      <Caption style={{ marginBottom: 16 }}>
        The medal board · the country&rsquo;s top three · {caption}
      </Caption>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {top3.map((r, rk) => (
          <Rise key={r.key} delay={0.1 + rk * 0.14}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                border: "2px solid var(--ink)",
                borderRadius: 10,
                background: "var(--paper)",
                padding: "13px 16px",
              }}
            >
              <span
                style={{
                  width: 46,
                  height: 46,
                  border: "2px solid var(--ink)",
                  borderRadius: "50%",
                  background: MEDALS[rk].bg,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontStyle: "italic",
                  fontSize: 15,
                  flexShrink: 0,
                  boxShadow: `inset 0 -4px 0 ${inkVeil(18)}`,
                }}
              >
                {MEDALS[rk].place}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{r.label}</span>
                  <span style={{ ...mono(12.5, ".02em"), fontWeight: 700 }}>{r.pct}%</span>
                </div>
                <GrowBar pct={r.pct} fill={MEDALS[rk].bg} height={9} duration={0.8} delay={0.1 + rk * 0.14} />
              </div>
              {youKey === r.key && <YouTag />}
            </div>
          </Rise>
        ))}
      </div>
      <SampleLine n={result.sample_n} />
    </Plate>
  );
}

export const medalDefinition: DvDefinition = {
  id: "medal",
  family: "rank",
  label: "Medal board",
  supportedModes: ["podium_slots", "rank_order", ...PICK_MODES],
  Component: Medal,
};

export default Medal;
