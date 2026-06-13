/**
 * StatusBand — v5 archived / frozen bands (prototype lines 537–548), corrected
 * colours + inline rounded treatment. Render this INSIDE the result container
 * (above the question header), NOT as a full-bleed page band.
 *   frozen   → ink stripes, ❄, paper text
 *   archived → silver (--silver) stripes, ▣, ink text
 *   paused   → silver stripes, ink text
 * Active/draft render nothing.
 */
import type { LifecycleState } from "@/lib/catalogue/enums";

const STRIPES_FROZEN =
  "repeating-linear-gradient(-45deg, var(--ink) 0 10px, var(--ink-soft) 10px 20px)";
const STRIPES_ARCHIVED =
  "repeating-linear-gradient(-45deg, var(--silver) 0 10px, color-mix(in srgb, var(--silver) 80%, var(--ink)) 10px 20px)";

export function StatusBand({
  status,
  date,
  votes,
}: {
  status: LifecycleState;
  /** e.g. "12 Jun 2026" — when the count closed */
  date?: string | null;
  /** total votes on the record, for the inset pill */
  votes?: number | null;
}) {
  if (status === "active" || status === "draft") return null;

  const votesTxt = votes != null ? `${votes.toLocaleString("en-IN")} votes` : null;

  if (status === "frozen") {
    return (
      <div
        className="mb-[18px] flex items-center gap-2.5 rounded-lg border-2 border-ink px-4 py-2.5 text-paper"
        style={{ background: STRIPES_FROZEN }}
      >
        <span aria-hidden className="text-sm">
          ❄
        </span>
        <span className="font-label text-[10px] font-bold uppercase tracking-[.14em]">
          Frozen · counting closed{date ? ` ${date}` : ""} · preserved exactly as the country left it
        </span>
      </div>
    );
  }

  // archived + paused share the silver treatment
  const title = status === "paused" ? "▣ Presses paused" : "▣ Archived";
  return (
    <div
      className="mb-[18px] flex flex-wrap items-center gap-2.5 rounded-lg border-2 border-ink px-4 py-2.5 text-ink"
      style={{ background: STRIPES_ARCHIVED }}
    >
      <span className="rounded border border-ink bg-paper-bright/90 px-2.5 py-[3px] font-label text-[10px] font-bold uppercase tracking-[.14em]">
        {title}
        {date ? ` · count closed ${date}` : ""}
      </span>
      {votesTxt && (
        <span className="rounded bg-paper-bright/90 px-2.5 py-[3px] font-label text-[10px] uppercase tracking-[.1em] text-ink-soft">
          final record · {votesTxt}
        </span>
      )}
    </div>
  );
}

export default StatusBand;
