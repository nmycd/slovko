"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { BoltIcon, CheckIcon, CrownIcon, FlameIcon } from "@/components/icons";
import { LanguageSelect } from "@/components/language-picker";

export function AccountPanel() {
  const router = useRouter();
  const { ready, user, isPremium, progress, streak, signOut, authEnabled, t } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;
  if (!authEnabled || !user) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-2xl font-black">{t("account.notSignedIn")}</h1>
        <Link href="/login" className="btn mt-6 w-full">
          {t("account.signIn")}
        </Link>
      </div>
    );
  }

  const completed = Object.keys(progress.completed).length;

  async function manageBilling() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) window.location.assign(data.url);
    else {
      setError(data.error ?? t("common.error"));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t("account.title")}</h1>
        <p className="text-muted">{user.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<FlameIcon className="text-accent" />} value={streak} label={t("stats.streak")} />
        <Stat icon={<BoltIcon className="text-gold" />} value={progress.xp} label={t("stats.xp")} />
        <Stat icon={<CheckIcon className="text-ok" />} value={completed} label={t("account.lessons")} />
      </div>

      <div className="card p-5">
        <label htmlFor="native-language" className="text-lg font-black">
          {t("account.language")}
        </label>
        <p className="mt-1 text-muted">{t("account.languageBody")}</p>
        <LanguageSelect id="native-language" className="mt-4 w-full" />
      </div>

      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <CrownIcon className="text-gold" /> {t(isPremium ? "account.premium" : "account.free")}
        </h2>
        <p className="mt-1 text-muted">
          {t(isPremium ? "account.premiumBody" : "account.freeBody")}
        </p>
        {isPremium ? (
          <button type="button" onClick={manageBilling} disabled={busy} className="btn btn-ghost mt-4 w-full">
            {t("account.manageBilling")}
          </button>
        ) : (
          <Link href="/pricing" className="btn btn-gold mt-4 w-full">
            {t("account.goPremium")}
          </Link>
        )}
        {error && <p className="mt-3 text-sm font-bold text-bad">{error}</p>}
      </div>

      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
        className="btn btn-ghost w-full"
      >
        {t("account.signOut")}
      </button>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="card p-4">
      {icon}
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="text-sm font-bold text-muted">{label}</p>
    </div>
  );
}
