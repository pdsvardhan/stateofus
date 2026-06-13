/**
 * Masthead — faithful port of the v5 prototype sticky header.
 * Pulsing fire dot + logo (mix-blend multiply), centred tagline, Surprise-me
 * (lime pill w/ dice animation) + About. Server component; SurpriseMe is the
 * client island.
 */
import Image from "next/image";
import Link from "next/link";
import { SurpriseMe } from "./SurpriseMe";

export function Masthead() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "var(--paper)",
        borderBottom: "2px solid var(--ink)",
        boxShadow: "0 1px 0 rgba(24,22,42,.12)",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-[22px] py-[13px]">
        <Link href="/" className="flex items-center gap-2.5" aria-label="State of Us — front page">
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              width: 13,
              height: 13,
              borderRadius: "50%",
              background: "var(--fire)",
              border: "2px solid var(--ink)",
              animation: "cwPulse 2.4s ease-out infinite",
            }}
          />
          <Image
            src="/logo.png"
            alt="State of Us"
            width={300}
            height={118}
            priority
            style={{ height: 38, width: "auto", mixBlendMode: "multiply" }}
          />
        </Link>
        <div className="hidden font-label font-bold uppercase text-ink sm:block" style={{ letterSpacing: "0.22em", fontSize: 11 }}>
          You answer. <span style={{ color: "var(--fire)" }}>India answers back.</span>
        </div>
        <div className="flex items-center gap-2.5">
          <SurpriseMe variant="masthead" />
          <Link
            href="/about"
            className="font-label font-bold uppercase text-ink"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              border: "1.5px solid var(--ink)",
              borderRadius: 100,
              padding: "8px 13px",
              background: "var(--paper)",
            }}
          >
            About
          </Link>
        </div>
      </div>
    </header>
  );
}
