"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { login, signIn } from "./api";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await login(email, password);
      // Publishing to the store re-renders every consumer, including the
      // console that is currently showing this form.
      signIn(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-xl border border-line bg-bg px-4 py-3 text-small text-ink outline-none transition-colors focus:border-brand-ink";

  return (
    <div className="grid min-h-svh place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-bg p-7 shadow-[var(--shadow-lift)]">
        <h1 className="text-h3 tracking-[-0.02em]">Agent console</h1>
        <p className="mt-2 text-small text-ink-2">Sign in to pick up waiting leads.</p>

        <div className="mt-7 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@zanservices.com"
            aria-label="Email"
            autoComplete="username"
            required
            className={field}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            required
            className={field}
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-small text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className={cn(
            "mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full",
            "bg-ink text-small font-medium text-bg transition-colors hover:bg-brand-dark disabled:opacity-50",
          )}
        >
          <LogIn aria-hidden className="size-4" />
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
