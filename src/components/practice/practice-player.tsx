"use client";

// An extra-practice session (/practice/writing, /practice/pronunciation): ten
// dictations or speaking exercises from lessons the learner has met (lib/practice),
// on the lesson's exercise screens. No XP, nothing scheduled: practice only.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app-provider";
import { CheckIcon, CloseIcon, PencilIcon, MicIcon } from "@/components/icons";
import { Screen, Stat, Step } from "@/components/lesson/lesson-player";
import { VolumeSlider } from "@/components/lesson/volume-slider";
import { preloadLesson } from "@/lib/audio";
import { courseOf, courseOpen } from "@/lib/course/courses";
import type { Exercise } from "@/lib/course/types";
import type { Translate } from "@/lib/i18n";
import { pickPractice, type LessonOrder, type PracticeItem, type PracticeKind } from "@/lib/practice";

const frame = "max-w-3xl px-4";

export function PracticePlayer({
  kind,
  order,
  items,
}: {
  kind: PracticeKind;
  order: LessonOrder;
  items: PracticeItem[];
}) {
  const router = useRouter();
  const { ready, authEnabled, authKnown, user } = useApp();
  const signedOut = authEnabled && authKnown && !user;
  // "Practice again" starts a new draw.
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (signedOut) router.replace(`/login?next=${encodeURIComponent(`/practice/${kind}`)}`);
  }, [signedOut, router, kind]);

  if (!ready || !authKnown || signedOut) return <div className="min-h-dvh" />;
  // A fresh draw on every visit (Next keeps visited pages alive; see the lesson player).
  return (
    <Session
      key={`${router.bfcacheId}:${round}`}
      kind={kind}
      order={order}
      items={items}
      onAgain={() => setRound((n) => n + 1)}
    />
  );
}

function Session({
  kind,
  order,
  items,
  onAgain,
}: {
  kind: PracticeKind;
  order: LessonOrder;
  items: PracticeItem[];
  onAgain: () => void;
}) {
  const router = useRouter();
  const { progress, dev, locale, t } = useApp();
  // The courses this learner can see (a course not launched yet is for dev mode only).
  const [cards] = useState(() =>
    pickPractice(
      items.filter((item) => courseOpen(courseOf(item.lessonId), dev)),
      order,
      progress.completed,
    ),
  );
  const [pos, setPos] = useState(0);
  const [right, setRight] = useState(0);
  const [graded, setGraded] = useState(0);
  const [done, setDone] = useState(false);
  const title = t(kind === "writing" ? "practice.writing" : "practice.speaking");

  useEffect(() => preloadLesson(cards.map((c) => c.sk)), [cards]);

  if (!cards.length) return <Nothing kind={kind} t={t} />;
  if (done) return <Done kind={kind} right={right} total={graded} onAgain={onAgain} t={t} />;

  const card = cards[pos];
  const exercise: Exercise =
    kind === "writing"
      ? { id: card.id, type: "listen", sk: card.sk, en: card.en[locale] }
      : { id: card.id, type: "speak", sk: card.sk, en: card.en[locale] };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className={`mx-auto w-full pt-3 sm:pt-5 ${frame}`}>
        <div className="flex items-center gap-3">
          {/* Back to the path where the learner left it (useKeptScroll in course-path). */}
          <Link href="/learn" scroll={false} aria-label={t("lesson.quit")} className="shrink-0 text-muted hover:text-text">
            <CloseIcon size={28} />
          </Link>
          <p className="min-w-0 flex-1 truncate font-serif text-lg">{title}</p>
          <p className="shrink-0 text-sm font-semibold text-muted">
            {t("review.progress", { n: pos + 1, total: cards.length })}
          </p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-locked sm:mt-3">
          <div
            className="h-full rounded-full bg-lichen transition-[width] duration-300"
            style={{ width: `${Math.max((pos / cards.length) * 100, 2)}%` }}
          />
        </div>
        <VolumeSlider className="mt-4.5 flex" />
      </header>

      <Step
        key={`${pos}-${locale}`}
        exercise={exercise}
        lessonId={card.lessonId}
        frame={frame}
        nav={null}
        // Pronunciation practice is all speaking: not able to speak now ends it, back to the path.
        skip={
          kind === "pronunciation"
            ? { label: t("practice.cantSpeak"), onSkip: () => router.push("/learn", { scroll: false }) }
            : undefined
        }
        onGraded={(r) => {
          if (r.skipped) return;
          setGraded((n) => n + 1);
          if (r.correct) setRight((n) => n + 1);
        }}
        onNext={() => (pos + 1 < cards.length ? setPos(pos + 1) : setDone(true))}
      />
    </div>
  );
}

function Nothing({ kind, t }: { kind: PracticeKind; t: Translate }) {
  const Icon = kind === "writing" ? PencilIcon : MicIcon;
  return (
    <Screen>
      <Icon size={72} className="text-muted" />
      <p className="text-lg text-muted">{t("practice.empty")}</p>
      <Link href="/learn" scroll={false} className="btn w-full">
        {t("review.back")}
      </Link>
    </Screen>
  );
}

function Done({
  kind,
  right,
  total,
  onAgain,
  t,
}: {
  kind: PracticeKind;
  right: number;
  total: number;
  onAgain: () => void;
  t: Translate;
}) {
  const Icon = kind === "writing" ? PencilIcon : MicIcon;
  return (
    <Screen>
      <Icon size={80} className="animate-pop text-gold" />
      <div>
        <h1 className="text-3xl">{t("practice.done.title")}</h1>
        {total > 0 && <p className="mt-2 text-muted">{t("practice.done.body", { right, total })}</p>}
      </div>
      {total > 0 && (
        <div className="w-full">
          <Stat
            label={t("lesson.stat.accuracy")}
            value={`${Math.round((right / total) * 100)}%`}
            color="var(--ok)"
            icon={<CheckIcon size={20} />}
          />
        </div>
      )}
      <button type="button" onClick={onAgain} className="btn w-full">
        {t("practice.again")}
      </button>
      <Link href="/learn" scroll={false} className="btn btn-ghost w-full">
        {t("review.back")}
      </Link>
    </Screen>
  );
}
