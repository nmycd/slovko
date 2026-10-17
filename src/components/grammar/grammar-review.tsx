"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useApp } from "@/components/app-provider";
import { CloseIcon, LockIcon } from "@/components/icons";
import { GrammarView } from "@/components/lesson/exercises";
import { VolumeSlider } from "@/components/lesson/volume-slider";
import { courseById, courseOpen, type CourseId } from "@/lib/course/courses";
import type { Illustration } from "@/lib/course/illustrations";
import type { ExerciseId, GrammarExercise, LessonOutline } from "@/lib/course/types";
import { unlockAllLessons } from "@/lib/env";
import type { Locale } from "@/lib/i18n";

export type GrammarUnit = {
  number: number;
  premium: boolean;
  lessons: Pick<LessonOutline, "id" | "title" | "titleEn">[];
};

/**
 * Grammar review: one grammar lesson's teaching cards in the lesson frame, read again,
 * with every grammar lesson of the course in a list beside them (above them on phones).
 * Nothing to answer, so no footer, and the bar at the top stays full. Every lesson in
 * a unit open to the learner can be read; the ones not finished yet are greyed in the list.
 */
export function GrammarReview({
  course: courseId,
  lessonId,
  premiumUnit,
  cards,
  units,
  pictures,
  place,
}: {
  course: CourseId;
  lessonId: string;
  premiumUnit: boolean;
  /** The lesson's grammar cards in each native language. */
  cards: Record<Locale, GrammarExercise[]>;
  /** The course's grammar lessons by unit, in each native language. */
  units: Record<Locale, GrammarUnit[]>;
  pictures: Record<ExerciseId, Illustration>;
  place: { unit: number; lesson: number };
}) {
  const router = useRouter();
  const { ready, authEnabled, authKnown, user, profile, progress, isPremium, dev, locale, t } = useApp();
  const signedOut = authEnabled && authKnown && !user;

  // The proxy already redirects signed-out visitors; this covers client-side navigation.
  useEffect(() => {
    if (signedOut) router.replace(`/login?next=${encodeURIComponent(`/grammar/${lessonId}`)}`);
  }, [signedOut, router, lessonId]);

  const course = courseById(courseId);
  const profileLoading = user !== null && profile === null;
  if (!ready || !authKnown || signedOut || profileLoading || !courseOpen(course, dev)) {
    return <div className="min-h-dvh" />;
  }

  const canSee = (premium: boolean) => !premium || isPremium || unlockAllLessons;
  const finished = (id: string) => Boolean(progress.completed[id]);
  const shownCards = cards[locale];
  const title = units[locale].flatMap((u) => u.lessons).find((l) => l.id === lessonId)?.title;
  const frame = "max-w-6xl px-4 lg:px-8";
  const list = <LessonList units={units[locale]} current={lessonId} canSee={canSee} finished={finished} />;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className={`mx-auto w-full pt-3 sm:pt-5 ${frame}`}>
        <div className="flex items-center gap-3">
          {/* Back to the course's path where the learner left it (useKeptScroll keeps its place). */}
          <Link href={course.path} scroll={false} aria-label={t("grammar.close")} className="shrink-0 text-muted hover:text-text">
            <CloseIcon size={28} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted">{t("lesson.place", place)}</p>
            <p className="hidden truncate font-serif text-lg leading-tight sm:block">{title}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-semibold text-muted">{t("lesson.course", { level: course.level })}</p>
            <p className="text-sm leading-tight font-semibold text-brand sm:text-lg">{t("practice.grammar")}</p>
          </div>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-locked sm:mt-3">
          <div className="h-full w-full rounded-full bg-lichen" />
        </div>
        <VolumeSlider className="mt-4.5 flex" />
      </header>

      <div className={`mx-auto flex w-full flex-1 gap-10 ${frame}`}>
        <aside className="hidden w-64 shrink-0 lg:block">{list}</aside>
        <main className="min-w-0 flex-1 py-4 sm:py-8">
          <details className="card mb-8 p-4 lg:hidden">
            <summary className="cursor-pointer font-semibold">{t("grammar.all")}</summary>
            <div className="mt-3">{list}</div>
          </details>
          {canSee(premiumUnit) ? (
            <div className="space-y-16">
              {shownCards.map((card) => (
                <GrammarCard key={`${card.id}-${locale}`} card={card} picture={pictures[card.id]} />
              ))}
            </div>
          ) : (
            <div>
              <h1 className="flex items-center gap-2 text-2xl">
                <LockIcon size={22} className="shrink-0" /> {t("lesson.paywall.title")}
              </h1>
              <p className="mt-2 text-muted">{t("lesson.paywall.body", { level: course.level })}</p>
              <Link href="/pricing" className="btn btn-gold mt-5">
                {t("lesson.paywall.button")}
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/** A grammar card as the lesson shows it, its picture beside it on wide screens. */
function GrammarCard({ card, picture }: { card: GrammarExercise; picture?: Illustration }) {
  if (!picture) return <GrammarView exercise={card} />;
  return (
    <div className="grid items-center gap-6 xl:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] xl:gap-x-12">
      <Image
        src={picture.src}
        width={picture.width}
        height={picture.height}
        alt=""
        unoptimized
        className="illustration mx-auto h-auto max-h-[24dvh] w-auto max-w-full xl:order-last xl:max-h-[60dvh]"
      />
      <GrammarView exercise={card} />
    </div>
  );
}

/**
 * The course's grammar lessons, unit by unit: the current one marked, the ones not
 * finished yet greyed (still open), Premium units' locked for learners without it.
 */
function LessonList({
  units,
  current,
  canSee,
  finished,
}: {
  units: GrammarUnit[];
  current: string;
  canSee: (premium: boolean) => boolean;
  finished: (id: string) => boolean;
}) {
  const { t } = useApp();
  const listRef = useRef<HTMLDivElement>(null);
  // A long list (A2 has dozens): bring the current lesson into view inside it, not the page.
  useLayoutEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>("[aria-current]");
    if (list && item) list.scrollTop = item.offsetTop - list.clientHeight / 3;
  }, [current]);

  return (
    <div
      ref={listRef}
      className="relative space-y-5 overflow-y-auto pb-6 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:pt-8 max-lg:max-h-[50dvh]"
    >
      {units.map((unit) => (
        <section key={unit.number}>
          <h2 className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
            {t("path.unit", { n: unit.number })}
          </h2>
          <ul className="space-y-0.5">
            {unit.lessons.map((lesson) => {
              const label = (
                <>
                  <span className="block leading-snug font-semibold">{lesson.title}</span>
                  <span className="block text-sm leading-snug text-muted">{lesson.titleEn}</span>
                </>
              );
              if (lesson.id === current) {
                return (
                  <li key={lesson.id} aria-current="page" className="rounded-xl bg-lichen-soft px-3 py-2">
                    {label}
                  </li>
                );
              }
              return (
                <li key={lesson.id}>
                  {canSee(unit.premium) ? (
                    <Link
                      href={`/grammar/${lesson.id}`}
                      className={`block rounded-xl px-3 py-2 hover:bg-surface-2 ${finished(lesson.id) ? "" : "opacity-50 hover:opacity-100"}`}
                    >
                      {label}
                    </Link>
                  ) : (
                    <span className="flex items-start gap-2 px-3 py-2 opacity-50">
                      <span className="min-w-0 flex-1">{label}</span>
                      <LockIcon size={14} className="mt-1 shrink-0" />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
