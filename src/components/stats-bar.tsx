"use client";

import { useApp } from "@/components/app-provider";
import { BoltIcon, FlameIcon } from "@/components/icons";

export function StatsBar() {
  const { ready, streak, progress, t } = useApp();
  if (!ready) return <div className="h-7 w-28" />;
  return (
    <div className="flex items-center gap-4 text-base font-extrabold">
      <span className="flex items-center gap-1 text-accent" title={t("stats.streak")}>
        <FlameIcon size={22} className={streak ? "" : "opacity-40"} /> {streak}
      </span>
      <span className="flex items-center gap-1 text-gold" title={t("stats.xp")}>
        <BoltIcon size={22} /> {progress.xp}
      </span>
    </div>
  );
}
