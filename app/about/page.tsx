/**
 * About — feat-discovery (item-186). Faithful port of the v5 prototype's
 * ABT1 broadsheet manifesto (prototype lines 1003–1042: "Your opinion, never
 * your identity"). Server component; static copy. iter-6 item-413 adds the
 * editorial motion pass via the AboutFx client layer (scroll reveals, tilt
 * cards, stamped promise, chip pops — 300–700ms, reduced-motion static).
 *
 * Tokens only — no hardcoded hex. Prototype hex → token map:
 *   #18162A → --ink   #F2ECDF → --paper       #F7F1E2 → --paper-bright
 *   #FF5A47 → --fire   #BFEE4F → --lime        #FFC53D → --gold
 *   #4A4744 → --ink-warm
 * h1Size 64px(wide>980)/40px(narrow) → clamp; aboutCols repeat(3,1fr)/1fr → grid.
 */
import { Masthead } from "@/components/home/Masthead";
import { SiteFooter } from "@/components/home/SiteFooter";
import { BackBlock } from "@/components/experience/BackBlock";
import { Reveal, TiltCard, StampIn, PopIn } from "@/components/about/AboutFx";

export const metadata = {
  title: "About — State of Us",
  description:
    "State of Us counts what India thinks — never who you are. A public-opinion press where the only byline is the country's.",
};

const LEDGER: { n: string; title: string; body: string; gold?: boolean }[] = [
  {
    n: "01",
    title: "Answer",
    body: "One question, under a minute. Tap, swipe, sort — never a form.",
  },
  {
    n: "02",
    title: "See the split",
    body: "Your vote unlocks the country's answer — live, visual, surprising.",
    gold: true,
  },
  {
    n: "03",
    title: "Go deeper",
    body: "Where you landed, what it means, and the next thread to pull.",
  },
];

const PIPELINE = ["Research", "Review", "Selection", "Front page"];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Masthead />
      <main className="mx-auto max-w-[900px] px-[22px] pb-[90px] pt-10">
        <div className="pb-7">
          <BackBlock href="/" />
        </div>

        <Reveal y={18}>
          <h1
            className="font-ui text-ink uppercase"
            style={{
              fontWeight: 900,
              fontSize: "clamp(40px,7vw,64px)",
              lineHeight: 0.96,
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
            }}
          >
            Your opinion,
            <br />
            <span style={{ color: "var(--fire)" }}>never your identity.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.1} y={16}>
          <p
            className="font-editorial italic"
            style={{ fontSize: 19, lineHeight: 1.45, maxWidth: 600, margin: "0 0 36px", color: "var(--ink-warm)" }}
          >
            State of Us counts what India thinks — never who you are. A
            public-opinion press where the only byline is the country&apos;s.
          </p>
        </Reveal>

        {/* Three-step ledger — aboutCols: repeat(3,1fr) wide / 1fr narrow */}
        <div className="mb-[26px] grid grid-cols-1 gap-[14px] exp:grid-cols-3">
          {LEDGER.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.08}>
              <TiltCard
                tilt={i % 2 === 0 ? -0.8 : 0.8}
                style={{
                  border: "2px solid var(--ink)",
                  borderRadius: 10,
                  background: step.gold ? "var(--gold)" : "var(--paper-bright)",
                  padding: 20,
                  height: "100%",
                }}
              >
                <div className={`font-editorial ${step.gold ? "text-ink" : ""}`}>
                  <div
                    className="font-ui italic"
                    style={{ fontWeight: 900, fontSize: 28, color: step.gold ? undefined : "var(--fire)", marginBottom: 8 }}
                  >
                    {step.n}
                  </div>
                  <div className="font-ui uppercase" style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.45, color: step.gold ? undefined : "var(--ink-warm)" }}>
                    {step.body}
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        {/* The promise — lime plate, stamped onto the page */}
        <div className="mb-[26px]">
          <StampIn
            style={{
              border: "2px solid var(--ink)",
              borderRadius: 10,
              background: "var(--lime)",
              boxShadow: "5px 5px 0 var(--ink)",
              padding: 24,
            }}
          >
            <div
              className="font-label uppercase"
              style={{ fontSize: 10, letterSpacing: "0.18em", fontWeight: 700, marginBottom: 10 }}
            >
              The promise
            </div>
            <div className="font-editorial" style={{ fontSize: 17, lineHeight: 1.5 }}>
              Your opinion is counted; your identity isn&apos;t. No login, no
              profile, no name on your vote — you&apos;re a device, not a dossier.
              The map places you by rough region only, and you can correct or clear
              it in one tap. Your answer is the only ticket this press will ever ask for.
            </div>
          </StampIn>
        </div>

        {/* The question kitchen — editorial pipeline */}
        <Reveal>
          <div
            style={{ border: "2px solid var(--ink)", borderRadius: 10, background: "var(--paper-bright)", padding: 24 }}
          >
            <div
              className="font-label uppercase"
              style={{ fontSize: 10, letterSpacing: "0.18em", fontWeight: 700, color: "var(--fire)", marginBottom: 10 }}
            >
              The question kitchen
            </div>
            <div className="font-editorial" style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 14 }}>
              Every question is researched, written against house standards,
              reviewed, and hand-picked before it reaches the front page. Bad
              questions die in review — that&apos;s the whole editorial model.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PIPELINE.map((stage, i) => (
                <span key={stage} className="inline-flex items-center gap-2">
                  {i > 0 && (
                    <PopIn index={i * 2 - 1}>
                      <span style={{ fontWeight: 900 }}>→</span>
                    </PopIn>
                  )}
                  <PopIn index={i * 2}>
                    <span
                      className="font-label uppercase"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        border: "1.5px solid var(--ink)",
                        borderRadius: 100,
                        padding: "6px 12px",
                        fontWeight: 700,
                        background: stage === "Front page" ? "var(--lime)" : undefined,
                      }}
                    >
                      {stage}
                    </span>
                  </PopIn>
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
