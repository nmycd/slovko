"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { CheckIcon, CrownIcon } from "@/components/icons";
import { FREE_UNIT_COUNT, plans, premiumPerks, type PlanId } from "@/lib/plans";

export function PricingPlans() {
  const router = useRouter();
  const { user, isPremium, authEnabled } = useApp();
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
      setError(data.error ?? "Something went wrong.");
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <CrownIcon size={56} className="mx-auto text-gold" />
        <h1 className="mt-3 text-4xl font-black">Slovko Premium</h1>
        <p className="mt-2 text-lg text-muted">
          The first {FREE_UNIT_COUNT} units are free forever. Premium unlocks the rest.
        </p>
      </div>

      <ul className="mx-auto mt-8 max-w-sm space-y-2">
        {premiumPerks.map((perk) => (
          <li key={perk} className="flex items-center gap-3 font-bold">
            <CheckIcon size={22} className="shrink-0 text-ok" /> {perk}
          </li>
        ))}
      </ul>

      {isPremium ? (
        <p className="mt-10 rounded-2xl bg-ok-soft p-5 text-center font-extrabold text-ok-dark">
          You&apos;re Premium. Ďakujeme!
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
                  <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-0.5 text-xs font-black uppercase text-[#3a2a00]">
                    Best value
                  </span>
                )}
                <h2 className="text-xl font-black">{plan.label}</h2>
                <p className="mt-2">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-muted"> / {plan.per}</span>
                </p>
                <p className="mt-1 text-sm font-bold text-muted">{plan.note}</p>
                <button
                  type="button"
                  disabled={busy !== null || !authEnabled}
                  onClick={() => subscribe(id)}
                  className={`btn mt-6 ${featured ? "btn-gold" : ""}`}
                >
                  {busy === id ? "Redirecting…" : user ? "Subscribe" : "Sign in to subscribe"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {error && <p className="mt-4 text-center font-bold text-bad">{error}</p>}
      {!authEnabled && (
        <p className="mt-4 text-center text-sm text-muted">
          Payments need accounts: add Supabase and Stripe keys to <code>.env.local</code>.
        </p>
      )}
    </div>
  );
}
