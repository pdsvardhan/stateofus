/**
 * F1 "peek & page" feed row — horizontal scroll with the next card peeking
 * at the edge (the locked Lab A winner; F1 card proportions per LAB-003).
 * Server component; native scroll-snap does the work, no JS.
 */
import Link from "next/link";
import type { DiscoveryCard } from "@/lib/discovery/queries";
import { QuestionCard } from "@/components/discovery/QuestionCard";

export function FeedRow({
  title,
  accent,
  cards,
  moreHref,
}: {
  title: string;
  accent?: string;
  cards: DiscoveryCard[];
  moreHref?: string;
}) {
  if (cards.length === 0) return null;
  return (
    <section aria-label={title} className="py-4">
      <div className="mb-2 flex items-baseline justify-between border-b-2 border-ink pb-1">
        <h3 className="flex items-center gap-2 font-label text-sm font-bold tracking-[0.2em] text-ink uppercase">
          {accent && (
            <span
              aria-hidden
              className="inline-block h-3 w-3 border border-ink"
              style={{ backgroundColor: accent }}
            />
          )}
          {title}
        </h3>
        {moreHref && (
          <Link
            href={moreHref}
            className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2"
          >
            See the desk →
          </Link>
        )}
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {cards.map((c) => (
          <div key={c.id} className="snap-start">
            <QuestionCard card={c} wide />
          </div>
        ))}
      </div>
    </section>
  );
}
