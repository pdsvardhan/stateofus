/**
 * InsightCards — renders the personal insight layer (feat-personal-insight-
 * layer) in the v5 stamped-editorial card treatment: ink-bordered paper-white
 * plates, mono stamp label with the prototype's highlighter band, Spectral
 * serif body. Tone-coloured accents per the spec: match=agree/lime,
 * differ=fire, region=blue, majority=gold, minority=lavender (info=paper-deep).
 *
 * Pure presentational server-safe component — no client hooks; the insights
 * come from lib/insights/templates.buildInsights. Empty list (AC350: skipped/
 * unanswered) renders nothing. 375px-first single column. Tokens only.
 */
import type { Insight, InsightTone } from "@/lib/insights/templates";

const TONE_VAR: Record<InsightTone, string> = {
  match: "var(--lime)",
  differ: "var(--fire)",
  region: "var(--blue)",
  majority: "var(--gold)",
  minority: "var(--lavender)",
  info: "var(--paper-deep)",
};

/** check-glyph / dot accent colour — match gets the one blessed green. */
const TONE_DOT_VAR: Record<InsightTone, string> = {
  match: "var(--agree)",
  differ: "var(--fire)",
  region: "var(--blue)",
  majority: "var(--gold)",
  minority: "var(--lavender)",
  info: "var(--muted)",
};

const TONE_LABEL: Record<InsightTone, string> = {
  match: "You matched",
  differ: "Against the grain",
  region: "Regional split",
  majority: "Majority position",
  minority: "Minority report",
  info: "For the record",
};

export default function InsightCards({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <section aria-label="Your position — insights" className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span className="rounded border-[1.5px] border-ink bg-lime px-[11px] py-[5px] font-label text-[10px] font-bold uppercase tracking-[.22em] text-ink">
          Your position
        </span>
        <span aria-hidden="true" className="h-0.5 flex-1 bg-ink" />
      </div>

      {insights.map((insight, i) => (
        <article
          key={insight.id}
          className="rounded-[10px] border-2 border-ink bg-paper-white px-5 py-4 shadow-[4px_4px_0_var(--ink)]"
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-[3px] border-[1.5px] border-ink"
              style={{ background: TONE_DOT_VAR[insight.tone] }}
            />
            <span
              className="inline-block px-1 font-label text-[10px] font-bold uppercase tracking-[.14em] text-ink"
              style={{
                backgroundImage: `linear-gradient(180deg, transparent 32%, ${TONE_VAR[insight.tone]} 32%, ${TONE_VAR[insight.tone]} 92%, transparent 92%)`,
              }}
            >
              {TONE_LABEL[insight.tone]} · No. 0{i + 1}
            </span>
          </div>
          <h3 className="mt-2 font-ui text-[17px] font-extrabold uppercase leading-tight tracking-[-.01em] text-ink">
            {insight.headline}
          </h3>
          <p className="mt-1.5 font-editorial text-[15.5px] leading-[1.45] text-ink-soft">
            {insight.body}
          </p>
        </article>
      ))}
    </section>
  );
}
