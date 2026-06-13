/**
 * Feed row — faithful port of the v5 Netflix-style sectioned row: bold uppercase
 * title + mono sub + rule line + count, then a horizontal snap-scroll of cards.
 */
import type { DiscoveryCard } from "@/lib/discovery/queries";
import { QuestionCard } from "@/components/discovery/QuestionCard";

export function FeedRow({
  title,
  sub,
  cards,
}: {
  title: string;
  sub?: string;
  cards: DiscoveryCard[];
}) {
  if (cards.length === 0) return null;
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-ui font-black uppercase" style={{ fontSize: 20, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          {title}
        </span>
        {sub && (
          <span className="font-label uppercase" style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--muted)", whiteSpace: "nowrap" }}>
            {sub}
          </span>
        )}
        <span style={{ flex: 1, height: 2, background: "rgba(24,22,42,.22)" }} />
        <span className="font-label uppercase" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--muted)" }}>
          {cards.length} question{cards.length === 1 ? "" : "s"}
        </span>
      </div>
      <div style={{ overflowX: "auto", padding: "4px 4px 16px", scrollSnapType: "x proximity" }}>
        <div className="flex items-stretch gap-4">
          {cards.map((c) => (
            <QuestionCard key={c.id} card={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
