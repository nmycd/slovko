"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { useApp } from "@/components/app-provider";
import {
  BookIcon,
  CheckIcon,
  ChevronDownIcon,
  CrownIcon,
  LockIcon,
  PencilIcon,
  RepeatIcon,
  RewindIcon,
  StarIcon,
} from "@/components/icons";
import { courseById, type Course, type CourseId } from "@/lib/course/courses";
import type { LessonKind, UnitOutline } from "@/lib/course/types";
import { unlockAllLessons } from "@/lib/env";
import { clockStore } from "@/lib/progress-store";
import { reviewCounts } from "@/lib/review/session";
import { useReviewCards } from "@/lib/review/store";
import { setUnitFold, useUnitFolds } from "@/lib/unit-folds";
import type { Locale, MessageKey, Translate } from "@/lib/i18n";

// Unit banner colours cycle through a family of deep greens (all keep ivory
// text readable).
const unitColors = ["#3e5a3e", "#4b6858", "#5b6b33", "#3d5852", "#56693f"];

// Horizontal offsets (px) for the zig-zag path.
const zigzag = [0, 44, 66, 44, 0, -44, -66, -44];

/** "open": playable but not next in line (only with the unlock-all testing switch). */
type NodeState = "done" | "current" | "open" | "locked";

/** Where a course's path keeps its scroll position (A1's key is from before there were more). */
const scrollKey = (course: Course) => (course.id === "a1" ? "slovko:learn-scroll" : `slovko:learn-scroll:${course.id}`);

/**
 * The path keeps its place in the tab: back from a lesson, a review or a word looked
 * up, it opens where the learner left it rather than at the top (those exits navigate
 * with `scroll: false`). The position is saved as they scroll and put back before the
 * page paints, once the cards above the path are in.
 */
