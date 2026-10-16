// Content-free helpers, safe to import from client components (unlike
// ./index, which pulls in every unit's lessons).
import { toTiles } from "@/lib/answers";
import type { Exercise } from "./types";

/** Removes **highlight** markup, e.g. for audio. */
export function stripMarkup(text: string): string {
  return text.replace(/\*\*/g, "");
}

export function fillSentence(before: string, word: string, after: string): string {
  return `${before} ${word}${/^[.,!?…]/.test(after) ? "" : " "}${after}`.trim();
}

/**
 * The one-letter prepositions v, z, s and k. Slovak says them as part of the next
 * word, so on their own they'd be a click: their tiles play nothing.
 */
export function isSilentTile(word: string): boolean {
  return /^[vzsk]$/i.test(word);
}

/**
 * The version of the tile clips, in their URLs: bump it after cutting them again
 * (`generate:audio -- --recut`), or browsers keep the old ones for up to a week.
 */
export const TILE_CLIPS_VERSION = 2;

/**
 * The tiles of a word-order exercise with a Slovak answer that play a sound, right
 * and wrong ones, each once. Each has its own clip cut from a take of the exercise's
 * sentence (scripts/tile-audio.ts), falling back to the word's own clip.
 */
export function tileWords(ex: Exercise): string[] {
  if (ex.type !== "build" || ex.promptLang !== "en") return [];
  return [...new Set([...toTiles(ex.answers[0]), ...ex.distractors])].filter((w) => !isSilentTile(w));
}

/** Slovak strings an exercise may play as audio. */
export function speakableTexts(ex: Exercise): string[] {
  const texts = ((): (string | undefined)[] => {
    switch (ex.type) {
      case "intro":
      case "listen":
      case "spell":
      case "speak":
        return [ex.sk];
      case "choice":
        return [ex.sk, ex.optionsLang === "sk" ? ex.options[ex.answer] : undefined];
      case "build":
        // Building Slovak: tapping a word tile speaks that word. Its clip is cut from the
        // sentence; the word's own clip stands in until it is.
        return ex.promptLang === "sk" ? [ex.prompt] : [ex.answers[0], ...tileWords(ex)];
      case "match":
        return ex.pairs.map((p) => p.sk);
      case "memorize":
        return (ex.words ?? []).map((w) => w.sk);
      case "fill":
        return [fillSentence(ex.before, ex.options[ex.answer], ex.after)];
      case "grammar":
        return (ex.examples ?? []).map((e) => e.sk);
    }
  })();
  return texts.filter((t): t is string => Boolean(t)).map(stripMarkup);
}
