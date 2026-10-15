// The dictionary on /learn: every word and phrase the course teaches on an intro
// card, searchable in Slovak and in the learner's language. Client-safe; the
// entries come from the server (see `dictionary` in ./course).
import Fuse from "fuse.js";
import type { Locale } from "@/lib/i18n";

/**
 * An intro card: its Slovak, its meaning in each native language, and where it's
 * taught (exercise index as played; unit and lesson numbers for display).
 */
export type DictionaryEntry = {
  sk: string;
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
 * "bread" would find "break" and "right" "bright".
 */
function wordMatch(q: string, word: string, inflected: boolean): number {
  if (word === q) return 1;
  if (word.startsWith(q)) return 0.9; // still typing: "kuch" → kuchyňa
  if (!inflected) return 0;
  let same = 0;
  while (same < q.length && same < word.length && q[same] === word[same]) same++;
  // The same word with another ending: a shared start, and short tails.
  if (same >= 3 && q.length - same <= 2 && word.length - same <= 3) return 0.8;
  if (q.length >= 4 && word.includes(q)) return 0.7; // inside a word: "pravo" → vpravo
  return 0;
}

/**
 * A search over the dictionary in Slovak and one native language, best matches first.
 * Each query word has to match some word of an entry (see `wordMatch`; meanings count
 * a little less than the Slovak, and shorter entries come first on a tie). Only when
 * nothing matches that way does Fuse.js look for typos ("dakujm" → Ďakujem), keeping
 * just the near misses closest to the best. Case and accents never matter.
 */
export function dictionarySearch(entries: DictionaryEntry[], locale: Locale) {
  const docs = entries.map((entry) => {
    const sk = searchKey(entry.sk);
    const meaning = searchKey(entry.meaning[locale]);
    return { entry, sk, meaning, skWords: sk.split(" "), meaningWords: meaning.split(" ") };
  });
  const typos = new Fuse(docs, {
    keys: [
      { name: "sk", weight: 2 },
      { name: "meaning", weight: 1 },
    ],
    ignoreLocation: true,
    includeScore: true,
    threshold: 0.34,
  });

  return (query: string, limit = 8): DictionaryEntry[] => {
    const q = searchKey(query);
    if (q.length < 2) return [];
    const words = q.split(" ");
    const scored = docs
      .map((doc) => {
        let total = 0;
        for (const w of words) {
          const best = Math.max(
            ...doc.skWords.map((word) => wordMatch(w, word, true)),
            ...doc.meaningWords.map((word) => 0.95 * wordMatch(w, word, locale !== "en")),
          );
          if (!best) return null;
          total += best;
        }
        return { doc, score: total / words.length - 0.001 * doc.skWords.length };
      })
      .filter((hit) => hit !== null)
      .sort((a, b) => b.score - a.score); // stable: ties keep course order
    if (scored.length) return scored.slice(0, limit).map((hit) => hit.doc.entry);
    if (q.length < 4) return [];

    const hits = typos.search(q, { limit });
    const best = hits[0]?.score ?? 0;
    return hits.filter((hit) => (hit.score ?? 0) <= best + 0.25).map((hit) => hit.item.entry);
  };
}
