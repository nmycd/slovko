"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { CheckIcon, CrownIcon } from "@/components/icons";
import { FREE_UNIT_COUNT, plans, premiumPerks, type PlanId } from "@/lib/plans";

export function PricingPlans() {
  const router = useRouter();
  const { user, isPremium, premiumKnown, authEnabled, t } = useApp();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: PlanId) {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(plan);
    setError(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) {
      window.location.assign(data.url);
    } else {
      setError(data.error ?? t("common.error"));
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <CrownIcon size={56} className="mx-auto text-gold" />
        <h1 className="mt-3 text-4xl">Slovko Premium</h1>
        <p className="mt-2 text-lg text-muted">
          {t("pricing.subtitle", { n: FREE_UNIT_COUNT })}
        </p>
      </div>

      <ul className="mx-auto mt-8 max-w-sm space-y-2">
        {premiumPerks.map((perk) => (
          <li key={perk} className="flex items-center gap-3 font-bold">
            <CheckIcon size={22} className="shrink-0 text-ok" /> {t(perk)}
          </li>
        ))}
      </ul>

      {!premiumKnown ? null : isPremium ? (
        <p className="mt-10 rounded-2xl bg-ok-soft p-5 text-center font-semibold text-ok-dark">
          {t("pricing.youArePremium")}
        </p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {(Object.keys(plans) as PlanId[]).map((id) => {
            const plan = plans[id];
            const featured = id === "yearly";
            return (
              <div
                key={id}
                className={`card relative flex flex-col p-6 ${featured ? "!border-gold" : ""}`}
              >
                {featured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-0.5 text-xs font-semibold text-[#2a2006]">
                    {t("pricing.bestValue")}
                  </span>
                )}
                <h2 className="text-xl">{t(plan.label)}</h2>
                <p className="mt-2">
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  <span className="text-muted"> / {t(plan.per)}</span>
                </p>
                <p className="mt-1 text-sm font-bold text-muted">{t(plan.note)}</p>
                <button
                  type="button"
                  disabled={busy !== null || !authEnabled}
                  onClick={() => subscribe(id)}
                  className={`btn mt-6 ${featured ? "btn-gold" : ""}`}
                >
                  {t(busy === id ? "pricing.redirecting" : user ? "pricing.subscribe" : "pricing.signInToSubscribe")}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {error && <p className="mt-4 text-center font-bold text-bad">{error}</p>}
      {!authEnabled && (
        <p className="mt-4 text-center text-sm text-muted">
          {t("pricing.notConfigured")}
        </p>
      )}
    </div>
  );
}
