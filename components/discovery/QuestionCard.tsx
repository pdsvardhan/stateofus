/**
 * Question feed card — FB-009 DV-typed teaser previews: each card carries a
 * small glyph hinting at the result type waiting behind it (donut, bars,
 * map, tiers...), so the feed promises the payoff. Server component.
 */
import Link from "next/link";
import { DESK_BY_CATEGORY, type Category } from "@/lib/catalogue/enums";
import type { DiscoveryCard } from "@/lib/discovery/queries";

function DvGlyph({ dv }: { dv: string }) {
  const common = { stroke: "var(--ink)", strokeWidth: 1.6, fill: "none" } as const;
  switch (dv) {
    case "radial":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <circle cx="12" cy="12" r="8" {...common} />
          <path d="M12 4 A8 8 0 0 1 20 12 L12 12 Z" fill="var(--fire)" stroke="var(--ink)" strokeWidth="1.2" />
        </svg>
      );
    case "map":
    case "bubblemap":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path d="M7 3 L17 5 L20 12 L14 21 L9 19 L4 12 Z" fill="var(--lime)" stroke="var(--ink)" strokeWidth="1.4" />
          <circle cx="13" cy="11" r="2.4" fill="var(--fire)" stroke="var(--ink)" strokeWidth="1" />
        </svg>
      );
    case "tier":
    case "heatmatrix":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <rect x="3" y="4" width="18" height="4.5" fill="var(--fire)" stroke="var(--ink)" strokeWidth="1.2" />
          <rect x="3" y="10" width="18" height="4.5" fill="var(--gold)" stroke="var(--ink)" strokeWidth="1.2" />
          <rect x="3" y="16" width="18" height="4.5" fill="var(--lime)" stroke="var(--ink)" strokeWidth="1.2" />
        </svg>
      );
    case "podium":
    case "medal":
    case "board":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <rect x="9" y="6" width="6" height="14" fill="var(--gold)" stroke="var(--ink)" strokeWidth="1.2" />
          <rect x="3" y="11" width="6" height="9" fill="var(--silver)" stroke="var(--ink)" strokeWidth="1.2" />
          <rect x="15" y="14" width="6" height="6" fill="var(--bronze)" stroke="var(--ink)" strokeWidth="1.2" />
        </svg>
      );
    case "treemap":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <rect x="3" y="3" width="11" height="18" fill="var(--fire)" stroke="var(--ink)" strokeWidth="1.2" />
          <rect x="14" y="3" width="7" height="10" fill="var(--gold)" stroke="var(--ink)" strokeWidth="1.2" />
          <rect x="14" y="13" width="7" height="8" fill="var(--blue)" stroke="var(--ink)" strokeWidth="1.2" />
        </svg>
      );
    case "sankey":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path d="M3 6 C12 6 12 4 21 4" {...common} stroke="var(--fire)" strokeWidth="3" />
          <path d="M3 12 C12 12 12 14 21 14" {...common} stroke="var(--gold)" strokeWidth="3" />
          <path d="M3 18 C12 18 12 20 21 20" {...common} stroke="var(--blue)" strokeWidth="3" />
        </svg>
      );
    default: // split / liquid / cups / coins → bars
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <rect x="3" y="10" width="4.5" height="11" fill="var(--fire)" stroke="var(--ink)" strokeWidth="1.2" />
          <rect x="10" y="5" width="4.5" height="16" fill="var(--lime)" stroke="var(--ink)" strokeWidth="1.2" />
          <rect x="17" y="13" width="4.5" height="8" fill="var(--gold)" stroke="var(--ink)" strokeWidth="1.2" />
        </svg>
      );
  }
}

export function QuestionCard({
  card,
  wide = false,
}: {
  card: DiscoveryCard;
  wide?: boolean;
}) {
  const desk = DESK_BY_CATEGORY[card.category as Category];
  return (
    <Link
      href={`/q/${card.id}`}
      className={`group flex shrink-0 flex-col justify-between border-2 border-ink bg-paper-bright p-3 transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--ink)] ${
        wide ? "w-[250px]" : "w-[210px]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        {desk && (
          <span
            className="border border-ink px-1.5 py-0.5 font-label text-[10px] font-bold tracking-wider uppercase"
            style={{ backgroundColor: desk.color }}
          >
            {desk.desk.replace("The ", "")}
          </span>
        )}
        <DvGlyph dv={card.primary_dv} />
      </div>
      <p className="font-editorial text-base font-bold leading-snug text-ink">
        {card.text}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-label text-[10px] tracking-wider text-muted uppercase">
          {card.mode.replace(/_/g, " ")}
        </span>
        {card.sample_n > 0 && (
          <span className="font-label text-[10px] text-ink-soft">
            {card.sample_n.toLocaleString("en-IN")} counted
          </span>
        )}
      </div>
    </Link>
  );
}
