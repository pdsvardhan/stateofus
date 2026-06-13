/**
 * GET /api/og/:id?style=d1|d2|d3 — share-card image (feat-og-image-gen).
 *
 * AC331: question + primary result + sample size on a server-rendered card.
 * AC333: <2s or cached — cards cache to /data (or ./data) keyed on
 * (id, style, sample bucket) so a hot share never re-renders.
 *
 * NOTE on colors: satori can't read CSS custom properties, so the adr-005
 * token VALUES are inlined here (paper #F2ECDF, ink #18162A, fire #FF5A47,
 * lime #BFEE4F, gold #FFC53D). Source of truth stays app/globals.css — if
 * tokens change, change both (grep marker: ADR005-TOKENS).
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { rawDb } from "@/lib/db/client";
import { decideReveal, type RevealPattern } from "@/lib/results";
import { computeTopline } from "@/lib/share/topline";
import { DESK_BY_CATEGORY, type Category, type Mode } from "@/lib/catalogue/enums";
import type { QuestionOption } from "@/lib/types";

export const dynamic = "force-dynamic";

const STYLES = new Set(["d1", "d2", "d3"]);

// ADR005-TOKENS (inlined for satori — see file header)
const C = {
  paper: "#F2ECDF",
  paperBright: "#F7F1E2",
  ink: "#18162A",
  inkSoft: "#34304E",
  muted: "#6B6478",
  fire: "#FF5A47",
  lime: "#BFEE4F",
  gold: "#FFC53D",
};

function loadFonts() {
  const dir = join(process.cwd(), "assets", "fonts");
  return [
    { name: "Archivo", data: readFileSync(join(dir, "Archivo-Bold.ttf")), weight: 700 as const },
    { name: "Spectral", data: readFileSync(join(dir, "Spectral-ExtraBold.ttf")), weight: 800 as const },
    { name: "SpaceMono", data: readFileSync(join(dir, "SpaceMono-Regular.ttf")), weight: 400 as const },
  ];
}

function cachePath(id: string, style: string, sampleBucket: number): string {
  const base = process.env.OG_CACHE_DIR ?? join(dirname(process.env.DATABASE_FILE ?? "./data/x"), "og-cache");
  return join(base, `${id}-${style}-${sampleBucket}.png`);
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const styleParam = req.nextUrl.searchParams.get("style") ?? "d2";
  const style = STYLES.has(styleParam) ? styleParam : "d2";
  const download = req.nextUrl.searchParams.get("download") === "1";

  const q = rawDb
    .prepare(
      "SELECT id, category, text, mode, options_json, status, reveal_pattern FROM questions WHERE id = ?"
    )
    .get(id) as
    | {
        id: string;
        category: string;
        text: string;
        mode: Mode;
        options_json: string;
        status: string;
        reveal_pattern: RevealPattern;
      }
    | undefined;
  if (!q || q.status === "draft") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const agg = rawDb
    .prepare(
      "SELECT agg_json, sample_n FROM question_aggregates WHERE question_id = ? AND dim = 'overall' AND dim_key = ''"
    )
    .get(q.id) as { agg_json: string; sample_n: number } | undefined;
  const sampleN = agg?.sample_n ?? 0;
  const reveal = decideReveal(q.reveal_pattern ?? "threshold", sampleN);

  // cache bucket: result changes slowly at scale — re-render every 25 answers
  const bucket = Math.floor(sampleN / 25);
  const cached = cachePath(q.id, style, bucket);
  if (existsSync(cached)) {
    return new NextResponse(new Uint8Array(readFileSync(cached)), {
      headers: pngHeaders(q.id, download, true),
    });
  }

  const options = JSON.parse(q.options_json) as QuestionOption[];
  const topline = reveal.revealed
    ? computeTopline(q.mode, agg ? JSON.parse(agg.agg_json) : null, options, sampleN)
    : null;
  const desk = DESK_BY_CATEGORY[q.category as Category];
  const deskColor =
    desk?.color.includes("fire") ? C.fire
    : desk?.color.includes("lime") ? C.lime
    : desk?.color.includes("gold") ? C.gold
    : C.gold;

  const img = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.paper,
          backgroundImage: "radial-gradient(circle at 10px 10px, rgba(24,22,42,0.08) 2px, transparent 2px)",
          backgroundSize: "26px 26px",
          padding: 48,
          border: `14px solid ${C.ink}`,
        }}
      >
        {/* masthead */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Spectral", fontSize: 44, color: C.ink, fontWeight: 800 }}>
              State of Us
            </span>
            <span style={{ fontFamily: "SpaceMono", fontSize: 17, color: C.muted, letterSpacing: 2 }}>
              YOU ANSWER. INDIA ANSWERS BACK.
            </span>
          </div>
          {desk && (
            <span
              style={{
                fontFamily: "SpaceMono",
                fontSize: 18,
                color: C.ink,
                backgroundColor: deskColor,
                border: `3px solid ${C.ink}`,
                padding: "6px 14px",
                letterSpacing: 2,
              }}
            >
              {desk.desk.toUpperCase()}
            </span>
          )}
        </div>

        {/* question */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: style === "d3" ? "flex-start" : "center",
            paddingTop: 24,
          }}
        >
          <span
            style={{
              fontFamily: "Spectral",
              fontWeight: 800,
              fontSize: q.text.length > 70 ? 44 : 54,
              lineHeight: 1.15,
              color: C.ink,
            }}
          >
            {q.text}
          </span>
        </div>

        {/* result band */}
        {topline ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              backgroundColor: style === "d1" ? C.paperBright : C.ink,
              border: `4px solid ${C.ink}`,
              padding: "18px 24px",
            }}
          >
            {topline.pct !== null && (
              <span
                style={{
                  fontFamily: "Archivo",
                  fontWeight: 700,
                  fontSize: 64,
                  color: style === "d1" ? C.fire : C.lime,
                }}
              >
                {topline.pct}%
              </span>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontFamily: "Archivo",
                  fontWeight: 700,
                  fontSize: 30,
                  color: style === "d1" ? C.ink : C.paperBright,
                }}
              >
                {topline.label}
              </span>
              <span
                style={{
                  fontFamily: "SpaceMono",
                  fontSize: 18,
                  color: style === "d1" ? C.inkSoft : C.lime,
                }}
              >
                {topline.statement}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: C.gold,
              border: `4px solid ${C.ink}`,
              padding: "18px 24px",
            }}
          >
            <span style={{ fontFamily: "Archivo", fontWeight: 700, fontSize: 30, color: C.ink }}>
              The count is on — add your answer
            </span>
          </div>
        )}

        {/* footer: trust visible */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 20,
          }}
        >
          <span style={{ fontFamily: "SpaceMono", fontSize: 20, color: C.inkSoft }}>
            {sampleN.toLocaleString("en-IN")} counted · anonymous
          </span>
          <span style={{ fontFamily: "SpaceMono", fontSize: 20, color: C.fire }}>
            stateofus.vault7a.xyz
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: loadFonts() }
  );

  const buf = Buffer.from(await img.arrayBuffer());
  try {
    mkdirSync(dirname(cached), { recursive: true });
    writeFileSync(cached, buf);
  } catch {
    // cache is best-effort; serving the render matters more
  }
  return new NextResponse(new Uint8Array(buf), { headers: pngHeaders(q.id, download, false) });
}

function pngHeaders(id: string, download: boolean, hit: boolean): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=300",
    "X-OG-Cache": hit ? "hit" : "miss",
  };
  if (download) {
    h["Content-Disposition"] = `attachment; filename="state-of-us-${id}.png"`;
  }
  return h;
}
