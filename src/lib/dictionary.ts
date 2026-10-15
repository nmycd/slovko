// The dictionary on /learn: every word and phrase the course teaches on an intro
// card, searchable in Slovak and in the learner's language. Client-safe; the
// entries come from the server (see `dictionary` in ./course).
import { slips } from "@/lib/answers";
import type { Locale } from "@/lib/i18n";

/**
 * A word or phrase the course teaches, or a grammar card, and where it's taught
 * (the card to open: exercise index as played; unit and lesson numbers for display).
 */
export type DictionaryEntry = {
  /** A word (taught on its own card), a phrase (a grammar example or matching pair), or a grammar card. */
  kind: "word" | "phrase" | "grammar";
  /** The Slovak (empty for a grammar card). */
  sk: string;
  /** The meaning in each native language; for a grammar card, its title. */
  meaning: Record<Locale, string>;
  lessonId: string;
  index: number;
  unit: number;
  lesson: number;
};

/** Lowercase, without accents or punctuation: how queries and entries are compared. */
function searchKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * How well a query word matches a word of an entry, 0 to 1. Slovak, Ukrainian and
 * Russian (`inflected`) change word endings all the time, so there a different ending
 * still counts ("каву" is "кава", "chleb" is "chlieb", "кофе" starts "кофейня"), and so
 * does a word inside a longer one ("pravo" in vpravo). English gets neither, or
 * "bread" would find "break" and "right" "bright". With `typos`, a word of 4+ letters
 * may also be one slip off (two in long words): "kuchina" → kuchyňa, "thnak" → thank.
 */
function wordMatch(q: string, word: string, inflected: boolean, typos: boolean): number {
  if (word === q) return 1;
  if (word.startsWith(q)) return 0.9; // still typing: "kuch" → kuchyňa
  if (inflected) {
    let same = 0;
    while (same < q.length && same < word.length && q[same] === word[same]) same++;
    // The same word with another ending: a shared start and short tails. After 4+
    // shared letters a vowel may drop (серпень, у серпні); after only 3, the query may
    // differ by one letter (каву, кава), or "pravo" would find "v práci".
    const tails = word.length - same <= 3 && q.length - same <= (same >= 4 ? 3 : 1);
    if (same >= 3 && tails) return 0.8;
    if (q.length >= 4 && word.includes(q)) return 0.7; // inside a word: "pravo" → vpravo
  }
  if (typos && q.length >= 4 && slips(q, word) <= (q.length >= 8 ? 2 : 1)) return 0.6;
  return 0;
}

/**
 * The query word without the vowel Slavic words drop before their last consonant
 * when they take an ending: січень → січня, marec → marca, piatok → piatku.
 */
function withoutFleetingVowel(word: string): string {
  return word.replace(/[eoеоє](?=[^aeiouyаеєиіїоуюяыэь]ь?$)/, "");
}

/** Words come before phrases, and both before grammar cards, on an equal match. */
const rank = { word: 1, phrase: 0.97, grammar: 0.9 };

/**
 * A search over the dictionary in Slovak and one native language, best matches first.
 * Each query word has to match some word of an entry (see `wordMatch`; meanings count
 * a little less than the Slovak, and shorter entries come first on a tie). Typos are
 * tried only when nothing matches otherwise. Case and accents never matter.
 */
export function dictionarySearch(entries: DictionaryEntry[], locale: Locale) {
  // Names (Marek, Марек, Bratislava): capitalised somewhere past the start of a
  // sentence. They match only exactly or as the word being typed, or "март" would find
  // Марек and "marec" Marek.
  const names = new Set<string>();
  for (const entry of entries) {
    for (const text of [entry.sk, ...Object.values(entry.meaning)]) {
      const tokens = text.split(/\s+/);
      tokens.forEach((token, i) => {
        const start = i === 0 || /[.!?…—–:]$/.test(tokens[i - 1]);
        if (!start && /^\P{L}*\p{Lu}/u.test(token)) names.add(searchKey(token));
      });
    }
  }
  const nameMatch = (q: string, name: string) =>
    name === q ? 1 : name.startsWith(q) && name.length - q.length <= 2 ? 0.9 : 0;

  const docs = entries.map((entry) => ({
    entry,
    skWords: searchKey(entry.sk).split(" ").filter(Boolean),
    meaningWords: searchKey(entry.meaning[locale]).split(" "),
  }));

  function find(words: string[], typos: boolean) {
    return docs
      .map((doc) => {
        let total = 0;
        for (const w of words) {
          const short = withoutFleetingVowel(w);
          const match = (word: string, inflected: boolean) =>
            names.has(word)
              ? nameMatch(w, word)
              : Math.max(
                  wordMatch(w, word, inflected, typos),
                  inflected && short !== w ? 0.95 * wordMatch(short, word, true, typos) : 0,
                );
          const best = Math.max(
            ...doc.skWords.map((word) => match(word, true)),
            ...doc.meaningWords.map((word) => 0.95 * match(word, locale !== "en")),
          );
          if (!best) return null;
          total += best;
        }
        const length = doc.skWords.length + doc.meaningWords.length;
        return { entry: doc.entry, score: (rank[doc.entry.kind] * total) / words.length - 0.001 * length };
      })
      .filter((hit) => hit !== null)
      .sort((a, b) => b.score - a.score) // stable: ties keep course order
      .map((hit) => hit.entry);
  }

  return (query: string, limit = 8): DictionaryEntry[] => {
    const q = searchKey(query);
    if (q.length < 2) return [];
    const words = q.split(" ");
    const hits = find(words, false);
    return (hits.length ? hits : find(words, true)).slice(0, limit);
  };
}
