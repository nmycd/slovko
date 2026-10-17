"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { Dictionary } from "@/components/dictionary";
import { CrownIcon } from "@/components/icons";
import { ReviewCard } from "@/components/review/review-card";
import { courseOpen, courses, type CourseId } from "@/lib/course/courses";

/**
 * The course tabs' frame on /learn: the tab beside a column with word review, extra
 * practice and the dictionary (and Premium on a course path with Premium units, which
 * it unlocks). The daily goal is in the header. Resources has the page to itself.
 */
export function LearnFrame({
  reviewOpensAfter,
  grammarLessons,
  children,
}: {
  /** Word review opens once one of these sets of lessons is done. */
  reviewOpensAfter: string[][];
  /** Each course's grammar lessons, in order. */
  grammarLessons: Record<CourseId, string[]>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { ready, progress, isPremium, premiumKnown, dev, t } = useApp();
  if (pathname === "/learn/resources") return children;

  // A course's path, as this viewer sees it (not a course's "coming soon" page).
  const course = courses.find((c) => c.path === pathname && courseOpen(c, dev));
  // They read the device's storage (review cards, the search text), so they wait for the app.
  // The review page is the card at length, so it goes without the card.
  const reviewCard = ready && pathname !== "/learn/review" && <ReviewCard opensAfter={reviewOpensAfter} />;
  const dictionaryCard = ready && <Dictionary />;
  // Writing and speaking practice are still to be decided; for now they're only named.
  // Every way back to /learn from a practice page (close, finish, back) navigates with
  // `scroll: false`, as the lesson player's exits do, so the path reopens where the
  // learner left it (useKeptScroll in course-path) instead of at the top.
  // Grammar review opens at the course's latest finished grammar lesson (on another tab, A1's).
  const grammar = grammarLessons[(course ?? courses[0]).id];
  const grammarAt = grammar.findLast((id) => progress.completed[id]) ?? grammar[0];
  const practiceCard = ready && (
    <div className="card overflow-hidden p-5">
      <h2 className="text-lg">{t("practice.title")}</h2>
      {/* Rows run the card's full width, so a link's whole row lights up like the review card. */}
      <ul className="-mx-5 mt-2 text-muted">
        <li>
          <Link
            href={`/grammar/${grammarAt}`}
            className="flex items-center gap-3 px-5 py-1.5 font-semibold text-text transition-colors hover:bg-surface"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-current" />
            {t("practice.grammar")}
          </Link>
        </li>
        {(["practice.writing", "practice.speaking"] as const).map((key) => (
          <li key={key} className="flex items-center gap-3 px-5 py-1.5">
            <span className="size-1.5 shrink-0 rounded-full bg-current" />
            {t(key)}
          </li>
        ))}
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

      {/* Stays in view; when it's taller than the screen (a long dictionary search), it
          scrolls on its own under the cursor, then hands the scroll on to the page. Its
          cap fits the screen from where it starts, below the course tabs, before it sticks.
          The padding keeps the cards' focus rings clear of its edge. */}
      <aside className="sticky top-24 -m-1 hidden h-fit max-h-[calc(100dvh-9.5rem)] w-82 shrink-0 space-y-4 overflow-y-auto p-1 [scrollbar-width:thin] lg:block">
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
