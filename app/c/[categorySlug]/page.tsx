/**
 * Category desk page — feat-discovery (AC351).
 * Desk header in the desk's ink + the desk's active questions.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { DESK_BY_CATEGORY } from "@/lib/catalogue/enums";
import { slugToCategory } from "@/lib/discovery/categories";
import { getByCategory } from "@/lib/discovery/queries";
import { Masthead } from "@/components/home/Masthead";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SurpriseMe } from "@/components/home/SurpriseMe";
import { DeskChips } from "@/components/home/DeskChips";
import { QuestionCard } from "@/components/discovery/QuestionCard";

export const dynamic = "force-dynamic";

export default async function CategoryPage(props: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await props.params;
  const category = slugToCategory(categorySlug);
  if (!category) notFound();
  const desk = DESK_BY_CATEGORY[category];
  const cards = getByCategory(category);

  return (
    <div className="min-h-screen">
      <Masthead />
      <main className="mx-auto max-w-[1280px] px-[22px] pb-[90px] pt-8">
        <div className="pb-3">
          <Link href="/" className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2">
            ← Front page
          </Link>
        </div>
        <header
          style={{ border: "2px solid var(--ink)", borderRadius: 12, background: desk.color, padding: "26px 28px", boxShadow: "7px 7px 0 var(--ink)" }}
        >
          <p className="font-label uppercase text-ink" style={{ fontSize: 10, letterSpacing: "0.18em" }}>The desk of</p>
          <h1 className="font-ui font-black uppercase text-ink" style={{ fontSize: "clamp(32px,5vw,48px)", letterSpacing: "-0.02em", lineHeight: 1 }}>{desk.desk}</h1>
          <p className="mt-2 font-label uppercase text-ink" style={{ fontSize: 10, letterSpacing: "0.1em" }}>
            {cards.length} open question{cards.length === 1 ? "" : "s"}
          </p>
        </header>
        <div className="py-5">
          <DeskChips active={category} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ justifyItems: "stretch" }}>
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
