"use client";

// The word-review card beside the course on /learn: where the learner's deck stands
// (what's waiting, or when the next words fall due) and the way into a session.
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useApp } from "@/components/app-provider";
import { formatWhen } from "@/components/review/when";
import { clockStore } from "@/lib/progress-store";
import { nextDue, reviewCounts } from "@/lib/review/session";
import { loadReviewDeck, useReviewCards } from "@/lib/review/store";

export function ReviewCard({ className = "" }: { className?: string }) {
  const { authEnabled, authKnown, user, locale, t } = useApp();
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

  return (
    <div className={`card p-5 ${className}`}>
      <h2 className="text-lg">{t("review.title")}</h2>
      <p className="mt-1 text-sm text-muted">{status}</p>
      {signedOut ? (
        <Link href={`/login?next=${encodeURIComponent("/learn")}`} className="btn btn-ghost mt-4 w-full">
          {t("review.signIn")}
        </Link>
      ) : (
        waiting && (
          <Link href="/review" className="btn btn-ok mt-4 w-full">
            {t("review.start")}
          </Link>
        )
      )}
    </div>
  );
}
