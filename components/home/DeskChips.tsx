/**
 * Desk chip row — faithful port. Six desk pills (desk ink) + ALL DESKS +
 * Explore/Search. Space Mono, 2px ink border, pill, hover lift + hard shadow.
 */
import Link from "next/link";
import { CATEGORIES, DESK_BY_CATEGORY } from "@/lib/catalogue/enums";
import { categoryToSlug } from "@/lib/discovery/categories";

const chip =
  "shrink-0 font-label font-bold uppercase text-ink transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--ink)]";
const chipStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.1em",
  border: "2px solid var(--ink)",
  borderRadius: 100,
  padding: "9px 15px",
  minHeight: 38,
};

export function DeskChips({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap gap-2" style={{ marginBottom: 30 }}>
      <Link
        href="/explore"
        className={chip}
        style={{ ...chipStyle, background: active ? "var(--paper)" : "var(--ink)", color: active ? "var(--ink)" : "var(--paper)" }}
      >
        All desks
      </Link>
      {CATEGORIES.map((c) => {
        const desk = DESK_BY_CATEGORY[c];
        const isActive = active === c;
        return (
          <Link
            key={c}
            href={`/c/${categoryToSlug(c)}`}
            className={chip}
            style={{
              ...chipStyle,
              background: isActive ? "var(--ink)" : desk.color,
              color: isActive ? "var(--paper)" : "var(--ink)",
            }}
          >
            {desk.desk}
          </Link>
        );
      })}
    </div>
  );
}
