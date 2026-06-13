"use client";
/**
 * R2 Dynamic leaderboard — feat-dv-engine.
 *
 * The v5 dark plate: italic rank numerals (leader in fire), bars racing on
 * a translucent track, “you said: …” under each row from your_payload.
 * Rank questions board by share of #1 votes, swipe stacks by yes share,
 * placements by share filed under the top target.
 */
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import {
  boardRowsFor,
  yourOrder,
  yourPlacements,
  yourVotes,
} from "@/lib/dv/transforms";
import { paperVeil } from "@/lib/dv/palette";
import { Caption, GrowBar, Plate, Rise, SampleLine, mono } from "./chrome";
import StillCounting from "./StillCounting";

function Board({ question, result }: DvProps) {
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const { rows, caption } = boardRowsFor(
    question.mode,
    result.aggregate,
    question.options,
    question.targets
  );
  const sorted = rows.slice().sort((a, b) => b.pct - a.pct);

  const order = yourOrder(result.your_payload);
  const votes = yourVotes(result.your_payload);
  const placements = yourPlacements(result.your_payload);
  const youSaid = (key: string): string | null => {
    if (question.mode === "rank_order" && order) {
      const pos = order.indexOf(key);
      return pos >= 0 ? `your #${pos + 1}` : null;
    }
    if (question.mode === "swipe_stack" && votes) {
      return votes[key] !== undefined ? votes[key] : null;
    }
    if (placements) return placements[key] ?? null;
    return null;
  };

  return (
    <Plate dark>
      <Caption color="var(--lime)" style={{ marginBottom: 18 }}>
        {caption}
      </Caption>
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {sorted.map((r, i) => {
          const said = result.your_payload ? youSaid(r.key) : null;
          return (
            <Rise key={r.key} delay={0.08 + i * 0.11}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontStyle: "italic",
                    fontSize: 28,
                    color: i === 0 ? "var(--fire)" : "var(--paper)",
                    width: 36,
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
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
                    <span style={{ ...mono(12.5, ".02em"), fontWeight: 700, color: "var(--lime)" }}>
                      {r.pct}%
                    </span>
                  </div>
                  <GrowBar
                    pct={r.pct}
                    fill={i === 0 ? "var(--fire)" : "var(--lime)"}
                    track={paperVeil(16)}
                    bordered={false}
                    delay={0.08 + i * 0.11}
                  />
                  {said !== null && (
                    <div
                      style={{
                        ...mono(10, ".08em"),
                        color: "var(--muted-warm)",
                        marginTop: 4,
                      }}
                    >
                      you said: {said}
                    </div>
                  )}
                </div>
              </div>
            </Rise>
          );
        })}
      </div>
      <SampleLine n={result.sample_n} color="var(--muted-warm)" />
    </Plate>
  );
}

export const boardDefinition: DvDefinition = {
  id: "board",
  family: "rank",
  label: "Leaderboard",
  supportedModes: ["rank_order", "swipe_stack", "bucket_sort", "tier_placement"],
  Component: Board,
};

export default Board;
