"use client";

// A spaced-repetition session (/review): up to 15 due or new cards, each asked
// with the drill its strength calls for (see lib/review/session), using the
// lesson's exercise screens.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { BoltIcon, CheckIcon, CloseIcon, RewindIcon } from "@/components/icons";
import type { Resolution } from "@/components/lesson/exercises";
import { Screen, Stat, Step } from "@/components/lesson/lesson-player";
import { VolumeSlider } from "@/components/lesson/volume-slider";
import { formatWhen } from "@/components/review/when";
import { playSlovak, preloadLesson } from "@/lib/audio";
import type { Exercise } from "@/lib/course/types";
import type { Locale, Translate } from "@/lib/i18n";
import type { ReviewItem } from "@/lib/review/items";
import { buildSession, nextDue, ratingFor, withoutAudio, type Drill, type SessionCard } from "@/lib/review/session";
import { addRecallCards, getReviewCards, loadReviewDeck, recordAnswer, useReviewDeck } from "@/lib/review/store";

/** XP for finishing a session. */
const XP = 10;

export function ReviewPlayer() {
  const router = useRouter();
  const { ready, authEnabled, authKnown, user } = useApp();
  const deck = useReviewDeck();
  const signedOut = authEnabled && authKnown && !user;

  useEffect(() => loadReviewDeck(), []);
  useEffect(() => {
    if (signedOut) router.replace(`/login?next=${encodeURIComponent("/review")}`);
  }, [signedOut, router]);

  if (!ready || !authKnown || signedOut || !deck) return <div className="min-h-dvh" />;
  // A fresh session on every visit (Next keeps visited pages alive; see the lesson player).
  return <Session key={router.bfcacheId} deck={deck} />;
}

type Item = { index: number; key: string; retry: boolean };

function Session({ deck }: { deck: ReviewItem[] }) {
  const { t, locale, earnXp } = useApp();
  const items = useMemo(() => new Map(deck.map((item) => [item.id, item])), [deck]);
  const [startedAt] = useState(() => Date.now());
  const [cards] = useState(() => buildSession(deck, getReviewCards(), startedAt));
  const [queue, setQueue] = useState<Item[]>(() =>
    cards.map((_, index) => ({ index, key: String(index), retry: false })),
  );
  const [pos, setPos] = useState(0);
  const [right, setRight] = useState(0);
  // "Can't listen now": drills that need sound give way to silent ones for the rest of the session.
  const [audioOff, setAudioOff] = useState(false);
  const [done, setDone] = useState(false);

  const pictures = useMemo(
    () => cards.flatMap((c) => items.get(c.itemId)!.picture ?? []),
    [cards, items],
  );
  useEffect(() => {
    preloadLesson(cards.map((c) => items.get(c.itemId)!.sk));
    // Decode the pictures up front too, so each is ready when its card comes up.
    for (const src of new Set(pictures.map((p) => p.src))) {
      const img = new window.Image();
      img.src = src;
      img.decode().catch(() => {});
    }
  }, [cards, items, pictures]);
  // With pictures, the wider frame lessons with pictures use (see the lesson player).
  const frame = pictures.length ? "max-w-6xl px-4 lg:px-8" : "max-w-3xl px-4";

  if (!cards.length) return <NothingDue t={t} locale={locale} />;
  if (done) return <Done right={right} total={cards.length} t={t} />;

  const item = queue[pos];
  const card = cards[item.index];
  const word = items.get(card.itemId)!;
  const asked: Drill = audioOff ? (withoutAudio[card.drill] ?? card.drill) : card.drill;

  function onGraded(r: Resolution) {
    if (!item.retry) {
      recordAnswer(card.cardId, ratingFor(card.direction, card.drill, asked, r));
      if (r.correct) setRight((n) => n + 1);
      // A miss comes back once at the end, as in lessons (practice only: it's graded already).
      if (!r.correct) setQueue((q) => [...q, { index: item.index, key: `${item.key}r`, retry: true }]);
    }
    // Hear the word after answering, unless it was just heard.
    if (asked === "pick" || asked === "type") void playSlovak(word.sk);
  }

  function next() {
    if (pos + 1 < queue.length) return setPos(pos + 1);
    earnXp(XP);
    addRecallCards(); // words recognised in this session may be ready to recall
    setDone(true);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className={`mx-auto w-full pt-3 sm:pt-5 ${frame}`}>
        <div className="flex items-center gap-3">
          <Link href="/learn" scroll={false} aria-label={t("lesson.quit")} className="shrink-0 text-muted hover:text-text">
            <CloseIcon size={28} />
          </Link>
          <p className="min-w-0 flex-1 truncate font-serif text-lg">{t("review.title")}</p>
          <p className="shrink-0 text-sm font-semibold text-muted">
            {t("review.progress", { n: Math.min(pos + 1, cards.length), total: cards.length })}
          </p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-locked sm:mt-3">
          <div
            className="h-full rounded-full bg-lichen transition-[width] duration-300"
            style={{ width: `${Math.max((pos / queue.length) * 100, 2)}%` }}
          />
        </div>
        <VolumeSlider className="mt-4.5 flex" />
      </header>

      <Step
        key={`${item.key}-${asked}-${locale}`}
        exercise={exerciseFor(card, asked, items, locale, t)}
        illustration={word.picture}
        // A picture of the word would give its meaning away: shown once that's answered.
        pictureAfterAnswer={card.direction === "recognize"}
        frame={frame}
        nav={null}
        skip={
          asked !== card.drill || !withoutAudio[card.drill]
            ? undefined
            : { label: t("review.cantListen"), onSkip: () => setAudioOff(true) }
        }
        onGraded={onGraded}
        onNext={next}
      />
    </div>
  );
}

