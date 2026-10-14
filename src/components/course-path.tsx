"use client";

import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { BoltIcon, CheckIcon, CrownIcon, LockIcon, StarIcon } from "@/components/icons";
import { allLessons, course, type Unit } from "@/lib/course";

// Unit banner colours cycle through the palette.
const unitColors = ["var(--brand)", "var(--ok)", "var(--accent)", "#8b5cf6", "#0ea5a4"];

// Horizontal offsets (px) for the zig-zag path.
const zigzag = [0, 44, 66, 44, 0, -44, -66, -44];

type NodeState = "done" | "current" | "locked";

export function CoursePath() {
  const { ready, progress, isPremium, todayXp } = useApp();

  // The first lesson not yet completed is "current"; everything after it is locked.
  const firstOpen = allLessons.findIndex((l) => !progress.completed[l.id]);
  const stateOf = (lessonId: string): NodeState => {
    const i = allLessons.findIndex((l) => l.id === lessonId);
    if (progress.completed[lessonId]) return "done";
    return i === firstOpen ? "current" : "locked";
  };

  return (
    <div className="mx-auto flex max-w-5xl gap-10 px-4 py-8">
      <div className={`mx-auto w-full max-w-xl ${ready ? "" : "invisible"}`}>
        {course.map((unit, ui) => (
          <UnitSection
            key={unit.id}
            unit={unit}
            color={unitColors[ui % unitColors.length]}
            premiumLocked={unit.premium && !isPremium}
            stateOf={stateOf}
          />
        ))}
      </div>

      <aside className="sticky top-24 hidden h-fit w-80 shrink-0 space-y-4 lg:block">
        <div className="card p-5">
          <h2 className="font-black">Daily goal</h2>
          <div className="mt-3 flex items-center gap-3">
            <BoltIcon className="text-gold" />
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${Math.min(100, (todayXp / progress.dailyGoal) * 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-muted">
              {todayXp}/{progress.dailyGoal} XP
            </span>
          </div>
        </div>
        {!isPremium && (
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-black">
              <CrownIcon className="text-gold" /> Slovko Premium
            </h2>
            <p className="mt-2 text-muted">Unlock units 3–10 of the A1 course.</p>
            <Link href="/pricing" className="btn btn-gold mt-4 w-full">
              Try Premium
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

function UnitSection({
  unit,
  color,
  premiumLocked,
  stateOf,
}: {
  unit: Unit;
  color: string;
  premiumLocked: boolean;
  stateOf: (lessonId: string) => NodeState;
}) {
  return (
    <section className="mb-12">
      <div
        className="rounded-2xl p-5 text-white"
        style={{ background: color, boxShadow: `0 4px 0 color-mix(in srgb, ${color} 70%, black)` }}
      >
        <p className="text-sm font-extrabold uppercase tracking-wide opacity-80">
          Unit {unit.number} · {unit.titleEn}
        </p>
        <h2 className="mt-1 text-2xl font-black">{unit.title}</h2>
        <p className="mt-1 text-sm font-semibold opacity-90">{unit.grammar.join(" · ")}</p>
      </div>

      {unit.lessons.length === 0 ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-dashed border-border p-5 text-muted">
          <LockIcon className="shrink-0" />
          <div>
            <p className="font-extrabold">Coming soon</p>
            <p className="text-sm">Topics: {unit.topics.join(", ")}</p>
          </div>
        </div>
      ) : premiumLocked ? (
        <Link
          href="/pricing"
          className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-border p-5 hover:bg-surface"
        >
          <CrownIcon className="shrink-0 text-gold" />
          <div>
            <p className="font-extrabold">Unlock with Premium</p>
            <p className="text-sm text-muted">{unit.lessons.length} lessons: {unit.topics.join(", ")}</p>
          </div>
        </Link>
      ) : (
        <ol className="mt-14 flex flex-col items-center gap-12">
          {unit.lessons.map((lesson, i) => (
            <li key={lesson.id} style={{ transform: `translateX(${zigzag[i % zigzag.length]}px)` }}>
              <LessonNode
                lessonId={lesson.id}
                title={lesson.title}
                subtitle={lesson.titleEn}
                state={stateOf(lesson.id)}
                color={color}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function LessonNode({
  lessonId,
  title,
  subtitle,
  state,
  color,
}: {
  lessonId: string;
  title: string;
  subtitle: string;
  state: NodeState;
  color: string;
}) {
  const bg = state === "done" ? "var(--gold)" : state === "current" ? color : "var(--locked)";
  const node = (
    <span
      className="relative grid size-[4.5rem] place-items-center rounded-full text-white transition-transform active:translate-y-1"
      style={{ background: bg, boxShadow: `0 6px 0 color-mix(in srgb, ${bg} 70%, black)` }}
    >
      {state === "done" ? (
        <CheckIcon size={34} />
      ) : state === "current" ? (
        <StarIcon size={34} />
      ) : (
        <LockIcon size={28} className="opacity-80" />
      )}
      {state === "current" && (
        <span className="animate-bob absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-border bg-bg px-3 py-1.5 text-sm font-black uppercase tracking-wide text-brand">
          Start
        </span>
      )}
    </span>
  );

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {state === "locked" ? (
        <span aria-label={`${title} (locked)`}>{node}</span>
      ) : (
        <Link href={`/lesson/${lessonId}`} aria-label={`${title}: ${subtitle}`}>
          {node}
        </Link>
      )}
      <span className="leading-tight">
        <span className="block font-extrabold">{title}</span>
        <span className="block text-sm text-muted">{subtitle}</span>
      </span>
    </div>
  );
}
