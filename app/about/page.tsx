/**
 * About — feat-discovery (item-186). Faithful port of the v5 prototype's
 * ABT1 broadsheet manifesto (prototype lines 1003–1042: "Your opinion, never
 * your identity"). Server component; static copy, no client state.
 *
 * Tokens only — no hardcoded hex. Prototype hex → token map:
 *   #18162A → --ink   #F2ECDF → --paper       #F7F1E2 → --paper-bright
 *   #FF5A47 → --fire   #BFEE4F → --lime        #FFC53D → --gold
 *   #4A4744 → --ink-warm
 * h1Size 64px(wide>980)/40px(narrow) → clamp; aboutCols repeat(3,1fr)/1fr → grid.
 */
import Link from "next/link";
import { Masthead } from "@/components/home/Masthead";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SurpriseMe } from "@/components/home/SurpriseMe";

export const metadata = {
  title: "About — State of Us",
  description:
    "State of Us counts what India thinks — never who you are. A public-opinion press where the only byline is the country's.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Masthead />
      <main className="mx-auto max-w-[900px] px-[22px] pb-[90px] pt-10">
        <div className="pb-7">
          <Link href="/" className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2">
            ← Front page
          </Link>
        </div>

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

        <p
          className="font-editorial italic"
          style={{ fontSize: 19, lineHeight: 1.45, maxWidth: 600, margin: "0 0 36px", color: "var(--ink-warm)" }}
        >
          State of Us counts what India thinks — never who you are. A
          public-opinion press where the only byline is the country&apos;s.
        </p>

        {/* Three-step ledger — aboutCols: repeat(3,1fr) wide / 1fr narrow */}
        <div className="mb-[26px] grid grid-cols-1 gap-[14px] md:grid-cols-3">
          <div
            className="font-editorial"
            style={{ border: "2px solid var(--ink)", borderRadius: 10, background: "var(--paper-bright)", padding: 20 }}
          >
            <div className="font-ui italic" style={{ fontWeight: 900, fontSize: 28, color: "var(--fire)", marginBottom: 8 }}>
              01
            </div>
            <div className="font-ui uppercase" style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
              Answer
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.45, color: "var(--ink-warm)" }}>
              One question, under a minute. Tap, swipe, sort — never a form.
            </div>
          </div>

          <div
            className="font-editorial text-ink"
            style={{ border: "2px solid var(--ink)", borderRadius: 10, background: "var(--gold)", padding: 20 }}
          >
            <div className="font-ui italic" style={{ fontWeight: 900, fontSize: 28, marginBottom: 8 }}>
              02
            </div>
            <div className="font-ui uppercase" style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
              See the split
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.45 }}>
              Your vote unlocks the country&apos;s answer — live, visual, surprising.
            </div>
          </div>

          <div
            className="font-editorial"
            style={{ border: "2px solid var(--ink)", borderRadius: 10, background: "var(--paper-bright)", padding: 20 }}
          >
            <div className="font-ui italic" style={{ fontWeight: 900, fontSize: 28, color: "var(--fire)", marginBottom: 8 }}>
              03
            </div>
            <div className="font-ui uppercase" style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
              Go deeper
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.45, color: "var(--ink-warm)" }}>
              Where you landed, what it means, and the next thread to pull.
            </div>
          </div>
        </div>

        {/* The promise — lime plate with hard ink shadow */}
        <div
          className="mb-[26px]"
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
        </div>

        {/* The question kitchen — editorial pipeline */}
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
            <span
              className="font-label uppercase"
              style={{ fontSize: 10, letterSpacing: "0.1em", border: "1.5px solid var(--ink)", borderRadius: 100, padding: "6px 12px", fontWeight: 700 }}
            >
              Research
            </span>
            <span style={{ fontWeight: 900 }}>→</span>
            <span
              className="font-label uppercase"
              style={{ fontSize: 10, letterSpacing: "0.1em", border: "1.5px solid var(--ink)", borderRadius: 100, padding: "6px 12px", fontWeight: 700 }}
            >
              Review
            </span>
            <span style={{ fontWeight: 900 }}>→</span>
            <span
              className="font-label uppercase"
              style={{ fontSize: 10, letterSpacing: "0.1em", border: "1.5px solid var(--ink)", borderRadius: 100, padding: "6px 12px", fontWeight: 700 }}
            >
              Selection
            </span>
            <span style={{ fontWeight: 900 }}>→</span>
            <span
              className="font-label uppercase"
              style={{ fontSize: 10, letterSpacing: "0.1em", border: "1.5px solid var(--ink)", borderRadius: 100, padding: "6px 12px", fontWeight: 700, background: "var(--lime)" }}
            >
              Front page
            </span>
          </div>
        </div>
      </main>
      <SiteFooter />
      <SurpriseMe variant="fab" />
    </div>
  );
}
