/**
 * Inbound-share context — feat-share-landing (designed from the SO1 flow
 * spec in v5 language, per adr-006 §2; owner reviews the built page).
 *
 * AC382: a shared link (?s=1) opens the question with shared-result context —
 * this band tells the visitor a count was passed to them and how big it is,
 * WITHOUT spoiling the result (answer-first integrity).
 */
export function SharedContextBand({ sampleN }: { sampleN: number }) {
  return (
    <div className="border-4 border-ink bg-gold-tint">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="rotate-[-4deg] border-2 border-ink bg-gold px-2 py-0.5 font-label text-xs font-bold tracking-[0.2em] text-ink">
          PASSED ALONG
        </span>
        <span className="font-editorial text-sm italic text-ink">
          Someone shared this count with you
          {sampleN > 0 && (
            <>
              {" — "}
              <span className="font-label text-xs font-bold not-italic">
                {sampleN.toLocaleString("en-IN")} counted
              </span>
            </>
          )}
          . Answer to unlock it.
        </span>
      </div>
    </div>
  );
}
