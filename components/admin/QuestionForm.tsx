"use client";

/**
 * Question create/edit form — AC365: covers the catalogue schema incl. mode
 * (8), options, bucket/tier targets when the mode demands them, DV selection
 * (primary + 0-2 secondaries from 14), insight type, geo, reveal pattern.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, DV_IDS, MODES } from "@/lib/catalogue/enums";

export type FormValue = {
  id?: string;
  category: string;
  text: string;
  mode: string;
  optionsText: string; // one per line
  targetsText: string; // one per line (buckets/tiers)
  primary_dv: string;
  secondary_dvs: string[];
  insight_type: string;
  geo: boolean;
  reveal_pattern: string;
  subcategory: string;
  notes: string;
};

const NEEDS_TARGETS = new Set(["bucket_sort", "tier_placement"]);

export function QuestionForm({
  initial,
  questionId,
}: {
  initial: FormValue;
  questionId?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<FormValue>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof FormValue>(k: K, val: FormValue[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const options = v.optionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label, i) => ({ key: `opt-${i}`, label }));
    const targetLabels = v.targetsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      ...(questionId ? {} : { id: v.id?.trim() || undefined }),
      category: v.category,
      text: v.text,
      mode: v.mode,
      options,
      targets: NEEDS_TARGETS.has(v.mode)
        ? {
            kind: v.mode === "bucket_sort" ? ("buckets" as const) : ("tiers" as const),
            labels: targetLabels,
          }
        : null,
      primary_dv: v.primary_dv,
      secondary_dvs: v.secondary_dvs.filter((d) => d !== v.primary_dv).slice(0, 2),
      insight_type: v.insight_type || null,
      geo: v.geo,
      reveal_pattern: v.reveal_pattern,
      subcategory: v.subcategory || null,
      notes: v.notes || null,
    };
    try {
      const res = await fetch(
        questionId ? `/api/admin/questions/${questionId}` : "/api/admin/questions",
        {
          method: questionId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const body = (await res.json().catch(() => null)) as
        | { id?: string; error?: string; issues?: { path: (string | number)[]; message: string }[] }
        | null;
      if (!res.ok) {
        throw new Error(
          body?.issues?.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") ??
            body?.error ??
            "save failed"
        );
      }
      setMsg("Saved.");
      if (!questionId && body?.id) router.push(`/admin/q/${body.id}`);
      else router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "save failed");
    } finally {
      setBusy(false);
    }
  }

  const label = "font-label text-[11px] font-bold tracking-wider text-ink uppercase";
  const input =
    "border-2 border-ink bg-paper-white px-2.5 py-1.5 font-ui text-sm text-ink focus:outline-none w-full";

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {!questionId && (
        <div>
          <label className={label}>Id (blank = auto NEW-n)</label>
          <input className={input} value={v.id ?? ""} onChange={(e) => set("id", e.target.value)} />
        </div>
      )}
      <div>
        <label className={label}>Category</label>
        <select className={input} value={v.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Question text (1-2 lines, ≤200 chars)</label>
        <textarea
          className={input}
          rows={2}
          maxLength={200}
          value={v.text}
          onChange={(e) => set("text", e.target.value)}
          required
        />
      </div>
      <div>
        <label className={label}>Mode</label>
        <select className={input} value={v.mode} onChange={(e) => set("mode", e.target.value)}>
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Primary DV</label>
        <select className={input} value={v.primary_dv} onChange={(e) => set("primary_dv", e.target.value)}>
          {DV_IDS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Options (one per line)</label>
        <textarea
          className={input}
          rows={5}
          value={v.optionsText}
          onChange={(e) => set("optionsText", e.target.value)}
          required
        />
      </div>
      {NEEDS_TARGETS.has(v.mode) && (
        <div>
          <label className={label}>
            {v.mode === "bucket_sort" ? "Buckets" : "Tiers"} (one per line)
          </label>
          <textarea
            className={input}
            rows={5}
            value={v.targetsText}
            onChange={(e) => set("targetsText", e.target.value)}
          />
        </div>
      )}
      <div>
        <label className={label}>Secondary DVs (≤2)</label>
        <select
          multiple
          className={`${input} h-28`}
          value={v.secondary_dvs}
          onChange={(e) =>
            set(
              "secondary_dvs",
              Array.from(e.target.selectedOptions).map((o) => o.value)
            )
          }
        >
          {DV_IDS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Insight type</label>
        <input
          className={input}
          value={v.insight_type}
          onChange={(e) => set("insight_type", e.target.value)}
          placeholder="Majority vs you"
        />
        <label className={`${label} mt-3 block`}>Reveal pattern</label>
        <select
          className={input}
          value={v.reveal_pattern}
          onChange={(e) => set("reveal_pattern", e.target.value)}
        >
          <option value="threshold">threshold (reveal at 10)</option>
          <option value="immediate">immediate</option>
          <option value="progressive">progressive (early returns from 3)</option>
        </select>
        <label className="mt-3 flex items-center gap-2">
          <input type="checkbox" checked={v.geo} onChange={(e) => set("geo", e.target.checked)} />
          <span className={label}>Geo question (map DVs + region insights)</span>
        </label>
      </div>
      <div>
        <label className={label}>Subcategory</label>
        <input className={input} value={v.subcategory} onChange={(e) => set("subcategory", e.target.value)} />
        <label className={`${label} mt-3 block`}>Notes</label>
        <textarea className={input} rows={2} value={v.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="border-2 border-ink bg-ink px-5 py-2 font-label text-sm font-bold text-paper-bright disabled:opacity-50"
        >
          {busy ? "Saving…" : questionId ? "Save changes" : "Create draft"}
        </button>
        {msg && <span className="font-label text-xs text-ink">{msg}</span>}
      </div>
    </form>
  );
}
