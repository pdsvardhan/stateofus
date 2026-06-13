/**
 * Desk stamp — the editorial section mark on every question page.
 * Category → desk name + accent from DESK_BY_CATEGORY (locked desk names).
 */
import { DESK_BY_CATEGORY, type Category } from "@/lib/catalogue/enums";

export function DeskStamp({ category }: { category: string }) {
  const desk = DESK_BY_CATEGORY[category as Category];
  if (!desk) return null;
  return (
    <span
      className="inline-block border-2 border-ink px-2 py-0.5 font-label text-xs font-bold tracking-[0.15em] uppercase"
      style={{ backgroundColor: desk.color, color: "var(--ink)" }}
    >
      {desk.desk}
    </span>
  );
}
