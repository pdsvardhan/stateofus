/**
 * Related questions — REL2 (one big blind-pick next + related chips) feeding
 * AC353/AC384: every result page offers ≥1 related/next question.
 * Server component, mounted by the experience page below the client island.
 */
import Link from "next/link";
import { getRelated } from "@/lib/discovery/queries";

export function RelatedRow({ questionId }: { questionId: string }) {
  const related = getRelated(questionId, 3);
  if (related.length === 0) return null;
  const [next, ...chips] = related;

  return (
    <section aria-label="Keep going" className="mt-8 border-t-4 border-ink pt-4">
      <p className="mb-2 font-label text-xs font-bold tracking-[0.2em] text-muted uppercase">
        Keep the count going
      </p>
      <Link
        href={`/q/${next.id}`}
        className="block border-4 border-ink bg-lime p-4 transition-transform hover:-translate-y-1 hover:shadow-[5px_5px_0_var(--ink)]"
      >
        <span className="font-label text-[10px] font-bold tracking-[0.2em] text-ink uppercase">
          Next up — blind pick
        </span>
        <span className="mt-1 block font-editorial text-xl font-extrabold leading-snug text-ink">
          {next.text}
        </span>
      </Link>
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <Link
              key={c.id}
              href={`/q/${c.id}`}
              className="border-2 border-ink bg-paper-bright px-3 py-1.5 font-editorial text-sm font-bold text-ink hover:bg-paper-white"
            >
              {c.text}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
