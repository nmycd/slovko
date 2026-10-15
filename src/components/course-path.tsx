"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import {
  BookIcon,
  CheckIcon,
  ChevronDownIcon,
  CrownIcon,
  LockIcon,
  RepeatIcon,
  StarIcon,
} from "@/components/icons";
import type { LessonKind, UnitOutline } from "@/lib/course/types";
import { unlockAllLessons } from "@/lib/env";
import type { Locale, MessageKey, Translate } from "@/lib/i18n";

// Unit banner colours cycle through a family of deep greens (all keep ivory
// text readable).
const unitColors = ["#3e5a3e", "#4b6858", "#5b6b33", "#3d5852", "#56693f"];

// Horizontal offsets (px) for the zig-zag path.
const zigzag = [0, 44, 66, 44, 0, -44, -66, -44];

/** "open": playable but not next in line (only with the unlock-all testing switch). */
type NodeState = "done" | "current" | "open" | "locked";

/** `outlines` holds the path in each native language (titleEn = the translated title). */
export function CoursePath({ outlines }: { outlines: Record<Locale, UnitOutline[]> }) {
  const { ready, progress, isPremium, authEnabled, authKnown, user, locale, t } = useApp();
  const outline = outlines[locale];
  const signedOut = authEnabled && authKnown && !user;
  // Lessons need an account; signed-out visitors go through sign-in and come back.
  const hrefFor = (lessonId: string) =>
    signedOut ? `/login?next=${encodeURIComponent(`/lesson/${lessonId}`)}` : `/lesson/${lessonId}`;

  // The first lesson not yet completed is "current"; everything after it is locked.
  const allLessons = outline.flatMap((u) => u.lessons);
  const firstOpen = allLessons.findIndex((l) => !progress.completed[l.id]);
  const stateOf = (lessonId: string): NodeState => {
    const i = allLessons.findIndex((l) => l.id === lessonId);
    if (progress.completed[lessonId]) return "done";
    if (i === firstOpen) return "current";
    return unlockAllLessons ? "open" : "locked";
  };

  return (
    <div className={`mx-auto w-full max-w-xl ${ready ? "" : "invisible"}`}>
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
      {outline.map((unit, ui) => (
        <UnitSection
          key={unit.id}
          unit={unit}
          color={unitColors[ui % unitColors.length]}
          premiumLocked={unit.premium && !isPremium && !unlockAllLessons}
          completed={unit.lessons.length > 0 && unit.lessons.every((l) => progress.completed[l.id])}
          stateOf={stateOf}
          hrefFor={hrefFor}
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
  stateOf,
  hrefFor,
  t,
}: {
  unit: UnitOutline;
  color: string;
  premiumLocked: boolean;
  /** Every lesson done: the unit starts folded to its banner. */
  completed: boolean;
  stateOf: (lessonId: string) => NodeState;
  hrefFor: (lessonId: string) => string;
  t: Translate;
}) {
  const [expanded, setExpanded] = useState(false);
  const folded = completed && !expanded;
  const listId = `${unit.id}-lessons`;

  return (
    <section className={folded ? "mb-6" : "mb-12"}>
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
        {completed && (
          <>
            <span aria-hidden className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                <CheckIcon size={16} /> {t("path.completed")}
              </span>
              <ChevronDownIcon size={26} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </span>
            {/* Covers the whole banner so any click toggles the unit. */}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls={listId}
              aria-label={t(expanded ? "path.hideLessons" : "path.showLessons", {
                n: unit.number,
                title: unit.titleEn,
              })}
              className="absolute inset-0 cursor-pointer rounded-2xl focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-brand"
            />
          </>
        )}
      </div>

      {unit.lessons.length === 0 ? (
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
      ) : folded ? null : (
        <ol id={listId} className="mt-14 flex flex-col items-center gap-12">
          {unit.lessons.map((lesson, i) => (
            <li key={lesson.id} style={{ transform: `translateX(${zigzag[i % zigzag.length]}px)` }}>
              <LessonNode
                href={hrefFor(lesson.id)}
                title={lesson.title}
                subtitle={lesson.titleEn}
                kind={lesson.kind ?? "vocab"}
                state={stateOf(lesson.id)}
                color={color}
                t={t}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const kindIcon = { vocab: StarIcon, grammar: BookIcon, review: RepeatIcon };
const kindLabel: Record<LessonKind, MessageKey | null> = {
  vocab: null,
  grammar: "path.kind.grammar",
  review: "path.kind.review",
};

function LessonNode({
  href,
  title,
  subtitle,
  kind,
  state,
  color,
  t,
}: {
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
        <span className="animate-bob absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border-strong bg-bg px-3 py-1 text-sm font-semibold text-brand">
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
