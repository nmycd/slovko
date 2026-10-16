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
 * Ways to make a tile's clip from its cut (CONTENT-PIPELINE.md, stage 9, "Short words:
 * the options"): a word said faster than `shortest` seconds is slowed to it, pitch
 * kept, and `leadInMs` of silence goes first, so the word isn't lost while the audio
 * output wakes up. Lessons play `LIVE_TILE_STYLE`; dev mode plays all of them side by
 * side under each word-order exercise.
 */
export const tileStyles = {
  a: { label: "A: as said", shortest: 0, leadInMs: 0 },
  b: { label: "B: 60 ms first", shortest: 0, leadInMs: 60 },
  c: { label: "C: B, slowed to 0.16 s", shortest: 0.16, leadInMs: 60 },
  d: { label: "D: B, slowed to 0.20 s", shortest: 0.2, leadInMs: 60 },
} as const;

export type TileStyle = keyof typeof tileStyles;

export const LIVE_TILE_STYLE: TileStyle = "c";

export function isTileStyle(value: string): value is TileStyle {
  return Object.hasOwn(tileStyles, value);
}

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
