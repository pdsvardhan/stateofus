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
          fontSize: "clamp(40px, 7vw, 76px)",
          lineHeight: 0.96,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          margin: "0 0 14px",
          maxWidth: 900,
        }}
      >
        What does India <span style={{ color: "var(--fire)" }}>actually</span> think?
      </h1>
      <div
        style={{
          fontFamily: "var(--font-editorial)",
          fontStyle: "italic",
          fontSize: 18,
          color: "var(--ink-warm)",
          maxWidth: 560,
          lineHeight: 1.4,
        }}
      >
        Answer one question. See the country split open. No accounts, no feeds of
        strangers — just the public, counted.
      </div>
    </div>
  );
}