/** A card as an exercise, in the learner's language. */
function exerciseFor(
  card: SessionCard,
  drill: Drill,
  items: Map<string, ReviewItem>,
  locale: Locale,
  t: Translate,
): Exercise {
  const word = items.get(card.itemId)!;
  const meaning = word.meaning[locale];
  const meanings = card.options.map((id) => items.get(id)!.meaning[locale]);
  const id = card.cardId;
  switch (drill) {
    case "read":
    case "listen":
      return {
        id,
        type: "choice",
        question: t("review.whatMeans"),
        sk: word.sk,
        audioOnly: drill === "listen",
        options: meanings,
        optionsLang: "en",
        answer: card.answer,
      };
    case "pick":
      return {
        id,
        type: "choice",
        question: t("review.howSay", { meaning }),
        options: card.options.map((id) => items.get(id)!.sk),
        optionsLang: "sk",
        answer: card.answer,
      };
    case "dictation":
      return { id, type: "spell", sk: word.sk };
    case "type":
      return { id, type: "spell", sk: word.sk, en: meaning, fromMeaning: true };
  }
}

function NothingDue({ t, locale }: { t: Translate; locale: Locale }) {
  const [now] = useState(() => Date.now());
  const next = nextDue(getReviewCards(), now);
  return (
    <Screen>
      <CheckIcon size={72} className="text-ok" />
      <div>
        <h1 className="text-3xl">{t("review.caughtUp")}</h1>
        <p className="mt-2 text-muted">
          {next ? t("review.nextAt", { when: formatWhen(next, now, locale) }) : t("review.emptyDeck")}
        </p>
      </div>
      <Link href="/learn" scroll={false} className="btn w-full">
        {t("review.back")}
      </Link>
    </Screen>
  );
}

function Done({ right, total, t }: { right: number; total: number; t: Translate }) {
  return (
    <Screen>
      <RewindIcon size={80} className="animate-pop text-gold" />
      <div>
        <h1 className="text-3xl">{t("review.done.title")}</h1>
        <p className="mt-2 text-muted">{t("review.done.body", { right, total })}</p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3">
        <Stat label={t("lesson.stat.xp")} value={`+${XP}`} color="var(--gold)" icon={<BoltIcon size={20} />} />
        <Stat
          label={t("lesson.stat.accuracy")}
          value={`${Math.round((right / total) * 100)}%`}
          color="var(--ok)"
          icon={<CheckIcon size={20} />}
        />
      </div>
      <Link href="/learn" scroll={false} className="btn w-full">
        {t("review.back")}
      </Link>
    </Screen>
  );
}
