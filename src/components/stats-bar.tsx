"use client";

import { useApp } from "@/components/app-provider";
import { BoltIcon, FlameIcon } from "@/components/icons";

export function StatsBar() {
  const { ready, streak, progress } = useApp();
  if (!ready) return <div className="h-7 w-28" />;
  return (
    <div className="flex items-center gap-4 text-base font-extrabold">
      <span className="flex items-center gap-1 text-accent" title="Day streak">
        <FlameIcon size={22} className={streak ? "" : "opacity-40"} /> {streak}
      </span>
      <span className="flex items-center gap-1 text-gold" title="Total XP">
        <BoltIcon size={22} /> {progress.xp}
      </span>
    </div>
  );
}
