// Review items: the words and short set phrases taught on intro cards ("kuchyňa",
// "Dobrý deň", "Ako sa máš?"), not sentences or lists. Each item is reviewed in
// both directions, as two cards with their own schedules (see ./session).
// Client-safe; the deck itself is built on the server (see `reviewDeck` in
// ../course) and served at /api/review-deck.
import { stripMarkup } from "@/lib/course/helpers";
import type { Exercise } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n";

export type ReviewItem = {
  /** Stable id: the Slovak, normalised (see `reviewItemId`). */
  id: string;
  sk: string;
  /** The meaning in each native language. */
  meaning: Record<Locale, string>;
  /** Every lesson that teaches it, in course order. */
  lessons: string[];
};

/** Recognition: Slovak → meaning. Recall: meaning → Slovak. */
export type Direction = "recognize" | "recall";

/**
 * An item's id is its Slovak (lowercase, markup and final punctuation off), so a
 * learner's history survives lessons being edited or reordered, and a word taught
 * twice is one item.
 */
export function reviewItemId(sk: string): string {
  return stripMarkup(sk)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?…]+$/, "")
    .trim();
}

/** A word or set phrase of up to three words; not a sentence, and not a list ("jeden, dva, tri"). */
export function isReviewable(sk: string): boolean {
  const text = stripMarkup(sk);
  return text.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length <= 3 && !/[,;–—]/.test(text);
}

/** The items a lesson card puts in the review deck: an intro card's word or phrase. */
export function taughtItemIds(ex: Exercise): string[] {
  return ex.type === "intro" && isReviewable(ex.sk) ? [reviewItemId(ex.sk)] : [];
}

/** A card is one item in one direction. */
export const cardId = (itemId: string, direction: Direction) => `${itemId}|${direction}`;

export function parseCardId(id: string): { itemId: string; direction: Direction } {
  const cut = id.lastIndexOf("|");
  return { itemId: id.slice(0, cut), direction: id.slice(cut + 1) as Direction };
}
