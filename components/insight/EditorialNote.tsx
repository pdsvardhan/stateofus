/**
 * EditorialNote — FIX 3b (A2/C2). The curated "From the desk" note: a
 * hand-written, surprising observation that gives a result the brand's
 * editorial voice — distinct from the generated (templated) insight cards.
 * Renders only when a question carries an editorial_note; absent → nothing.
 * Server-safe, no client hooks, tokens only (gold highlighter kicker, N2 style).
 */
export default function EditorialNote({ note }: { note: string }) {
  return (
    <article className="rounded-[10px] border-2 border-ink bg-paper-white px-5 py-4 shadow-[4px_4px_0_var(--ink)]">
      <span
        className="inline-block px-1 font-label text-[10px] font-bold uppercase tracking-[.14em] text-ink"
        style={{
          backgroundImage:
            "linear-gradient(180deg,transparent 32%,var(--gold) 32%,var(--gold) 92%,transparent 92%)",
        }}
      >
        From the desk
      </span>
      <p className="mt-2 font-editorial text-[16px] italic leading-[1.5] text-ink">{note}</p>
    </article>
  );
}
