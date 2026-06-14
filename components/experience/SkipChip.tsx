"use client";

/**
 * Skip — always available, records NOTHING (product rail; AC338). v5 treatment
 * (line 344): a GOLD mono pill in the answer-screen header, top-right. SKIP2
 * lock — no counter, no glyph. Navigates to the next unanswered question.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SkipChip({ questionId }: { questionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function skip() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/questions/next?after=${encodeURIComponent(questionId)}`);
      if (res.ok) {
        const { question_id } = (await res.json()) as { question_id: string };
        router.push(`/q/${question_id}`);
        return;
      }
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={skip}
      disabled={busy}
      className="rounded-full border-2 border-ink bg-gold px-4 py-2 font-label text-[10.5px] font-bold uppercase tracking-[.1em] text-ink transition-transform duration-150 hover:-translate-x-px hover:-translate-y-0.5 hover:rotate-[-2deg] hover:shadow-[3px_4px_0_var(--ink)] disabled:opacity-60"
    >
      Skip
    </button>
  );
}
