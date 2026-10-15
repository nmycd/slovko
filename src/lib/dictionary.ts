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
 * A search over the dictionary in Slovak and one native language, best matches first.
 * Fuse.js matches anywhere in a phrase ("pravo" finds "vľavo – vpravo") and forgives
 * typos ("kavu" finds "káva"); case and accents never matter. Queries of up to three
 * letters match exactly only, and results far below the best match are dropped, so a
 * search doesn't drown in near misses.
 */
export function dictionarySearch(entries: DictionaryEntry[], locale: Locale) {
  const docs = entries.map((entry) => ({ entry, sk: searchKey(entry.sk), meaning: searchKey(entry.meaning[locale]) }));
  const options = {
    keys: [
      { name: "sk", weight: 2 },
      { name: "meaning", weight: 1 },
    ],
    ignoreLocation: true,
    includeScore: true,
  };
  const fuzzy = new Fuse(docs, { ...options, threshold: 0.34 });
  const exact = new Fuse(docs, { ...options, threshold: 0 });
  return (query: string, limit = 8): DictionaryEntry[] => {
    const q = searchKey(query);
    if (q.length < 2) return [];
    const hits = (q.length <= 3 ? exact : fuzzy).search(q, { limit });
    const best = hits[0]?.score ?? 0;
    return hits.filter((hit) => (hit.score ?? 0) <= best + 0.25).map((hit) => hit.item.entry);
  };
}
