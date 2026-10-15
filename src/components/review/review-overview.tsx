"use client";

// The Review tab on /learn: how many words are in the learner's deck, how many
// are waiting, and the way into a session.
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useApp } from "@/components/app-provider";
import { RewindIcon } from "@/components/icons";
import { formatWhen } from "@/components/review/when";
import { clockStore } from "@/lib/progress-store";
import { nextDue, reviewCounts } from "@/lib/review/session";
import { loadReviewDeck, useReviewCards } from "@/lib/review/store";

export function ReviewOverview() {
  const { ready, authEnabled, authKnown, user, locale, t } = useApp();
  const cards = useReviewCards();
  const now = useSyncExternalStore(clockStore.subscribe, clockStore.get, () => 0);
  const signedOut = authEnabled && authKnown && !user;

  // Loading the deck also adds the cards of every lesson finished so far.
  useEffect(() => loadReviewDeck(), []);

  const words = Object.keys(cards).filter((id) => id.endsWith("|recognize")).length;
  const { due, fresh } = reviewCounts(cards, now);
  const next = nextDue(cards, now);

  return (
    <div className={`mx-auto max-w-xl lg:py-8 ${ready ? "" : "invisible"}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-accent">
        <RewindIcon size={18} /> {t("courses.review")}
      </p>
      <h1 className="mt-3 text-3xl">{t("review.title")}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{t("review.intro")}</p>

      {signedOut ? (
        <Link href={`/login?next=${encodeURIComponent("/learn/review")}`} className="btn mt-8">
          {t("review.signIn")}
        </Link>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              [t("review.inDeck"), words],
              [t("review.dueNow"), due],
              [t("review.new"), fresh],
            ].map(([label, value]) => (
              <div key={label} className="card p-4">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-1 font-serif text-3xl">{value}</dd>
              </div>
            ))}
          </dl>
          {due + fresh > 0 ? (
            <Link href="/review" className="btn btn-ok mt-8 w-full sm:w-auto sm:min-w-56">
              {t("review.start")}
            </Link>
          ) : (
            <p className="mt-8 text-muted">
              {words === 0
                ? t("review.emptyDeck")
                : `${t("review.caughtUp")} ${next ? t("review.nextAt", { when: formatWhen(next, now, locale) }) : ""}`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
