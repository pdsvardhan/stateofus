/**
 * House rules — faithful port. Lime card, 5 numbered rules (verbatim v5 copy,
 * incl. the privacy-first reframe of rule 02).
 */
const RULES = [
  "Answer first — results unlock after your vote.",
  "Privacy first — your opinion counts, your identity never does.",
  "Skip anything, judgement-free.",
  "Every count shows its sample — small counts say so.",
  "Questions retire; results stay public.",
];

export function HouseRules() {
  return (
    <aside aria-label="House rules" style={{ border: "2px solid var(--ink)", borderRadius: 10, background: "var(--lime)", padding: 20 }}>
      <div className="font-label font-bold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.18em", marginBottom: 12 }}>
        House rules
      </div>
      <div className="flex flex-col gap-[9px]">
        {RULES.map((rule, i) => (
          <div key={i} className="flex items-baseline gap-[9px]">
            <span className="font-label font-bold" style={{ fontSize: 10 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: "var(--font-editorial)", fontSize: 14.5, lineHeight: 1.4 }}>{rule}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
