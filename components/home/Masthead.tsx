/**
 * Masthead — the newspaper head: logo plate, tagline, dateline, Surprise me.
 * Logo file: public/logo.png (1996×788 on cream — height-capped, blends on
 * paper). Server component; SurpriseMe is the client island.
 */
import Image from "next/image";
import Link from "next/link";
import { SurpriseMe } from "./SurpriseMe";

export function Masthead() {
  const dateline = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <header className="border-b-4 border-ink">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-1.5">
        <span className="font-label text-[10px] tracking-[0.25em] text-muted uppercase">
          {dateline}
        </span>
        <span className="font-label text-[10px] tracking-[0.25em] text-muted uppercase">
          Anonymous · The public, counted daily
        </span>
      </div>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 pb-4">
        <Link href="/" aria-label="State of Us — front page">
          <Image
            src="/logo.png"
            alt="State of Us"
            width={400}
            height={158}
            priority
            className="h-20 w-auto mix-blend-multiply sm:h-24"
          />
        </Link>
        <p className="font-editorial text-lg italic text-ink-soft">
          You answer. India answers back.
        </p>
        <SurpriseMe variant="masthead" />
      </div>
    </header>
  );
}
