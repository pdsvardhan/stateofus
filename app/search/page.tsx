/**
 * Search — feat-discovery (AC352): matches question text/title/subcategory
 * and desk names. Result CONTENT is never searchable (privacy + scope rail).
 */
import Link from "next/link";
import { searchQuestions } from "@/lib/discovery/queries";
import { DESK_BY_CATEGORY } from "@/lib/catalogue/enums";
import { categoryToSlug } from "@/lib/discovery/categories";
import { QuestionCard } from "@/components/discovery/QuestionCard";

export const dynamic = "force-dynamic";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const query = (q ?? "").trim().slice(0, 80);
  const results = query.length >= 2 ? searchQuestions(query) : null;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16">
      <div className="py-3">
        <Link href="/" className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2">
          ← Front page
        </Link>
      </div>
      <h1 className="mb-4 font-editorial text-3xl font-extrabold text-ink">Search the catalogue</h1>

      <form action="/search" method="get" role="search" className="mb-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search questions and desks…"
          autoFocus
          className="w-full border-2 border-ink bg-paper-white px-3 py-2 font-ui text-ink placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="border-2 border-ink bg-ink px-4 py-2 font-label text-sm font-bold text-paper-bright"
        >
          Search
        </button>
      </form>

      {results === null ? (
        <p className="font-editorial italic text-ink-soft">
          Type at least two characters — questions and desks only, never answers.
        </p>
      ) : (
        <>
          {results.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {results.categories.map((c) => (
                <Link
                  key={c}
                  href={`/c/${categoryToSlug(c)}`}
                  className="border-2 border-ink px-3 py-1 font-label text-xs font-bold tracking-wider text-ink uppercase"
                  style={{ backgroundColor: DESK_BY_CATEGORY[c].color }}
                >
                  {DESK_BY_CATEGORY[c].desk}
                </Link>
              ))}
            </div>
          )}
          <p className="mb-3 font-label text-xs text-muted">
            {results.questions.length} matching questions
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.questions.map((c) => (
              <QuestionCard key={c.id} card={c} wide />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
