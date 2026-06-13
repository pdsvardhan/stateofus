/**
 * Category desk page — feat-discovery (AC351).
 * Desk header in the desk's ink + the desk's active questions.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { DESK_BY_CATEGORY } from "@/lib/catalogue/enums";
import { slugToCategory } from "@/lib/discovery/categories";
import { getByCategory } from "@/lib/discovery/queries";
import { CategoryChips } from "@/components/home/CategoryChips";
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
    <main className="mx-auto max-w-5xl px-4 pb-16">
      <div className="py-3">
        <Link href="/" className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2">
          ← Front page
        </Link>
      </div>
      <header
        className="border-4 border-ink px-5 py-6"
        style={{ backgroundColor: desk.color }}
      >
        <p className="font-label text-xs tracking-[0.25em] text-ink uppercase">Desk</p>
        <h1 className="font-editorial text-4xl font-extrabold text-ink">{desk.desk}</h1>
        <p className="mt-1 font-label text-xs text-ink">
          {cards.length} open questions · {category}
        </p>
      </header>
      <CategoryChips active={category} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <QuestionCard key={c.id} card={c} wide />
        ))}
      </div>
    </main>
  );
}