function useKeptScroll(ready: boolean, course: Course) {
  useLayoutEffect(() => {
    if (!ready) return;
    try {
      const saved = Number(sessionStorage.getItem(scrollKey(course)));
      if (saved > 0) window.scrollTo({ top: saved, behavior: "instant" });
    } catch {}
    // At most once a frame (scroll events come no faster), and cheap: a short string in
    // the tab's own storage. Not the next page's scroll once the address has moved on.
    const save = () => {
      if (window.location.pathname !== course.path) return;
      try {
        sessionStorage.setItem(scrollKey(course), String(Math.round(window.scrollY)));
      } catch {}
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [ready, course]);
}

/**
 * Scrolls the page to `top`, eased in and out, as Chrome's smooth scroll does (√distance
 * frames at 60 fps, at most 0.7 s) but 20 % quicker, and the same in every browser.
 * The learner's own wheel or touch stops it.
 */
function glideTo(top: number) {
  const from = window.scrollY;
  const distance = top - from;
  const ms = (Math.min(Math.sqrt(Math.abs(distance)), 42) / 60) * 1000 * 0.8;
  const ease = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
  let stopped = false;
  const stop = () => {
    stopped = true;
  };
  window.addEventListener("wheel", stop, { once: true, passive: true });
  window.addEventListener("touchstart", stop, { once: true, passive: true });
  const start = performance.now();
  const frame = (now: number) => {
    const x = ms > 0 ? Math.min(1, (now - start) / ms) : 1;
    if (!stopped) window.scrollTo({ top: from + distance * ease(x), behavior: "instant" });
    if (x < 1 && !stopped) return requestAnimationFrame(frame);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
  };
  requestAnimationFrame(frame);
}

/** A course's path. `outlines` holds it in each native language (titleEn = the translated title). */
export function CoursePath({ course: courseId, outlines }: { course: CourseId; outlines: Record<Locale, UnitOutline[]> }) {
  const { ready, progress, isPremium, premiumKnown, authEnabled, authKnown, user, locale, t } = useApp();
  const course = courseById(courseId);
  // Which units are open depends on Premium: show the path once that's settled, not a
  // free version first.
  const shown = ready && premiumKnown;
  useKeptScroll(shown, course);
  const outline = outlines[locale];
  const signedOut = authEnabled && authKnown && !user;
  // Lessons need an account; signed-out visitors go through sign-in and come back.
  const hrefFor = (lessonId: string) =>
    signedOut ? `/login?next=${encodeURIComponent(`/lesson/${lessonId}`)}` : `/lesson/${lessonId}`;
  // Word review stops: how many cards are waiting (due or new).
  const reviewCards = useReviewCards();
  const now = useSyncExternalStore(clockStore.subscribe, clockStore.get, () => 0);
  const counts = reviewCounts(reviewCards, now);
  // A stop starts a session, except the course's first, which opens the review page so
  // a newcomer learns what word review is before starting one.
  const firstStop = outline.flatMap((u) => u.lessons.filter((_, i) => hasReviewStop(course, u, i)))[0]?.id;
  const review = {
    waiting: counts.due + counts.fresh,
    hrefAfter: (lessonId: string) => {
      const path = lessonId === firstStop ? "/learn/review" : "/review";
      return signedOut ? `/login?next=${encodeURIComponent(path)}` : path;
    },
  };

  // The first lesson not yet completed is "current"; everything after it is locked.
  // Writing lessons are optional, like review stops: never current, they open once
  // reached and hold up nothing after them.
  const allLessons = outline.flatMap((u) => u.lessons);
  const firstOpen = allLessons.findIndex((l) => l.kind !== "writing" && !progress.completed[l.id]);
  const stateOf = (lessonId: string): NodeState => {
    const i = allLessons.findIndex((l) => l.id === lessonId);
    if (progress.completed[lessonId]) return "done";
    if (allLessons[i]?.kind === "writing") return firstOpen < 0 || i < firstOpen || unlockAllLessons ? "open" : "locked";
    if (i === firstOpen) return "current";
    return unlockAllLessons ? "open" : "locked";
  };

  // Each unit's share of lessons done (the optional writing lessons left out).
  const units = outline.map((unit) => {
    const required = unit.lessons.filter((l) => l.kind !== "writing");
    const done = required.filter((l) => progress.completed[l.id]).length;
    return {
      unit,
      premiumLocked: unit.premium && !isPremium && !unlockAllLessons,
      pct: required.length ? Math.round((done / required.length) * 100) : 0,
      completed: required.length > 0 && done === required.length,
    };
  });
  // Folding: finished units start folded, the next two unfinished ones open (not those
  // behind Premium), the rest folded. A unit the learner opened or folded themselves in
  // the last hour stays as they left it.
  const folds = useUnitFolds();
  let slots = 2;
  const openByDefault = new Set(
    units
      .filter((u) => !u.completed && !u.premiumLocked && u.unit.lessons.length > 0 && slots-- > 0)
      .map((u) => u.unit.id),
  );

  return (
    <div className={`mx-auto w-full max-w-xl ${shown ? "" : "invisible"}`}>
      {signedOut && (
        <div className="card mb-10 flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="text-lg">{t("path.signup.title")}</h2>
            <p className="text-muted">{t("path.signup.body")}</p>
          </div>
          <Link href="/login?mode=signup" className="btn shrink-0">
            {t("path.signup.button")}
          </Link>
        </div>
      )}
      {units.map(({ unit, premiumLocked, pct, completed }, ui) => (
        <UnitSection
          key={unit.id}
          unit={unit}
          color={unitColors[ui % unitColors.length]}
          premiumLocked={premiumLocked}
          completed={completed}
          pct={pct}
          open={folds[unit.id] ?? openByDefault.has(unit.id)}
          onToggle={(open) => setUnitFold(unit.id, open)}
          stateOf={stateOf}
          hrefFor={hrefFor}
          review={review}
          reviewStops={course}
          t={t}
        />
      ))}
    </div>
  );
}

function UnitSection({
  unit,
  color,
  premiumLocked,
  completed,
  pct,
  open,
  onToggle,
  stateOf,
  hrefFor,
  review,
  reviewStops,
  t,
}: {
  unit: UnitOutline;
  color: string;
  premiumLocked: boolean;
  /** Every lesson done (writing lessons aside): the banner says so instead of a percentage. */
  completed: boolean;
  /** Share of the unit's lessons done. */
  pct: number;
  /** Showing its lessons, or folded to its banner. */
  open: boolean;
  onToggle: (open: boolean) => void;
  stateOf: (lessonId: string) => NodeState;
  hrefFor: (lessonId: string) => string;
  /** Cards waiting for word review, and where the stop after a lesson leads. */
  review: { waiting: number; hrefAfter: (lessonId: string) => string };
  /** The unit's course, which says where its review stops start. */
  reviewStops: Course;
  t: Translate;
}) {
  const folded = !open;
  const listId = `${unit.id}-lessons`;
  const section = useRef<HTMLElement>(null);
  // A unit opened in full can run long: the rail along its left edge goes back to its banner.
  const toTop = () => {
    const el = section.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(el).scrollMarginTop);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) window.scrollTo({ top, behavior: "instant" });
    else glideTo(Math.max(0, top));
  };

  return (
    <section ref={section} className={`scroll-mt-24 ${folded ? "mb-6" : "mb-12"}`}>
      <div
        className="relative flex items-center gap-4 rounded-2xl p-5 text-bg"
        style={{ background: color }}
      >
        <div className="flex-1">
          <p className="text-sm font-semibold opacity-80">
            {t("path.unit", { n: unit.number })} · {unit.titleEn}
          </p>
          <h2 className="mt-1 text-2xl">{unit.title}</h2>
          <ul className="mt-2 space-y-0.5 text-sm opacity-90">
            {unit.grammar.map((topic) => (
              <li key={topic} className="flex gap-2">
                <span aria-hidden className="mt-[0.5lh] size-1.5 shrink-0 -translate-y-1/2 rounded-full bg-lichen" />
                {topic}
              </li>
            ))}
          </ul>
        </div>
        <span aria-hidden className="flex shrink-0 items-center gap-2 self-start">
          {completed ? (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
              <CheckIcon size={16} /> {t("path.completed")}
            </span>
          ) : (
            unit.lessons.length > 0 && <span className="text-lg font-semibold tabular-nums">{pct}%</span>
          )}
          <ChevronDownIcon size={26} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
        {/* Covers the whole banner so any click opens or folds the unit. */}
        <button
          type="button"
          onClick={() => onToggle(!open)}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={t(open ? "path.hideLessons" : "path.showLessons", {
            n: unit.number,
            title: unit.titleEn,
          })}
          className="absolute inset-0 cursor-pointer rounded-2xl focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-brand"
        />
      </div>

      {folded ? null : unit.lessons.length === 0 ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-border-strong p-5 text-muted">
          <LockIcon className="shrink-0" />
          <div>
            <p className="font-semibold">{t("path.comingSoon")}</p>
            <p className="text-sm">{t("path.topics", { topics: unit.topics.join(", ") })}</p>
          </div>
        </div>
      ) : premiumLocked ? (
        <Link
          href="/pricing"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-border p-5 hover:bg-surface"
        >
          <CrownIcon className="shrink-0 text-gold" />
          <div>
            <p className="font-semibold">{t("path.unlock")}</p>
            <p className="text-sm text-muted">
              {t("path.unlockDetail", { n: unit.lessons.length, topics: unit.topics.join(", ") })}
            </p>
          </div>
        </Link>
      ) : (
        <div className="relative mt-14">
          {/* The rail and everything left of it, out to the screen's edge, is the button: a faint
              line down the unit's edge and a caret that stays at the bottom of the screen while
              the unit scrolls past. (Overflow to the left never scrolls the page.) */}
          <button
            type="button"
            onClick={toTop}
            aria-label={t("path.unitTop", { n: unit.number })}
            title={t("path.unitTop", { n: unit.number })}
            className="group absolute inset-y-0 -left-[100vw] right-[calc(100%-2.5rem)] flex cursor-pointer flex-col items-end justify-end focus-visible:outline-2 focus-visible:outline-brand"
          >
            <span
              aria-hidden
              className="absolute inset-y-0 right-5 w-0.5 translate-x-1/2 rounded-full bg-border transition-colors group-hover:bg-lichen"
            />
            <span
              aria-hidden
              className="sticky bottom-4 mr-1 grid size-8 place-items-center rounded-full border border-border bg-bg text-muted transition-colors group-hover:border-lichen group-hover:text-brand"
            >
              <ChevronDownIcon size={18} className="rotate-180" />
            </span>
          </button>
          <ol id={listId} className="flex flex-col items-center gap-12">
            {unit.lessons.flatMap((lesson, i) => [
              <li key={lesson.id} style={{ transform: `translateX(${zigzag[i % zigzag.length]}px)` }}>
                <LessonNode
                  shift={zigzag[i % zigzag.length]}
                  href={hrefFor(lesson.id)}
                  title={lesson.title}
                  subtitle={lesson.titleEn}
                  kind={lesson.kind ?? "vocab"}
                  state={stateOf(lesson.id)}
                  color={color}
                  t={t}
                />
              </li>,
              hasReviewStop(reviewStops, unit, i) && (
                <li
                  key={`${lesson.id}-review`}
                  style={{
                    transform: `translateX(${(zigzag[i % zigzag.length] + zigzag[(i + 1) % zigzag.length]) / 2}px)`,
                  }}
                >
                  <ReviewStop
                    href={review.hrefAfter(lesson.id)}
                    waiting={review.waiting}
                    locked={stateOf(lesson.id) !== "done"}
                    t={t}
                  />
                </li>
              ),
            ])}
          </ol>
        </div>
      )}
    </section>
  );
}

