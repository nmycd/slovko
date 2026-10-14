"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { useApp } from "@/components/app-provider";
import { CloseIcon, CrownIcon } from "@/components/icons";

const MAX_CHECKS = 15; // every 2 s, so ~30 s

/** Shown on /learn when Stripe Checkout redirects back with ?checkout=success. */
export function CheckoutBanner() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, user, isPremium, refreshProfile, t } = useApp();
  const [checks, setChecks] = useState(0);
  const visible = params.get("checkout") === "success";

  const recheck = useEffectEvent(async () => {
    await refreshProfile();
    setChecks((n) => n + 1);
  });

  // The webhook that grants Premium can land a moment after the redirect,
  // so re-read the profile until it does.
  useEffect(() => {
    if (!visible || !user || isPremium || checks >= MAX_CHECKS) return;
    const id = setTimeout(() => void recheck(), 2000);
    return () => clearTimeout(id);
  }, [visible, user, isPremium, checks]);

  if (!visible || !ready) return null;

  const status = isPremium ? "done" : checks >= MAX_CHECKS ? "slow" : "pending";
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6">
      <div
        role="status"
        className="animate-pop flex items-start gap-4 rounded-2xl border-2 border-ok bg-ok-soft p-5 text-ok-dark"
      >
        <CrownIcon size={32} className="shrink-0 text-gold" />
        <div className="flex-1">
          <p className="text-lg font-black">
            {status === "done" ? t("checkout.done.title") : t("checkout.received")}
          </p>
          <p className="font-semibold">
            {status === "done"
              ? t("checkout.done.body")
              : status === "pending"
                ? t("checkout.pending")
                : t("checkout.slow")}
          </p>
        </div>
        <button
          type="button"
          aria-label={t("common.dismiss")}
          onClick={() => router.replace("/learn", { scroll: false })}
          className="shrink-0 opacity-70 hover:opacity-100"
        >
          <CloseIcon size={22} />
        </button>
      </div>
    </div>
  );
}
