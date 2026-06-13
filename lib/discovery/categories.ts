/**
 * Category ↔ slug mapping for /c/[categorySlug] routes.
 */
import { CATEGORIES, type Category } from "@/lib/catalogue/enums";

export function categoryToSlug(category: Category): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const BY_SLUG = new Map<string, Category>(
  CATEGORIES.map((c) => [categoryToSlug(c), c])
);

export function slugToCategory(slug: string): Category | null {
  return BY_SLUG.get(slug) ?? null;
}
