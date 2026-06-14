/**
 * RailRelated — v5's in-rail "Up next" + related mini-cards (prototype lines
 * 941–962). Replaces the full-width <RelatedRow> at the page bottom.
 *   • Up-next: DARK ink card, "Up next · picked blind 🎲 · {desk}", Spectral
 *     question, lime "Answer it →".
 *   • Related: 2 compact feed-family cards — desk dot + category + clipped tag
 *     pill + Spectral title + "{n} voted" + →.
 * Server component (no hooks) — mounted inside the result <aside> via a prop
 * passed from the page (rawDb access stays server-side).
 */
import Link from "next/link";
import { getRelated } from "@/lib/discovery/queries";
import { DESK_BY_CATEGORY, type Category } from "@/lib/catalogue/enums";

function desk(category: string): { name: string; color: string } {
  const d = DESK_BY_CATEGORY[category as Category];
  return { name: d?.desk ?? category, color: d?.color ?? "var(--paper-deep)" };
}

export function RailRelated({ questionId }: { questionId: string }) {
  const related = getRelated(questionId, 3);
  if (related.length === 0) return null;
  const [next, ...chips] = related;
  const nextDesk = desk(next.category);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Up next — blind pick (dark) */}
      <Link
        href={`/q/${next.id}`}
        className="block rounded-[10px] border-2 border-ink bg-ink px-5 py-[18px] text-paper transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_color-mix(in_srgb,var(--ink)_35%,transparent)]"
      >
        <span className="font-label text-[10px] font-bold uppercase tracking-[.14em] text-lime">
          Up next · picked blind 🎲 · {nextDesk.name}
        </span>
        <span className="mt-2 mb-1.5 block font-editorial text-[17px] font-semibold leading-[1.2]">
          {next.text}
        </span>
        <span className="font-ui text-[13.5px] font-extrabold uppercase text-lime">Answer it →</span>
      </Link>

      {/* Related mini-cards (feed family) */}
      {chips.slice(0, 2).map((c) => {
        const d = desk(c.category);
        return (
          <Link
            key={c.id}
            href={`/q/${c.id}`}
            className="flex flex-col gap-[7px] rounded-[10px] border-2 border-ink bg-paper-bright px-[15px] py-[13px] shadow-[3px_3px_0_color-mix(in_srgb,var(--ink)_14%,transparent)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--ink)]"
          >
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-[3px] border-[1.5px] border-ink"
                style={{ background: d.color }}
              />
              <span className="font-label text-[10px] uppercase tracking-[.1em] text-muted">
                {d.name}
              </span>
              <span
                className="ml-auto border-[1.5px] border-ink bg-lime py-0.5 pl-[7px] pr-3 font-label text-[10px] font-bold uppercase tracking-[.08em] text-ink"
                style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 100%, 0 100%)" }}
              >
                Vote
              </span>
            </div>
            <div className="font-editorial text-[14.5px] font-semibold leading-[1.2] text-ink">
              {c.text}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-label text-[10px] uppercase tracking-[.08em] text-muted">
                {c.sample_n.toLocaleString("en-IN")} voted
              </span>
              <span className="font-ui text-sm font-extrabold text-ink">→</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default RailRelated;
