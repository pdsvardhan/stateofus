"use client";

/**
 * Skip — always available, records NOTHING (product rail; AC338).
 * Plain "Skip" chip per the SKIP2 lock (slide-in-next animation, no counter,
 * no glyph). Navigates to the next unanswered question.
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
      className="border-2 border-ink bg-paper-bright px-3 py-1.5 font-label text-sm font-bold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
    >
      Skip
    </button>
  );
}
