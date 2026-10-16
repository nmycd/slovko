"use client";

// Which units the learner folded or opened on /learn themselves, kept for an hour after
// their last change, like a short-lived cookie but only on the device (nothing on the
// server needs it). Every unit they haven't touched follows the default fold (see
// course-path); after an hour without a change, all of them do again.
import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/store";

const KEY = "slovko:unit-folds";
const KEEP_MS = 60 * 60 * 1000;

type Folds = { at: number; open: Record<string, boolean> };
const NONE: Folds = { at: 0, open: {} };

const fresh = (folds: Folds | null, now: number): folds is Folds => !!folds && now - folds.at < KEEP_MS;

const foldStore = createStore<Folds>(
  NONE,
  () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Folds | null;
      return fresh(saved, Date.now()) ? saved : NONE;
    } catch {
      return NONE;
    }
  },
  (folds) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(folds));
    } catch {}
  },
);

/** The learner's own choices from the last hour: unit id → open. */
export function useUnitFolds(): Record<string, boolean> {
  return useSyncExternalStore(foldStore.subscribe, foldStore.get, () => NONE).open;
}

/** Remembers that the learner opened or folded a unit (for another hour). */
export function setUnitFold(unitId: string, open: boolean) {
  foldStore.set((prev) => {
    const now = Date.now();
    return { at: now, open: { ...(fresh(prev, now) ? prev.open : {}), [unitId]: open } };
  });
}
