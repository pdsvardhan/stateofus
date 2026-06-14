/**
 * Editorial header — faithful port of the v5 home masthead block.
 * "Today's edition" kicker, the big "What does India actually think?" headline
 * (weight 900, uppercase, tight leading, fire highlight), Spectral subhead.
 */
export function EditorialHeader() {
  return (
    <div style={{ borderBottom: "2px solid var(--ink)", paddingBottom: 26, marginBottom: 24 }}>
      <div
        className="font-label font-bold uppercase"
        style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--fire)", marginBottom: 12 }}
      >
        Today&apos;s edition
      </div>
      <h1
        style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 900,
          /* one line on desktop; scales down on narrow screens without wrapping */
          fontSize: "clamp(40px, 5.2vw, 64px)",
          lineHeight: 0.96,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        What does India <span style={{ color: "var(--fire)" }}>actually</span> think?
      </h1>
    </div>
  );
}
