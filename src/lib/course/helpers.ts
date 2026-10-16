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
export const TILE_CLIPS_VERSION = 3;

/**
 * A text that is one word, without a "?", "!" or "." that would give it a tone of its
 * own: "ma", "kúpeľňa", but not "Prosím?". Played anywhere (matching, intro cards,
 * spelling, options, review), such a word has its clip cut from a take of words said
 * one at a time (scripts/word-audio.ts), like a tile, when `WORD_CLIPS` is on.
 */
export function isBareWord(text: string): boolean {
  return toTiles(text).length === 1 && !/[.?!…]$/.test(text.trim());
}

/** Whether single words play their word-by-word clips (words/) or their own old ones. */
export const WORD_CLIPS = true;

/** The version of the single-word clips, in their URLs: bump it after making them again. */
export const WORD_CLIPS_VERSION = 1;

type TileStyleSpec = {
  label: string;
  /** A word said faster than this (seconds) is slowed to it, pitch kept. */
  shortest: number;
  /** Silence first, so the word isn't lost while the audio output wakes up. */
  leadInMs: number;
  /**
   * Option E: not cut from the sentence, but from a take of its own of the exercise's
   * words said one at a time, joined with this (". " or "… "), so every cut falls in a
   * pause. Paid: only voiced when named (`--styles e1`).
   */
  words?: string;
};

/**
 * Ways to make a tile's clip (CONTENT-PIPELINE.md, stage 9, "How we got here: the
 * styles compared"). Lessons play `LESSON_TILE_STYLE`; dev mode plays them all side by side
 * under each word-order exercise. A to D are cut from the sentence; E1 and E2 from the
 * words said one at a time.
 */
export const tileStyles = {
  a: { label: "A: as said", shortest: 0, leadInMs: 0 },
  b: { label: "B: 60 ms first", shortest: 0, leadInMs: 60 },
  c: { label: "C: B, slowed to 0.16 s", shortest: 0.16, leadInMs: 60 },
  d: { label: "D: B, slowed to 0.20 s", shortest: 0.2, leadInMs: 60 },
  e1: { label: "E1: word by word, “To. Je.”", shortest: 0, leadInMs: 60, words: ". " },
  e2: { label: "E2: word by word, “To… je…”", shortest: 0, leadInMs: 60, words: "… " },
} satisfies Record<string, TileStyleSpec>;

export type TileStyle = keyof typeof tileStyles;

/** A style's settings, typed so the optional ones can be read. */
export function tileStyle(style: TileStyle): TileStyleSpec {
  return tileStyles[style];
}

/**
 * The style lessons play a tile in (from tile-styles/), or null for the word's own
 * clip. A tile with no clip in it plays the word's own clip too. E2 since October 2026:
 * cut from a fluent sentence, short words (je, to, sú, kde) lost their first or last
 * sound in every style; said one at a time, they don't.
 */
export const LESSON_TILE_STYLE: TileStyle | null = "e2";

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