const kindIcon = { vocab: StarIcon, grammar: BookIcon, review: RepeatIcon, writing: PencilIcon };
const kindLabel: Record<LessonKind, MessageKey | null> = {
  vocab: null,
  grammar: "path.kind.grammar",
  review: "path.kind.review",
  writing: "path.kind.writing",
};

/**
 * Whether a word review stop follows a unit's lesson `i`: after every third lesson,
 * unless the unit's own review lesson is next anyway. Optional: a stop never locks what
 * follows. None before the course's `reviewFromUnit`: A1's unit 1 words are all minutes
 * old, with nothing to forget yet.
 */
function hasReviewStop(course: Course, unit: UnitOutline, i: number): boolean {
  return unit.number >= course.reviewFromUnit && i % 3 === 2 && i < unit.lessons.length - 2;
}

/** A word review stop on the path: the cards waiting, or a tick when there are none. */
function ReviewStop({ href, waiting, locked, t }: { href: string; waiting: number; locked: boolean; t: Translate }) {
  const node = (
    <span
      className="grid size-[4.5rem] place-items-center rounded-full"
      style={
        locked
          ? { background: "var(--locked)", color: "var(--locked-dark)" }
          : waiting
            ? { background: "var(--lichen-soft)", color: "var(--brand)", boxShadow: "inset 0 0 0 2px var(--lichen)" }
            : { background: "var(--ok-soft)", color: "var(--ok)" }
      }
    >
      {locked ? <LockIcon size={28} /> : waiting ? <RewindIcon size={34} /> : <CheckIcon size={34} />}
    </span>
  );
  const status = locked ? null : waiting ? t("path.reviewDue", { n: waiting }) : t("path.reviewClear");
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      {locked ? <span aria-label={t("path.review")}>{node}</span> : <Link href={href}>{node}</Link>}
      <span className="leading-tight">
        <span className="block text-sm font-semibold">{t("path.review")}</span>
        {status && <span className="block text-xs text-muted">{status}</span>}
      </span>
    </div>
  );
}

