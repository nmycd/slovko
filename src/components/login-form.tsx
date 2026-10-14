"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { LanguageCards } from "@/components/language-picker";
import { safeNext } from "@/lib/redirect";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function LoginForm() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const params = useSearchParams();
  const { user, locale, setLocale, t } = useApp();
  // Where to go after signing in, e.g. the lesson that sent us here.
  const next = safeNext(params.get("next"));
  const fromLesson = next.startsWith("/lesson/");
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(
    params.get("error") ? { kind: "error", text: t("login.linkError") } : null,
  );

  if (!supabase) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-2xl font-black">{t("login.notConfigured.title")}</h1>
        <p className="mt-2 text-muted">{t("login.notConfigured.body")}</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-2xl font-black">{t("login.signedIn")}</h1>
        <p className="mt-2 text-muted">{user.email}</p>
        <button type="button" onClick={() => router.push(next)} className="btn mt-6 w-full">
          {t("login.continue")}
        </button>
      </div>
    );
  }

  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const { data, error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            // The sign-up trigger copies this into the new profile.
            options: { emailRedirectTo: redirectTo(), data: { native_language: locale } },
          });
    setBusy(false);
    if (error) {
      setMessage({ kind: "error", text: error.message });
    } else if (mode === "signup" && !data.session) {
      setMessage({ kind: "info", text: t("login.checkEmail") });
    } else {
      router.push(next);
    }
  }

  async function google() {
    await supabase?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
  }

  return (
    <div>
      <h1 className="text-center text-3xl font-black">
        {t(mode === "signup" ? "login.title.signUp" : fromLesson ? "login.title.fromLesson" : "login.title.signIn")}
      </h1>
      <p className="mt-2 text-center text-muted">
        {t(mode === "signin" ? "login.sub.signIn" : "login.sub.signUp")}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        {mode === "signup" && (
          <fieldset className="mb-5 space-y-2">
            <legend className="mb-2 font-extrabold">{t("login.language")}</legend>
            <LanguageCards value={locale} onChange={setLocale} />
            <p className="text-sm text-muted">{t("login.languageHint")}</p>
          </fieldset>
        )}
        <input
          type="email"
          required
          autoComplete="email"
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 outline-none focus:border-brand"
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder={t("login.password")}
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
          {busy ? "…" : t(mode === "signin" ? "login.signIn" : "login.createAccount")}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm font-bold text-muted">
        <span className="h-0.5 flex-1 bg-border" /> {t("login.or")} <span className="h-0.5 flex-1 bg-border" />
      </div>
      <button type="button" onClick={google} className="btn btn-ghost w-full">
        {t("login.google")}
      </button>

      <p className="mt-8 text-center text-muted">
        {t(mode === "signin" ? "login.newHere" : "login.haveAccount")}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
          className="font-extrabold text-brand"
        >
          {t(mode === "signin" ? "login.toSignUp" : "login.toSignIn")}
        </button>
      </p>
    </div>
  );
}
