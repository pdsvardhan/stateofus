/**
 * The front page — feat-homepage-curation (AC354/355).
 * Editorial (hero carousel) + trending + recent + explore modules, composed
 * with the category-diversity pass. Curated and bounded — no infinite feed,
 * no single algorithmic stream (product avoid-list).
 */
import { composeHomepage } from "@/lib/discovery/queries";
import { Masthead } from "@/components/home/Masthead";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryChips } from "@/components/home/CategoryChips";
import { FeedRow } from "@/components/home/FeedRow";
import { TrendingRail } from "@/components/home/TrendingRail";
import { HouseRules } from "@/components/home/HouseRules";
import { SurpriseMe } from "@/components/home/SurpriseMe";

export const dynamic = "force-dynamic";

export default function Home() {
  const modules = composeHomepage();
  const byKind = Object.fromEntries(modules.map((m) => [m.kind, m.cards]));

  return (
    <div className="min-h-screen">
      <Masthead />
      <main className="mx-auto max-w-5xl px-4 pb-16">
        <CategoryChips />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <HeroCarousel heroes={byKind.editorial ?? []} />
          <div className="flex flex-col gap-4">
            <TrendingRail cards={(byKind.trending ?? []).slice(0, 5)} />
            <HouseRules />
          </div>
        </div>

        <FeedRow title="Hot off the press" accent="var(--fire)" cards={byKind.recent ?? []} />
        <FeedRow title="From the floor" accent="var(--lime)" cards={byKind.explore ?? []} moreHref="/explore" />
      </main>
      <SurpriseMe variant="fab" />
    </div>
  );
}
