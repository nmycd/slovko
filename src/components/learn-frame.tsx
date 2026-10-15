"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { Dictionary } from "@/components/dictionary";
import { BoltIcon, CrownIcon } from "@/components/icons";
import type { DictionaryEntry } from "@/lib/dictionary";

/**
 * The course tabs' frame on /learn: the tab beside a column with the daily goal and
 * the dictionary (and Premium on A1, whose units it unlocks). Resources has the
 * page to itself.
 */
export function LearnFrame({ dictionary, children }: { dictionary: DictionaryEntry[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, progress, isPremium, todayXp, t } = useApp();
  if (pathname === "/learn/resources") return children;

  const onA1 = pathname === "/learn";
  // Its search text comes from session storage, so it waits for the app.
  const dictionaryCard = (className?: string) => ready && <Dictionary entries={dictionary} className={className} />;

  return (
    <div className="mx-auto flex max-w-5xl gap-10 px-4 py-8">
      <div className="min-w-0 flex-1">
        {/* Narrow screens have no side column: the dictionary leads the A1 path (long)
            and follows the other tabs' short text. */}
        {onA1 && dictionaryCard("mx-auto mb-10 max-w-xl lg:hidden")}
        {children}
        {!onA1 && dictionaryCard("mx-auto mt-10 max-w-xl lg:hidden")}
      </div>

      <aside className="sticky top-24 hidden h-fit w-80 shrink-0 space-y-4 lg:block">
        <div className="card p-5">
          <h2 className="text-lg">{t("path.dailyGoal")}</h2>
          <div className="mt-3 flex items-center gap-3">
            <BoltIcon className="text-gold" />
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-lichen transition-all"
                style={{ width: `${Math.min(100, (todayXp / progress.dailyGoal) * 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-muted">
              {t("path.xp", { done: todayXp, goal: progress.dailyGoal })}
            </span>
          </div>
        </div>
        {dictionaryCard()}
        {onA1 && !isPremium && (
          <div className="card p-5">
            <h2 className="flex items-center gap-2">
              <CrownIcon className="text-gold" /> {t("path.premium.title")}
            </h2>
            <p className="mt-2 text-muted">{t("path.premium.body")}</p>
            <Link href="/pricing" className="btn btn-gold mt-4 w-full">
              {t("path.premium.button")}
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
