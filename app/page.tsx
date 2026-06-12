/**
 * Homepage shell — scaffold only.
 *
 * @intentional-placeholder feat-homepage-curation (build #13) replaces this
 * with the curated multi-source front page from the v5 prototype. The scaffold
 * ships a masthead so /  renders something honest, not an empty chart.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="font-label text-xs tracking-[0.3em] uppercase text-muted">
        The public, counted daily
      </p>
      <h1 className="font-editorial text-6xl font-extrabold tracking-tight text-ink">
        State of Us
      </h1>
      <p className="font-editorial text-xl italic text-ink-soft">
        You answer. India answers back.
      </p>
      <div className="mt-4 border-4 border-ink bg-paper-bright px-6 py-3">
        <p className="font-label text-sm text-ink">
          FIRST EDITION IN PRODUCTION — the presses are being built.
        </p>
      </div>
    </main>
  );
}
