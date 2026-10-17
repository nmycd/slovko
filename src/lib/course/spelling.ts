// Spelling cards. Before a word turns up in a typed sentence ("Type what you hear"),
// the learner has typed it once on its own, on a "spell" card a few cards after the
// word first appears. scripts/plan-spelling.ts places the cards, in one file per course
// (A1's spelling.json, A2's a2/spelling.json); lessons get them as the course loads,
// after translation.
import { stripDiacritics } from "../answers";
import { littleWords } from "./little-words";
import { capitalisedWords, properNames } from "./names";
import a2Plan from "./a2/spelling.json";
import a1Plan from "./spelling.json";
import type { ExerciseId, Lesson, SpellExercise } from "./types";

/**
 * A spelling card, placed after the exercise with id `after` in its lesson (no
 * `after`: first in the lesson). `gloss` is the intro card ("lessonId#exerciseId")
 * teaching this exact form, whose meaning the card shows.
 */
export type SpellCard = { after?: ExerciseId; sk: string; gloss?: string };

/** Every course's cards by lesson id (ids are unique across courses). */
export const spellingPlan: Record<string, SpellCard[]> = { ...a1Plan, ...(a2Plan as Record<string, SpellCard[]>) };

/** A sentence's words as the spelling rule sees them: lowercase, outer punctuation off, hyphenated words whole. */
export function sentenceWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);
}

/** Whether a word in a typed sentence must have been spelled on its own first. Names and little words needn't. */
export function needsSpelling(word: string): boolean {
  const bare = stripDiacritics(word);
  return bare.length > 2 && !littleWords.has(bare) && !properNames.has(word);
}

/** How a spelling card writes a word: lowercase, unless it's a capitalised common word (Vianoce). */
export function spellingForm(word: string): string {
  return capitalisedWords.has(word) ? word[0].toUpperCase() + word.slice(1) : word;
}

/** The lesson with its spelling cards in. `meaning` looks up a card's gloss in the learner's language. */
export function addSpelling(lesson: Lesson, meaning: (gloss: string) => string | undefined): Lesson {
  const cards = spellingPlan[lesson.id];
  if (!cards?.length) return lesson;
  const card = ({ sk, gloss }: SpellCard): SpellExercise => {
    const id = `spell-${stripDiacritics(sk.toLowerCase())}`;
    const en = gloss && meaning(gloss);
    return en ? { id, type: "spell", sk, en } : { id, type: "spell", sk };
  };
  const after = (id?: ExerciseId) => cards.filter((c) => c.after === id).map(card);
  return { ...lesson, exercises: [...after(), ...lesson.exercises.flatMap((ex) => [ex, ...after(ex.id)])] };
}
