"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function LoginForm() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useApp();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(
    params.get("error") ? { kind: "error", text: "That sign-in link didn't work. Try again." } : null,
  );

  if (!supabase) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-2xl font-black">Accounts aren&apos;t set up yet</h1>
        <p className="mt-2 text-muted">
          Add your Supabase keys to <code>.env.local</code> to enable sign-in. Until then, progress is
          saved on this device.
        </p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-2xl font-black">You&apos;re signed in</h1>
        <p className="mt-2 text-muted">{user.email}</p>
        <button type="button" onClick={() => router.push("/learn")} className="btn mt-6 w-full">
          Continue learning
        </button>
      </div>
    );
  }

  const redirectTo = () => `${window.location.origin}/auth/callback?next=/learn`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const { data, error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
    setBusy(false);
    if (error) {
      setMessage({ kind: "error", text: error.message });
    } else if (mode === "signup" && !data.session) {
      setMessage({ kind: "info", text: "Check your email to confirm your account." });
    } else {
      router.push("/learn");
    }
  }

  async function google() {
    await supabase?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
  }

  return (
    <div>
      <h1 className="text-center text-3xl font-black">
        {mode === "signin" ? "Welcome back" : "Create your profile"}
      </h1>
      <p className="mt-2 text-center text-muted">
        {mode === "signin"
          ? "Sign in to sync your progress."
          : "Save your progress and keep your streak on every device."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 outline-none focus:border-brand"
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 outline-none focus:border-brand"
        />
        {message && (
          <p className={`text-sm font-bold ${message.kind === "error" ? "text-bad" : "text-ok-dark"}`}>
            {message.text}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn w-full">
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm font-bold text-muted">
        <span className="h-0.5 flex-1 bg-border" /> or <span className="h-0.5 flex-1 bg-border" />
      </div>
      <button type="button" onClick={google} className="btn btn-ghost w-full">
        Continue with Google
      </button>

      <p className="mt-8 text-center text-muted">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
          className="font-extrabold text-brand"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
