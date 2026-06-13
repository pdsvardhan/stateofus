"use client";

/**
 * Admin login — token in, sou_admin cookie out. Behind Authentik at the
 * proxy; this is the app-level second layer (adr-006 §3).
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(b?.error ?? "login failed");
      }
      router.push(params.get("next") ?? "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 font-editorial text-3xl font-extrabold text-ink">Editor&apos;s desk</h1>
      <p className="mb-4 font-label text-xs text-muted">State of Us — governance console</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Admin token"
          autoFocus
          className="border-2 border-ink bg-paper-white px-3 py-2 font-label text-sm text-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || token.length < 8}
          className="border-2 border-ink bg-ink px-4 py-2 font-label text-sm font-bold text-paper-bright disabled:opacity-50"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
        {error && (
          <p role="alert" className="border-2 border-fire bg-fire-tint px-3 py-2 font-label text-xs text-ink">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