function LessonNode({
  shift,
  href,
  title,
  subtitle,
  kind,
  state,
  color,
  t,
}: {
  /** The node's zigzag offset (px): where the "Start" bubble has room. */
  shift: number;
  href: string;
  title: string;
  subtitle: string;
  kind: LessonKind;
  state: NodeState;
  color: string;
  t: Translate;
}) {
  const label = kindLabel[kind];
  const look = {
    done: { background: "var(--ok)", color: "var(--bg)" },
    current: {
      background: "var(--lichen)",
      color: "var(--text)",
      boxShadow: "0 0 0 6px var(--bg), 0 0 0 7.5px var(--lichen)",
    },
    open: { background: color, color: "var(--bg)" },
    locked: { background: "var(--locked)", color: "var(--locked-dark)" },
  }[state];
  const KindIcon = kindIcon[kind];
  const node = (
    <span
      className="relative grid size-[4.5rem] place-items-center rounded-full transition-transform active:translate-y-px"
      style={look}
    >
      {state === "done" ? (
        <CheckIcon size={34} />
      ) : state === "locked" ? (
        <LockIcon size={28} />
      ) : (
        <KindIcon size={34} />
      )}
      {state === "current" && (
        // Beside the node, on its right; on a phone a node right of centre has no room
        // there, so its bubble goes on the left.
        <span
          className={`animate-bob absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border-strong bg-bg px-3 py-1 text-sm font-semibold text-brand ${
            shift > 0 ? "max-sm:right-full max-sm:mr-4 sm:left-full sm:ml-4" : "left-full ml-4"
          }`}
        >
          {t("path.start")}
        </span>
      )}
    </span>
  );

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {state === "locked" ? (
        <span aria-label={t("path.locked", { title })}>{node}</span>
      ) : (
        <Link href={href} aria-label={`${title}: ${subtitle}`}>
          {node}
        </Link>
      )}
      <span className="leading-tight">
        {label && (
          <span className="block text-xs font-semibold text-muted">{t(label)}</span>
        )}
        <span className="block font-serif text-lg">{title}</span>
        <span className="block text-sm text-muted">{subtitle}</span>
      </span>
    </div>
  );
}
