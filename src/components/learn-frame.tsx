"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { Dictionary } from "@/components/dictionary";
import { BoltIcon, CrownIcon } from "@/components/icons";
import { ReviewCard } from "@/components/review/review-card";

/**
 * The course tabs' frame on /learn: the tab beside a column with the daily goal, word
 * review and the dictionary (and Premium on A1, whose units it unlocks). Resources
 * has the page to itself.
 */
export function LearnFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, progress, isPremium, todayXp, t } = useApp();
  if (pathname === "/learn/resources") return children;

  const onA1 = pathname === "/learn";
  // They read the device's storage (review cards, the search text), so they wait for the app.
  // The review page is the card at length, so it goes without the card.
  const reviewCard = ready && pathname !== "/learn/review" && <ReviewCard />;
  const dictionaryCard = ready && <Dictionary />;
  // Narrow screens have no side column: review and the dictionary lead the A1 path
  // (long) and follow the other tabs' short text.
  const inline = (className: string) =>
    ready && (
      <div className={`mx-auto max-w-xl space-y-4 lg:hidden ${className}`}>
        {reviewCard}
        {dictionaryCard}
      </div>
    );

  return (
    <div className="mx-auto flex max-w-5xl gap-10 px-4 py-8">
      <div className="min-w-0 flex-1">
        {onA1 && inline("mb-10")}
        {children}
        {!onA1 && inline("mt-10")}
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
        {reviewCard}
        {dictionaryCard}
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
