"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { BoltIcon, CheckIcon, CrownIcon, FlameIcon } from "@/components/icons";
import { allLessons } from "@/lib/course";

export function AccountPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, user, isPremium, progress, streak, signOut, authEnabled } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;
  if (!authEnabled || !user) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-2xl font-black">Not signed in</h1>
        <Link href="/login" className="btn mt-6 w-full">
          Sign in
        </Link>
      </div>
    );
  }

  const completed = allLessons.filter((l) => progress.completed[l.id]).length;

  async function manageBilling() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) window.location.assign(data.url);
    else {
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {params.get("checkout") === "success" && (
        <p className="rounded-2xl bg-ok-soft p-4 font-extrabold text-ok-dark">
          Payment received. Premium unlocks as soon as Stripe confirms it (usually a few seconds).
        </p>
      )}

      <div>
        <h1 className="text-3xl font-black">Profile</h1>
        <p className="text-muted">{user.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<FlameIcon className="text-accent" />} value={streak} label="Day streak" />
        <Stat icon={<BoltIcon className="text-gold" />} value={progress.xp} label="Total XP" />
        <Stat icon={<CheckIcon className="text-ok" />} value={completed} label="Lessons" />
      </div>

      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <CrownIcon className="text-gold" /> {isPremium ? "Premium" : "Free plan"}
        </h2>
        <p className="mt-1 text-muted">
          {isPremium
            ? "Thanks for supporting Slovko! Manage your plan, card and invoices in the billing portal."
            : "Unlock units 3–10 of the A1 course."}
        </p>
        {isPremium ? (
          <button type="button" onClick={manageBilling} disabled={busy} className="btn btn-ghost mt-4 w-full">
            Manage billing
          </button>
        ) : (
          <Link href="/pricing" className="btn btn-gold mt-4 w-full">
            Go Premium
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
        Sign out
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
