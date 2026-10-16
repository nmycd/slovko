// Word-order tiles show in lowercase: a capitalised tile would give the first word of
// the sentence away. Names keep their capital ("Emma", "Košice", "Slovakia"). A name
// is a word the course never writes in lowercase ("Ahoj" is lowercase elsewhere, so
// it's a common word) and that it capitalises in the middle of a sentence, in this or
// another form ("v Bratislave" makes "Bratislava" a name; "Koľko", only ever at a
// sentence start, isn't one). Also names: the course's list of names (./names), which
// covers a name only ever seen first ("Martin je učiteľ…"); English "I", titles,
// months and weekdays; and a wrong tile made from a name ("Словенії" beside
// "Словаччини"). Worked out per language as the course loads.
import { toTiles } from "@/lib/answers";
import { properNames } from "./names";
import type { Exercise, Lesson } from "./types";

/** Every string in a value, however deep (an exercise's prompt, answers, table cells…). */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

/** English writes these with a capital anywhere ("in May", though "you may"). */
const englishCapitals = new Set(
  "Mr Mrs Ms Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December".split(
    " ",
  ),
);

/** Letters two words share at the start. */
function sharedStart(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

type Names = {
  isName: (word: string) => boolean;
  /** Never written in lowercase (a name, or a word only ever seen first). */
  uncased: (word: string) => boolean;
};

/** Tests for names (see above). */
export function namesIn(lessons: Lesson[]): Names {
  const lowercase = new Set<string>();
  const midSentence = new Set<string>();
  for (const text of strings(lessons.map((l) => l.exercises))) {
    const tokens = text.split(/\s+/);
    tokens.forEach((token, i) => {
      const word = token.replace(/^\P{L}+|[^\p{L}'’]+$/gu, "");
      if (/^\p{Ll}/u.test(word)) lowercase.add(word);
      // Mid-sentence, and the word itself: not quoted, bold or in brackets, which
      // explanations do to any word ("say „Dobrý deň“").
      const start = i === 0 || /[.!?…:—–/-]\P{L}*$/u.test(tokens[i - 1]);
      if (!start && /^\p{Lu}/u.test(token)) midSentence.add(word);
    });
  }
  const uncased = (word: string) => /^\p{Lu}/u.test(word) && !lowercase.has(word.toLocaleLowerCase());
  const names = [...midSentence].filter(uncased);
  const isName = (word: string) => {
    if (/^I(['’]\p{L}+)?$/u.test(word) || englishCapitals.has(word)) return true; // I, I'm, I'll
    if (!uncased(word)) return false;
    if (properNames.has(word.toLocaleLowerCase())) return true;
    // The same name in another form: Bratislava ~ Bratislave, Marek ~ Marekovi, Emma ~
    // Emmin; but not Nemala ~ Nemka, only three letters alike.
    return names.some((name) => {
      const shared = sharedStart(word, name);
      const shorter = Math.min(word.length, name.length);
      return (shared >= 4 && shared >= shorter - 2) || (shared >= 3 && shared >= shorter - 1);
    });
  };
  return { isName, uncased };
}

/** A word-order exercise with its name tiles marked (see `BuildExercise.keepCase`). */
export function withTileCase(ex: Exercise, { isName, uncased }: Names): Exercise {
  if (ex.type !== "build") return ex;
  // "Tomáš's" keeps its capital when "Tomáš" does.
  const name = (tile: string) => isName(tile) || isName(tile.split(/['’]/)[0]);
  const named = toTiles(ex.answers[0]).filter(name);
  // A wrong tile made from one of them: "Словенії" for "Словаччини".
  const variant = (tile: string) => uncased(tile) && named.some((n) => sharedStart(tile, n) >= 4);
  const keepCase = [...new Set([...named, ...ex.distractors.filter((d) => name(d) || variant(d))])];
  return keepCase.length ? { ...ex, keepCase } : ex;
}
