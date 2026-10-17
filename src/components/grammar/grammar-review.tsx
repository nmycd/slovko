"use client";

import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp } from "@/components/app-provider";
import { ChevronDownIcon, CloseIcon, LockIcon } from "@/components/icons";
import { GrammarView } from "@/components/lesson/exercises";
import { VolumeSlider } from "@/components/lesson/volume-slider";
import { courseById, courseOpen, type CourseId } from "@/lib/course/courses";
import type { GrammarExercise, LessonOutline } from "@/lib/course/types";
import { unlockAllLessons } from "@/lib/env";
import type { Locale } from "@/lib/i18n";

export type GrammarCourse = {
  id: CourseId;
  units: {
    number: number;
    premium: boolean;
    /** `place`: the lesson's number in its unit. */
    lessons: (Pick<LessonOutline, "id" | "title" | "titleEn"> & { place: number })[];
  }[];
};

const frame = "max-w-6xl px-4 lg:px-8";

/**
 * Grammar review: the lesson frame around one grammar lesson's teaching cards (the
 * page), with every course's grammar lessons in a list beside them (above them on
 * phones). Nothing to answer, so no footer, and the bar at the top stays full. A layout,
 * so the list keeps its folds and scroll from lesson to lesson.
 */
export function GrammarFrame({
  courses,
  required,
  children,
}: {
  /** Every course's grammar lessons by unit, in each native language. */
  courses: Record<Locale, GrammarCourse[]>;
  /** Each course's lessons that count towards finishing it. */
  required: Record<CourseId, string[]>;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const lessonId = useSelectedLayoutSegment();
  const { ready, authEnabled, authKnown, user, profile, progress, dev, locale, t } = useApp();
  const signedOut = authEnabled && authKnown && !user;
  // Folds the learner changed here; the rest follow the defaults below. Not kept: a
  // fresh visit starts from the defaults again.
  const [folds, setFolds] = useState<Record<string, boolean>>({});

  // The proxy already redirects signed-out visitors; this covers client-side navigation.
  useEffect(() => {
    if (signedOut && lessonId) router.replace(`/login?next=${encodeURIComponent(`/grammar/${lessonId}`)}`);
  }, [signedOut, router, lessonId]);

  const profileLoading = user !== null && profile === null;
  if (!ready || !authKnown || signedOut || profileLoading) return <div className="min-h-dvh" />;

  const shown = courses[locale].filter((c) => courseOpen(courseById(c.id), dev));
  const at = shown.flatMap((c) => c.units.flatMap((u) => u.lessons.map((l) => ({ course: c, unit: u, lesson: l }))));
  const here = at.find((x) => x.lesson.id === lessonId);
  if (!here) return children;
  const course = courseById(here.course.id);

  // Open by default: the course the learner is on (the last one they've started and not
  // finished, else the first not finished), and the one holding this lesson; every unit.
  const done = (id: string) => Boolean(progress.completed[id]);
  const unfinished = shown.filter((c) => !required[c.id].every(done));
  const current = (unfinished.filter((c) => required[c.id].some(done)).at(-1) ?? unfinished[0] ?? shown.at(-1))?.id;
  const isOpen = (key: string, byDefault: boolean) => folds[key] ?? byDefault;
  const toggle = (key: string, byDefault: boolean) => setFolds((f) => ({ ...f, [key]: !isOpen(key, byDefault) }));

  const list = (
    <LessonList
      courses={shown}
      current={here.lesson.id}
      isOpen={(c) => isOpen(c, c === current || c === here.course.id)}
      isUnitOpen={(key) => isOpen(key, true)}
      onToggle={(c) => toggle(c, c === current || c === here.course.id)}
      onToggleUnit={(key) => toggle(key, true)}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className={`mx-auto w-full pt-3 sm:pt-5 ${frame}`}>
        <div className="flex items-center gap-3">
          {/* Back to the course's path where the learner left it (useKeptScroll keeps its place). */}
          <Link
            href={course.path}
            scroll={false}
            aria-label={t("grammar.close")}
            className="shrink-0 text-muted hover:text-text"
          >
            <CloseIcon size={28} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted">
              {t("lesson.place", { unit: here.unit.number, lesson: here.lesson.place })}
            </p>
            <p className="hidden truncate font-serif text-lg leading-tight sm:block">{here.lesson.title}</p>
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
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * A grammar lesson's teaching cards, one after another, without their pictures (the
 * text is what's being reviewed); a Premium unit's need Premium.
 */
export function GrammarCards({
  level,
  premiumUnit,
  cards,
}: {
  level: string;
  premiumUnit: boolean;
  /** The lesson's grammar cards in each native language. */
  cards: Record<Locale, GrammarExercise[]>;
}) {
  const { isPremium, locale, t } = useApp();
  if (premiumUnit && !isPremium && !unlockAllLessons) {
    return (
      <div>
        <h1 className="flex items-center gap-2 text-2xl">
          <LockIcon size={22} className="shrink-0" /> {t("lesson.paywall.title")}
        </h1>
        <p className="mt-2 text-muted">{t("lesson.paywall.body", { level })}</p>
        <Link href="/pricing" className="btn btn-gold mt-5">
          {t("lesson.paywall.button")}
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-16">
      {cards[locale].map((card) => (
        <GrammarView key={`${card.id}-${locale}`} exercise={card} />
      ))}
    </div>
  );
}

/**
 * Every course's grammar lessons, course by course and unit by unit, both foldable: the
 * current lesson marked, the ones not finished yet greyed (still open), Premium units'
 * locked for learners without it.
 */
function LessonList({
  courses,
  current,
  isOpen,
  isUnitOpen,
  onToggle,
  onToggleUnit,
}: {
  courses: GrammarCourse[];
  current: string;
  isOpen: (course: CourseId) => boolean;
  isUnitOpen: (key: string) => boolean;
  onToggle: (course: CourseId) => void;
  onToggleUnit: (key: string) => void;
}) {
  const { progress, isPremium, t } = useApp();
  const listRef = useRef<HTMLDivElement>(null);
  // A long list: bring the current lesson into view inside it (not the page), unless it
  // already is, as after picking it here.
  useLayoutEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>("[aria-current]");
    if (!list || !item) return;
    const top = item.offsetTop;
    if (top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top - list.clientHeight / 3;
    }
  }, [current]);

  return (
    <div
      ref={listRef}
      className="relative space-y-6 overflow-y-auto pb-6 max-lg:max-h-[50dvh] lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:pt-8"
    >
      {courses.map((c) => {
        const open = isOpen(c.id);
        return (
          <section key={c.id}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => onToggle(c.id)}
              className="flex w-full items-center justify-between gap-2 text-left font-serif text-lg"
            >
              {t("lesson.course", { level: courseById(c.id).level })}
              <ChevronDownIcon size={20} className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div className="mt-3 space-y-4 border-l border-border pl-3">
                {c.units.map((unit) => {
                  const key = `${c.id}:${unit.number}`;
                  const unitOpen = isUnitOpen(key);
                  const canSee = !unit.premium || isPremium || unlockAllLessons;
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        aria-expanded={unitOpen}
                        onClick={() => onToggleUnit(key)}
                        className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold tracking-wide text-muted uppercase"
                      >
                        {t("path.unit", { n: unit.number })}
                        <ChevronDownIcon
                          size={14}
                          className={`shrink-0 transition-transform ${unitOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {unitOpen && (
                        <ul className="mt-1.5 space-y-0.5">
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
                                {canSee ? (
                                  <Link
                                    href={`/grammar/${lesson.id}`}
                                    className={`block rounded-xl px-3 py-2 hover:bg-surface-2 ${
                                      progress.completed[lesson.id] ? "" : "opacity-50 hover:opacity-100"
                                    }`}
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
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
