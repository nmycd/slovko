// Spelling cards. Before a word turns up in a typed sentence ("Type what you hear"),
// the learner has typed it once on its own, on a "spell" card a few cards after the
// word first appears. scripts/plan-spelling.ts places the cards in spelling.json;
// lessons get them as the course loads, after translation, so translation keys and
// picture indexes keep counting the authored exercises only.
import { stripDiacritics } from "../answers";
import { capitalisedWords, properNames } from "./names";
import plan from "./spelling.json";
import type { Lesson, SpellExercise } from "./types";

/**
 * A spelling card, placed after authored exercise `after` of its lesson (-1: first
 * in the lesson). `gloss` is the intro card ("lessonId#index") teaching this exact
 * form, whose meaning the card shows.
 */
export type SpellCard = { after: number; sk: string; gloss?: string };

export const spellingPlan: Record<string, SpellCard[]> = plan;

// Little words learned by exposure, never drilled: pronouns, forms of "byť",
// prepositions, conjunctions, particles, question words and possessives.
const exempt = new Set(
  `ja ty on ona ono my vy oni ony ma mňa mi mne ťa teba ti tebe ho jeho mu jej ju nás nám vás vám ich im
  sa si seba sebe sebou mnou tebou nami vami nimi
  som je sme ste sú bol bola bolo boli byť
  v vo na z zo do od o po pri s so k ku za pred nad pod cez bez u okrem medzi
  a aj ale alebo že či nie áno už ešte tu tam len iba aby keď lebo pretože tak teda
  to ten tá tie tí toto tento táto tieto
  kto čo kde ako kedy prečo koľko aký aká aké akí ktorý ktorá ktoré kam odkiaľ
  môj moja moje moji tvoj tvoja tvoje náš naša naše váš vaša vaše svoj svoja svoje`
    .split(/\s+/)
    .filter(Boolean)
    .map(stripDiacritics),
);

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
  return bare.length > 2 && !exempt.has(bare) && !properNames.has(word);
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
    const en = gloss && meaning(gloss);
    return en ? { type: "spell", sk, en } : { type: "spell", sk };
  };
  const after = (i: number) => cards.filter((c) => c.after === i).map(card);
  return { ...lesson, exercises: [...after(-1), ...lesson.exercises.flatMap((ex, i) => [ex, ...after(i)])] };
}

/** Where authored exercise `index` sits once its lesson's spelling cards are in. */
export function playedIndex(lessonId: string, index: number): number {
  return index + (spellingPlan[lessonId] ?? []).filter((c) => c.after < index).length;
}
