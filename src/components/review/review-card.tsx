"use client";

// The word-review card beside the course on /learn: where the learner's deck stands
// (what's waiting, or when the next words fall due) and the way into a session. The
// card as a whole opens the review page (/learn/review); its button starts a session.
// Until the units before `reviewFromUnit` are done it's closed: greyed, saying when it opens.
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useApp } from "@/components/app-provider";
import { LockIcon } from "@/components/icons";
import { formatWhen } from "@/components/review/when";
import { clockStore } from "@/lib/progress-store";
import { nextDue, reviewCounts, reviewFromUnit } from "@/lib/review/session";
import { loadReviewDeck, useReviewCards } from "@/lib/review/store";

/** `opensAfter`: the lessons of the units before `reviewFromUnit`. */
export function ReviewCard({ opensAfter, className = "" }: { opensAfter: string[]; className?: string }) {
  const { authEnabled, authKnown, user, progress, locale, t } = useApp();
  const cards = useReviewCards();
  const now = useSyncExternalStore(clockStore.subscribe, clockStore.get, () => 0);
  const signedOut = authEnabled && authKnown && !user;

  // Loading the deck also adds the cards of every lesson finished so far.
  useEffect(() => loadReviewDeck(), []);

  const { due, fresh } = reviewCounts(cards, now);
  const next = nextDue(cards, now);
  const waiting = !signedOut && due + fresh > 0;
  // "Label: n" rather than a sentence, so no language needs plural forms.
  const status =
    signedOut || !Object.keys(cards).length
      ? t("review.emptyDeck")
      : waiting
        ? [due && `${t("review.dueNow")}: ${due}`, fresh && `${t("review.new")}: ${fresh}`].filter(Boolean).join(" · ")
        : [t("review.caughtUp"), next && t("review.nextAt", { when: formatWhen(next, now, locale) })]
            .filter(Boolean)
            .join(" ");

  if (!opensAfter.every((id) => progress.completed[id])) {
    return (
      <div className={`card bg-locked/40 p-5 text-muted ${className}`}>
        <h2 className="flex items-center gap-2 text-lg">
          <LockIcon size={18} className="shrink-0" />
          {t("review.title")}
        </h2>
        <p className="mt-1 text-sm">{t("review.afterUnit", { n: reviewFromUnit - 1 })}</p>
      </div>
    );
  }

  return (
    <div className={`card relative p-5 transition-colors hover:bg-surface ${className}`}>
      <h2 className="text-lg">
        {/* Stretched over the card; the button below sits on top of it. */}
        <Link href="/learn/review" className="after:absolute after:inset-0 after:rounded-2xl">
          {t("review.title")}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-muted">{status}</p>
      {signedOut ? (
        <Link href={`/login?next=${encodeURIComponent("/learn")}`} className="btn btn-ghost relative mt-4 w-full">
          {t("review.signIn")}
        </Link>
      ) : (
        waiting && (
          <Link href="/review" className="btn btn-ok relative mt-4 w-full">
            {t("review.start")}
          </Link>
        )
      )}
    </div>
  );
}
