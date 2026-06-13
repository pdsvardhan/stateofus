/**
 * House Rules card — the 5-line numbered manifesto. Rule 02 carries the
 * owner's privacy-first reframe (round-1 answer: "No accounts ever" was
 * wrong — auth hooks exist; the promise is identity, not accounts).
 */
const RULES = [
  "One question, one answer, one count — no forms, no surveys.",
  "Privacy first — your opinion, never your identity.",
  "Skip is always allowed. Nothing is recorded when you do.",
  "Sample sizes stay visible. Small counts say so.",
  "Every result is the real count — no weighting, no editorial thumb.",
];

export function HouseRules() {
  return (
    <aside aria-label="House rules" className="border-2 border-ink bg-paper-bright p-3">
      <h3 className="mb-2 border-b-2 border-ink pb-1 font-label text-sm font-bold tracking-[0.2em] text-ink uppercase">
        House rules
      </h3>
      <ol className="flex flex-col gap-1.5">
        {RULES.map((rule, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-label text-xs font-bold text-fire">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-editorial text-sm leading-snug text-ink">{rule}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
