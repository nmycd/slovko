// What a level of the course must cover, checked by `npm run course:coverage`
// (CONTENT-PIPELINE.md, stages 1, 3 and 4). Not loaded by the app.

import type { Unit } from "../types";

/** A field of everyday words ("family", "shops and paying"), core words only. */
export type WordField = {
  name: string;
  /** Dictionary forms. A glossary entry with one of these words counts in this field. */
  words: string[];
  /**
   * A field of the units' own settings (dorm, town, office), kept to compare
   * against: courses keep these anyway, so a gap between them and the everyday
   * fields shows which words were dropped.
   */
  control?: boolean;
};

/** One thing an outside standard requires at this level. */
export type ChecklistItem = {
  id: string;
  kind: "grammar" | "situation" | "topic" | "can-do";
  /** What is required, in our words. */
  item: string;
  /** Where the requirement comes from (see `sources` on the level). */
  source: string;
  /**
   * Where the course teaches it: lesson ids ("u4-rodina"), or a unit ("u4")
   * while the lessons are still planned. Empty means nobody has placed it yet.
   */
  in: string[];
  /**
   * A regex (case-insensitive; `\b` is a word boundary that knows Slovak
   * letters) that the lessons in `in` must match between them, so the record
   * can't go stale. Slovak, or English for what only a grammar card states.
   */
  probe?: string;
  /** Not (fully) covered: what's missing, and the fix if one is planned. Flagged until removed. */
  open?: string;
};

export type Level = {
  /** "a1" */
  key: string;
  name: string;
  /** The course's units, in order. */
  units: Unit[];
  /** Earlier levels whose words the learner already knows. */
  knows?: Level[];
  /** The textbook the units follow, and where its inventory lives (local only). */
  textbook?: {
    title: string;
    /** Folder of glossary-LN.tsv and points-LN.tsv, from the repo root (git-ignored). */
    inventory: string;
    /** Which unit teaches each textbook lesson. */
    lessons: { lesson: number; unit: number }[];
  };
  /** Full references for the `source` of checklist items. */
  sources: Record<string, string>;
  fields: WordField[];
  checklist: ChecklistItem[];
};
