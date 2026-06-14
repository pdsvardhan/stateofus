/**
 * The front page — faithful port of the v5 prototype home/discover view.
 * Editorial header → desk chips → two columns (hero carousel + the prototype's
 * 5 editorial feed rails | "Heating up" rail + house rules). Curated + bounded;
 * no infinite feed. feat-homepage-curation (AC354/355).
 */
import { composeHomepage, composeFeedRows } from "@/lib/discovery/queries";
import { Masthead } from "@/components/home/Masthead";
import { EditorialHeader } from "@/components/home/EditorialHeader";
import { DeskChips } from "@/components/home/DeskChips";
import { Hero } from "@/components/home/Hero";
import { FeedRow } from "@/components/home/FeedRow";
import { TrendingRail } from "@/components/home/TrendingRail";
import { HouseRules } from "@/components/home/HouseRules";
import { SurpriseMe } from "@/components/home/SurpriseMe";
import { SiteFooter } from "@/components/home/SiteFooter";

export const dynamic = "force-dynamic";

export default function Home() {
  const modules = composeHomepage();
  const byKind = Object.fromEntries(modules.map((m) => [m.kind, m.cards]));
  const editorial = byKind.editorial ?? [];
  const trending = byKind.trending ?? [];

  // the prototype's 5 editorial rails (Vote to unlock / Results are out /
  // Quick picks / The sorting desk / The swipe court) — hero questions excluded
  // so the carousel and the feed never show the same card twice.
  const heroIds = new Set(editorial.map((c) => c.id));
  const feedRows = composeFeedRows(heroIds);

  return (
    <div className="min-h-screen">
      <Masthead />
      <main className="mx-auto max-w-[1280px] px-[22px] pb-[90px] pt-10">
        <EditorialHeader />
        <DeskChips />

        <div className="flex flex-col items-start gap-7 exp:flex-row">
          <div className="min-w-0 flex-1">
            <Hero heroes={editorial} />
            <div className="flex flex-col gap-8">
              {feedRows.map((row) => (
                <FeedRow key={row.key} title={row.title} sub={row.sub} cards={row.cards} />
              ))}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-5 exp:w-[310px] exp:sticky exp:top-[90px] exp:self-start">
            <TrendingRail cards={trending.slice(0, 5)} />
            <HouseRules />
          </div>
        </div>
      </main>
      <SiteFooter />
      <SurpriseMe variant="fab" />
    </div>
  );
}
