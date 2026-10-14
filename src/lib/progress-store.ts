"use client";

// Learner progress, persisted in localStorage and read by components via
// useSyncExternalStore (server snapshot = empty progress, so prerendering
// never touches localStorage or the clock).

import { createStore, type Listener } from "@/lib/store";

const STORAGE_KEY = "slovko:progress:v1";

export type Progress = {
  xp: number;
  streak: number;
  streakLastDay: string | null;
  dailyXp: { day: string; xp: number };
  dailyGoal: number;
  completed: Record<string, { best: number; count: number }>;
};

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  streak: 0,
  streakLastDay: null,
  dailyXp: { day: "", xp: 0 },
  dailyGoal: 20,
  completed: {},
};

export const progressStore = createStore<Progress>(
  EMPTY_PROGRESS,
  () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...EMPTY_PROGRESS, ...JSON.parse(saved) } : EMPTY_PROGRESS;
    } catch {
      return EMPTY_PROGRESS; // private mode or corrupt data
    }
  },
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {}
  },
);

/** Wall clock that ticks every 30 s (so the streak rolls over at midnight) and on demand. */
export const clockStore = (() => {
  const store = createStore(0, () => Date.now());
  let timer: ReturnType<typeof setInterval> | null = null;
  return {
    subscribe(listener: Listener) {
      const unsubscribe = store.subscribe(listener);
      timer ??= setInterval(() => store.set(Date.now()), 30_000);
      return unsubscribe;
    },
    get: store.get,
    tick: () => store.set(Date.now()),
  };
})();

/** Local calendar day (YYYY-MM-DD) of `now`, shifted by `offsetDays`. */
export function dayOf(now: number, offsetDays = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("sv-SE");
}

/** Streak as displayed: broken if the last active day was before yesterday. */
export function liveStreak(p: Progress, now: number): number {
  return p.streakLastDay === dayOf(now) || p.streakLastDay === dayOf(now, -1) ? p.streak : 0;
}

/** Progress after finishing a lesson. */
export function withCompletedLesson(
  p: Progress,
  lessonId: string,
  score: number,
  xp: number,
  now: number,
): Progress {
  const today = dayOf(now);
  const streak =
    p.streakLastDay === today ? p.streak : p.streakLastDay === dayOf(now, -1) ? p.streak + 1 : 1;
  const prev = p.completed[lessonId];
  return {
    ...p,
    xp: p.xp + xp,
    streak,
    streakLastDay: today,
    dailyXp: { day: today, xp: (p.dailyXp.day === today ? p.dailyXp.xp : 0) + xp },
    completed: {
      ...p.completed,
      [lessonId]: { best: Math.max(prev?.best ?? 0, score), count: (prev?.count ?? 0) + 1 },
    },
  };
}
