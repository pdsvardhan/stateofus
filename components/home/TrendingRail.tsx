/**
 * "Heating up" trending rail — numbered list sorted by REAL counts
 * (lib/discovery getTrending; the NEW-01 parseFloat bug is regression-tested).
 */
import Link from "next/link";
import type { DiscoveryCard } from "@/lib/discovery/queries";

export function TrendingRail({ cards }: { cards: DiscoveryCard[] }) {
  if (cards.length === 0) return null;
  return (
    <aside aria-label="Heating up" className="border-2 border-ink bg-paper-deep p-3">
      <h3 className="mb-2 border-b-2 border-ink pb-1 font-label text-sm font-bold tracking-[0.2em] text-ink uppercase">
        🔥 Heating up
      </h3>
      <ol className="flex flex-col gap-2">
        {cards.map((c, i) => (
          <li key={c.id}>
            <Link href={`/q/${c.id}`} className="group flex gap-2">
              <span className="font-label text-lg font-bold text-fire">{i + 1}</span>
              <span className="flex flex-col">
                <span className="font-editorial text-sm font-bold leading-snug text-ink group-hover:underline decoration-2 decoration-[var(--fire)]">
                  {c.text}
                </span>
                <span className="font-label text-[10px] text-muted">
                  {c.sample_n.toLocaleString("en-IN")} counted
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
