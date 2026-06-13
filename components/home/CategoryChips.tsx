/**
 * Desk chip row — the six desks, horizontally scrollable on mobile.
 * Chip contrast per FB-011. Server component.
 */
import Link from "next/link";
import { CATEGORIES, DESK_BY_CATEGORY } from "@/lib/catalogue/enums";
import { categoryToSlug } from "@/lib/discovery/categories";

export function CategoryChips({ active }: { active?: string }) {
  return (
    <nav
      aria-label="Desks"
      className="flex gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {CATEGORIES.map((c) => {
        const desk = DESK_BY_CATEGORY[c];
        const isActive = active === c;
        return (
          <Link
            key={c}
            href={`/c/${categoryToSlug(c)}`}
            className={`shrink-0 border-2 border-ink px-3 py-1 font-label text-xs font-bold tracking-wider uppercase transition-transform hover:-translate-y-0.5 ${
              isActive ? "text-paper-bright" : "text-ink"
            }`}
            style={{ backgroundColor: isActive ? "var(--ink)" : desk.color }}
          >
            {desk.desk}
          </Link>
        );
      })}
      <Link
        href="/explore"
        className="shrink-0 border-2 border-ink bg-paper-bright px-3 py-1 font-label text-xs font-bold tracking-wider text-ink uppercase transition-transform hover:-translate-y-0.5"
      >
        Explore all
      </Link>
      <Link
        href="/search"
        className="shrink-0 border-2 border-ink bg-paper-bright px-3 py-1 font-label text-xs font-bold tracking-wider text-ink uppercase transition-transform hover:-translate-y-0.5"
      >
        🔍 Search
      </Link>
    </nav>
  );
}
