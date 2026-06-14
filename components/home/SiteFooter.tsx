/**
 * SiteFooter — v5 prototype footer (lines 1049-1052). A single ink-topped band
 * shown at the foot of every public screen. Pure presentational.
 */
export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-paper">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3.5 px-[22px] py-[18px]">
        <span className="font-label text-[10px] uppercase tracking-[.14em] text-muted">
          State of Us · the public, counted · you answer, India answers back
        </span>
      </div>
    </footer>
  );
}
