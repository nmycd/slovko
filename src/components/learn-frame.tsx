"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { Dictionary } from "@/components/dictionary";
import { BoltIcon, CrownIcon } from "@/components/icons";
import { ReviewCard } from "@/components/review/review-card";
import { courseOpen, courses } from "@/lib/course/courses";

/**
 * The course tabs' frame on /learn: the tab beside a column with the daily goal, word
 * review, extra practice and the dictionary (and Premium on a course path with Premium units, which
 * it unlocks). Resources has the page to itself.
 */
export function LearnFrame({
  reviewOpensAfter,
  children,
}: {
  /** Word review opens once one of these sets of lessons is done. */
  reviewOpensAfter: string[][];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { ready, progress, isPremium, premiumKnown, todayXp, dev, t } = useApp();
  if (pathname === "/learn/resources") return children;

  // A course's path, as this viewer sees it (not a course's "coming soon" page).
  const course = courses.find((c) => c.path === pathname && courseOpen(c, dev));
  // They read the device's storage (review cards, the search text), so they wait for the app.
  // The review page is the card at length, so it goes without the card.
  const reviewCard = ready && pathname !== "/learn/review" && <ReviewCard opensAfter={reviewOpensAfter} />;
  const dictionaryCard = ready && <Dictionary />;
  // What each kind of practice holds is still to be decided; for now it only names them.
  // When they get pages, every way back to /learn (close, finish, back) navigates with
  // `scroll: false`, as the lesson player's exits do, so the path reopens where the
  // learner left it (useKeptScroll in course-path) instead of at the top.
  const practiceCard = ready && (
    <div className="card p-5">
      <h2 className="text-lg">{t("practice.title")}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>{t("practice.grammar")}</li>
        <li>{t("practice.writing")}</li>
        <li>{t("practice.speaking")}</li>
      </ul>
    </div>
  );
  // Narrow screens have no side column: review, practice and the dictionary lead a course path
  // (long) and follow the other tabs' short text.
  const inline = (className: string) =>
    ready && (
      <div className={`mx-auto max-w-xl space-y-4 lg:hidden ${className}`}>
        {reviewCard}
        {practiceCard}
        {dictionaryCard}
      </div>
    );

  return (
    <div className="mx-auto flex max-w-5xl gap-10 px-4 py-8">
      <div className="min-w-0 flex-1">
        {course && inline("mb-10")}
        {children}
        {!course && inline("mt-10")}
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
        {practiceCard}
        {dictionaryCard}
        {course && premiumKnown && !isPremium && (
          <div className="card p-5">
            <h2 className="flex items-center gap-2">
              <CrownIcon className="text-gold" /> {t("path.premium.title")}
            </h2>
            <p className="mt-2 text-muted">
              {course.freeUnits
                ? t("path.premium.body", { from: course.freeUnits + 1, level: course.level })
                : t("lesson.paywall.body", { level: course.level })}
            </p>
            <Link href="/pricing" className="btn btn-gold mt-4 w-full">
              {t("path.premium.button")}
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
