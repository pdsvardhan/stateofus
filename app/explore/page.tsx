/**
 * Explore — feat-discovery (AC351). The full open catalogue, filterable by
 * mode and desk. Bounded grid, not an infinite feed.
 */
import Link from "next/link";
import { CATEGORIES, MODES } from "@/lib/catalogue/enums";
import { getExplore, getTrending, getEditorialPicks } from "@/lib/discovery/queries";
import { Masthead } from "@/components/home/Masthead";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SurpriseMe } from "@/components/home/SurpriseMe";
import { DeskChips } from "@/components/home/DeskChips";
import { FeedRow } from "@/components/home/FeedRow";
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
  // FIX 6 (B1) — curated rails when not filtering, so Explore reads as "what's
  // hot", distinct from a Category page's exhaustive single-desk list.
  const curated = !safeMode && !safeCategory;
  const trending = curated ? getTrending(8) : [];
  const picks = curated ? getEditorialPicks(6) : [];

  return (
    <div className="min-h-screen">
      <Masthead />
      <main className="mx-auto max-w-[1280px] px-[22px] pb-[90px] pt-8">
        <div className="pb-3">
          <Link href="/" className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2">
            ← Front page
          </Link>
        </div>
        <h1 className="font-ui font-black uppercase text-ink" style={{ fontSize: "clamp(28px,4vw,40px)", letterSpacing: "-0.02em" }}>
          Explore the catalogue
        </h1>
        <div className="py-4">
          <DeskChips active={safeCategory} />
        </div>
        <div className="mb-5 flex flex-wrap gap-2" aria-label="Filter by interaction">
          {MODES.map((m) => (
            <Link
              key={m}
              href={
                safeMode === m
                  ? `/explore${safeCategory ? `?category=${encodeURIComponent(safeCategory)}` : ""}`
                  : `/explore?mode=${m}${safeCategory ? `&category=${encodeURIComponent(safeCategory)}` : ""}`
              }
              className="font-label font-bold uppercase"
              style={{ fontSize: 11, letterSpacing: "0.1em", border: "2px solid var(--ink)", borderRadius: 100, padding: "7px 13px", background: safeMode === m ? "var(--ink)" : "var(--paper-bright)", color: safeMode === m ? "var(--paper)" : "var(--ink)" }}
            >
              {m.replace(/_/g, " ")}
            </Link>
          ))}
        </div>
        {curated && (
          <div className="mb-8 flex flex-col gap-8">
            <FeedRow title="Heating up" sub="most-answered right now" cards={trending} />
            <FeedRow title="Editor's picks" sub="hand-chosen from the desks" cards={picks} />
          </div>
        )}
        {curated && (
          <h2 className="mb-1 font-ui font-black uppercase text-ink" style={{ fontSize: 20, letterSpacing: "-0.01em" }}>
            The full catalogue
          </h2>
        )}
        <p className="mb-3 font-label uppercase text-muted" style={{ fontSize: 10, letterSpacing: "0.1em" }}>{cards.length} questions</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <QuestionCard key={c.id} card={c} wide={false} />
          ))}
        </div>
      </main>
      <SiteFooter />
      <SurpriseMe variant="fab" />
    </div>
  );
}
