"use client";
/**
 * Distribution — feat-dv-engine (spectrum mode).
 *
 * An 11-bar histogram of the 0–100 spectrum: each bar is a 10-wide bucket
 * (0–9, 10–19, …, 100), height = share of that bucket against the tallest.
 * The national mean (sum/count) drops a labelled marker on the axis, and the
 * reader's own value (your_payload.value) gets a lime YOU pin. End labels read
 * from question.options[0/1].label, falling back to "Low"/"High".
 */
import { motion } from "framer-motion";
import type { DvDefinition, DvProps } from "@/lib/dv/registry";
import { spectrumModel, yourValue } from "@/lib/dv/transforms";
import { Caption, EASE, Plate, SampleLine, YouTag, mono, useMotionPrefs } from "./chrome";
import StillCounting from "./StillCounting";

function Distribution({ question, result }: DvProps) {
  const prefs = useMotionPrefs();
  if (result.still_counting || !result.aggregate) {
    return <StillCounting question={question} result={result} />;
  }

  const { buckets, peak, count, mean } = spectrumModel(result.aggregate);
  const lowLabel = question.options[0]?.label ?? "Low";
  const highLabel = question.options[1]?.label ?? "High";
  const you = yourValue(result.your_payload);

  // bucket index a 0–100 position belongs to (matches lib/aggregates clamp)
  const bucketOf = (v: number) => Math.max(0, Math.min(10, Math.floor(v / 10)));
  const youBucket = you === null ? null : bucketOf(you);

  return (
    <Plate>
      <Caption style={{ marginBottom: 16 }}>
        Where India stands, {lowLabel} → {highLabel}
      </Caption>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          height: 180,
          borderBottom: "2px solid var(--ink)",
          paddingBottom: 0,
        }}
      >
        {buckets.map((n, i) => {
          const h = peak > 0 ? Math.max(n > 0 ? 6 : 0, (n / peak) * 100) : 0;
          const isYou = youBucket === i;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                height: "100%",
              }}
            >
              <motion.div
                initial={prefs.reduced ? false : { height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: prefs.dur(0.6), delay: prefs.delay(i * 0.04), ease: EASE }}
                style={{
                  width: "100%",
                  background: isYou ? "var(--lime)" : "var(--fire)",
                  border: "1.5px solid var(--ink)",
                  borderBottom: "none",
                  borderRadius: "4px 4px 0 0",
                  minHeight: n > 0 ? 6 : 0,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* axis: 0 … 100 with end labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          ...mono(10, ".08em"),
          color: "var(--muted)",
        }}
      >
        <span>0 · {lowLabel}</span>
        <span>{highLabel} · 100</span>
      </div>

      {/* national mean marker */}
      {mean !== null && (
        <div style={{ position: "relative", marginTop: 14, height: 24 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 11,
              height: 2,
              background: "var(--paper-edge)",
              border: "1px solid var(--ink)",
              borderRadius: 100,
            }}
          />
          <motion.div
            initial={prefs.reduced ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: prefs.dur(0.4), delay: prefs.delay(0.5), ease: EASE }}
            style={{
              position: "absolute",
              left: `${Math.max(0, Math.min(100, mean))}%`,
              top: 0,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "var(--ink)",
                border: "2px solid var(--paper-bright)",
                boxShadow: "0 0 0 1.5px var(--ink)",
              }}
            />
          </motion.div>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 12 }}>
        {mean !== null && (
          <span style={{ ...mono(11, ".04em"), fontWeight: 700, color: "var(--ink)" }}>
            India&rsquo;s average: {Math.round(mean)}
          </span>
        )}
        {you !== null && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <YouTag />
            <span style={{ ...mono(10, ".06em"), color: "var(--muted)" }}>you said {you}</span>
          </span>
        )}
      </div>

      <SampleLine n={count > 0 ? count : result.sample_n} />
    </Plate>
  );
}

export const distributionDefinition: DvDefinition = {
  id: "distribution",
  family: "proportion",
  label: "Distribution",
  supportedModes: ["spectrum"],
  Component: Distribution,
};

export default Distribution;
