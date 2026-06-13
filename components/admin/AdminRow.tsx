"use client";

/**
 * One question row in the admin list — lifecycle buttons (through the
 * transition endpoint, approval gate intact), feature toggle, edit link.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ALLOWED_TRANSITIONS } from "@/lib/lifecycle-map";
import type { LifecycleState } from "@/lib/catalogue/enums";

const STATUS_BG: Record<string, string> = {
  draft: "var(--paper-deep)",
  active: "var(--lime)",
  paused: "var(--gold)",
  frozen: "var(--lavender)",
  archived: "var(--muted-warm)",
};

export function AdminRow({
  row,
  featured,
}: {
  row: {
    id: string;
    category: string;
    text: string;
    mode: string;
    status: string;
    source: string;
    sample_n: number;
    warnings: number;
  };
  featured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(featured);

  async function transition(to: LifecycleState) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const body: { to: LifecycleState; approved_by?: string } = { to };
      if (row.status === "draft" && to === "active") {
        const approver = window.prompt("Record approval — approved by:", "vardhan");
        if (!approver) {
          setBusy(false);
          return;
        }
        body.approved_by = approver;
      }
      const res = await fetch(`/api/admin/questions/${row.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(b?.error ?? `transition failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFeature() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/questions/${row.id}/feature`, { method: "POST" });
      if (res.ok) {
        const d = (await res.json()) as { featured: boolean };
        setIsFeatured(d.featured);
      }
    } finally {
      setBusy(false);
    }
  }

  const nextStates = ALLOWED_TRANSITIONS[row.status as LifecycleState] ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2 border-2 border-ink bg-paper-bright px-3 py-2">
      <span className="w-16 font-label text-xs font-bold text-ink">{row.id}</span>
      <span
        className="border border-ink px-1.5 py-0.5 font-label text-[10px] font-bold uppercase"
        style={{ backgroundColor: STATUS_BG[row.status] ?? "var(--paper-deep)" }}
      >
        {row.status}
      </span>
      <Link
        href={`/admin/q/${row.id}`}
        className="min-w-0 flex-1 truncate font-editorial text-sm font-bold text-ink hover:underline"
        title={row.text}
      >
        {row.text}
      </Link>
      {row.warnings > 0 && (
        <span className="border border-fire bg-fire-tint px-1.5 font-label text-[10px] font-bold text-ink" title="import warnings">
          ⚠ {row.warnings}
        </span>
      )}
      <span className="font-label text-[10px] text-muted">{row.sample_n.toLocaleString("en-IN")}</span>
      <button
        onClick={toggleFeature}
        disabled={busy}
        title={isFeatured ? "Remove from editorial picks" : "Feature on the front page"}
        className={`border-2 border-ink px-2 py-0.5 font-label text-[10px] font-bold ${
          isFeatured ? "bg-gold text-ink" : "bg-paper-white text-ink"
        }`}
      >
        ★
      </button>
      {nextStates.map((s) => (
        <button
          key={s}
          onClick={() => transition(s)}
          disabled={busy}
          className="border-2 border-ink bg-paper-white px-2 py-0.5 font-label text-[10px] font-bold text-ink uppercase hover:bg-paper-deep disabled:opacity-50"
        >
          {s === "active" ? "activate" : s}
        </button>
      ))}
      {error && (
        <span role="alert" className="w-full font-label text-[10px] text-fire">
          {error}
        </span>
      )}
    </div>
  );
}
