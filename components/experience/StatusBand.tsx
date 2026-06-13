/**
 * Lifecycle status bands — AC362 (governance transparency on the page).
 *  frozen   → FRZ2 archival striped band (chart stays crisp below)
 *  archived → AR2 grey ink stripes (v5 built treatment, adr-006 §1)
 *  paused   → plain notice band
 * Active questions render nothing.
 */
import type { LifecycleState } from "@/lib/catalogue/enums";

const STRIPES_FROZEN =
  "repeating-linear-gradient(45deg, var(--lavender) 0 10px, var(--paper-bright) 10px 20px)";
const STRIPES_ARCHIVED =
  "repeating-linear-gradient(45deg, var(--paper-deep) 0 10px, var(--paper-bright) 10px 20px)";

export function StatusBand({ status }: { status: LifecycleState }) {
  if (status === "active" || status === "draft") return null;

  const copy: Record<string, { title: string; sub: string; bg: string }> = {
    frozen: {
      title: "EDITION FROZEN",
      sub: "The count is final. Answers are closed; the result stands.",
      bg: STRIPES_FROZEN,
    },
    archived: {
      title: "FROM THE ARCHIVE",
      sub: "A past edition, preserved as counted.",
      bg: STRIPES_ARCHIVED,
    },
    paused: {
      title: "PRESSES PAUSED",
      sub: "This question is on hold — the count resumes soon.",
      bg: STRIPES_ARCHIVED,
    },
  };
  const c = copy[status];
  if (!c) return null;

  return (
    <div className="border-y-4 border-ink" style={{ background: c.bg }}>
      <div className="mx-auto flex max-w-2xl items-baseline gap-3 px-4 py-2 lg:max-w-[1120px] lg:px-8">
        <span className="bg-ink px-2 py-0.5 font-label text-xs font-bold tracking-[0.2em] text-paper-bright">
          {c.title}
        </span>
        <span className="font-editorial text-sm italic text-ink">{c.sub}</span>
      </div>
    </div>
  );
}
