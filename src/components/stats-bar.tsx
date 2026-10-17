"use client";

import { useApp } from "@/components/app-provider";
import { BoltIcon, FlameIcon } from "@/components/icons";

/** The header's numbers: streak, total XP, and today's XP against the daily goal. */
export function StatsBar() {
  const { ready, streak, progress, todayXp, t } = useApp();
  if (!ready) return <div className="h-7 w-72" />;
  const goal = progress.dailyGoal;
  return (
    <div className="flex items-center gap-4 text-base font-semibold">
      <span className="flex items-center gap-1 text-flame" title={t("stats.streak")}>
        <FlameIcon size={22} className={streak ? "" : "opacity-40"} /> {streak}
      </span>
      <span className="flex items-center gap-1 text-gold" title={t("stats.xp")}>
        <BoltIcon size={22} /> {progress.xp}
      </span>
      <span className="flex items-center gap-2" title={t("path.dailyGoal")}>
        <span className="sr-only">{t("path.dailyGoal")}</span>
        <span className="h-2.5 w-24 overflow-hidden rounded-full bg-surface-2">
          <span
            className="block h-full rounded-full bg-lichen transition-all"
            style={{ width: `${Math.min(100, (todayXp / goal) * 100)}%` }}
          />
        </span>
        <span className="text-sm text-muted">{t("path.xp", { done: todayXp, goal })}</span>
      </span>
    </div>
  );
}
