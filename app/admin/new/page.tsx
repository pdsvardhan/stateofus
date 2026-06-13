/**
 * Admin — create a new question (drafts only; activation goes through the
 * approval-gated transition).
 */
import Link from "next/link";
import { QuestionForm } from "@/components/admin/QuestionForm";

export const dynamic = "force-dynamic";

export default function AdminNewQuestionPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      <div className="py-4">
        <Link href="/admin" className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2">
          ← Editor&apos;s desk
        </Link>
      </div>
      <h1 className="mb-4 font-editorial text-2xl font-extrabold text-ink">New question (draft)</h1>
      <QuestionForm
        initial={{
          category: "Fun and Internet Chaos",
          text: "",
          mode: "quick_pick",
          optionsText: "",
          targetsText: "",
          primary_dv: "split",
          secondary_dvs: [],
          insight_type: "Majority vs you",
          geo: false,
          reveal_pattern: "threshold",
          subcategory: "",
          notes: "",
        }}
      />
    </main>
  );
}
