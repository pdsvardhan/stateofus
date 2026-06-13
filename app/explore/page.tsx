/**
 * Explore — feat-discovery (AC351). The full open catalogue, filterable by
 * mode and desk. Bounded grid, not an infinite feed.
 */
import Link from "next/link";
import { CATEGORIES, MODES } from "@/lib/catalogue/enums";
import { getExplore } from "@/lib/discovery/queries";
import { CategoryChips } from "@/components/home/CategoryChips";
import { QuestionCard } from "@/components/discovery/QuestionCard";

export const dynamic = "force-dynamic";

export default async function ExplorePage(props: {
  searchParams: Promise<{ mode?: string; category?: string }>;
}) {
  const { mode, category } = await props.searchParams;
  const safeMode = MODES.includes(mode as (typeof MODES)[number]) ? mode : undefined;
  const safeCategory = CATEGORIES.includes(category as (typeof CATEGORIES)[number])
    ? category
    : undefined;
  const cards = getExplore({ mode: safeMode, category: safeCategory });

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16">
      <div className="py-3">
        <Link href="/" className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2">
          ← Front page
        </Link>
      </div>
      <h1 className="font-editorial text-3xl font-extrabold text-ink">Explore the catalogue</h1>
      <CategoryChips active={safeCategory} />
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Filter by interaction">
        {MODES.map((m) => (
          <Link
            key={m}
            href={
              safeMode === m
                ? `/explore${safeCategory ? `?category=${encodeURIComponent(safeCategory)}` : ""}`
                : `/explore?mode=${m}${safeCategory ? `&category=${encodeURIComponent(safeCategory)}` : ""}`
            }
            className={`border-2 border-ink px-2.5 py-1 font-label text-[11px] font-bold tracking-wider uppercase ${
              safeMode === m ? "bg-ink text-paper-bright" : "bg-paper-bright text-ink"
            }`}
          >
            {m.replace(/_/g, " ")}
          </Link>
        ))}
      </div>
      <p className="mb-3 font-label text-xs text-muted">{cards.length} questions</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <QuestionCard key={c.id} card={c} wide />
        ))}
      </div>
    </main>
  );
}
