/**
 * The front page — faithful port of the v5 prototype home/discover view.
 * Editorial header → desk chips → two columns (hero carousel + Netflix-style
 * feed rows | "Heating up" rail + house rules). Curated + bounded; no infinite
 * feed. feat-homepage-curation (AC354/355).
 */
import { composeHomepage } from "@/lib/discovery/queries";
import { Masthead } from "@/components/home/Masthead";
import { EditorialHeader } from "@/components/home/EditorialHeader";
import { DeskChips } from "@/components/home/DeskChips";
import { Hero } from "@/components/home/Hero";
import { FeedRow } from "@/components/home/FeedRow";
import { TrendingRail } from "@/components/home/TrendingRail";
import { HouseRules } from "@/components/home/HouseRules";
import { SurpriseMe } from "@/components/home/SurpriseMe";

export const dynamic = "force-dynamic";

export default function Home() {
  const modules = composeHomepage();
  const byKind = Object.fromEntries(modules.map((m) => [m.kind, m.cards]));
  const editorial = byKind.editorial ?? [];
  const trending = byKind.trending ?? [];
  const recent = byKind.recent ?? [];
  const explore = byKind.explore ?? [];

  return (
    <div className="min-h-screen">
      <Masthead />
      <main className="mx-auto max-w-[1280px] px-[22px] pb-[90px] pt-10">
        <EditorialHeader />
        <DeskChips />

        <div className="flex flex-col items-start gap-7 lg:flex-row">
          <div className="min-w-0 flex-1">
            <Hero heroes={editorial} />
            <div className="flex flex-col gap-8">
              <FeedRow title="Hot off the press" sub="freshly counted" cards={recent} />
              <FeedRow title="Off the floor" sub="what India is sorting out" cards={explore} />
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-5 lg:w-[310px]">
            <TrendingRail cards={trending.slice(0, 5)} />
            <HouseRules />
          </div>
        </div>
      </main>
      <SurpriseMe variant="fab" />
    </div>
  );
}
