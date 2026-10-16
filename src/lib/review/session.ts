// Builds a review session and grades its answers. Pure, so the rules are easy to test.
//
// Each item has two cards: recognition (Slovak → meaning) and recall (meaning →
// Slovak). Each card is asked with a drill that gets harder as the card gets
// stronger (its FSRS stability, in days):
//
//   recognition  read Slovak, pick the meaning   → (7 days) hear it, pick the meaning
//   recall       pick the Slovak for a meaning   → (7 days) type it from audio
//                                                → (21 days) type it from the meaning
//
// The answer becomes the FSRS rating: wrong → Again; right but with a slip
// (missing accents, a typo) → Hard; right on an easier drill than the card's
// strength calls for (audio switched off) → Hard; otherwise → Good.
import type { Grade } from "ts-fsrs";
import type { Locale } from "@/lib/i18n";
import { cardId, parseCardId, type Direction, type ReviewItem } from "./items";
import { isNew, ratings, strength, type StoredCard } from "./schedule";

/** Up to this many cards per session; new cards fill what's left, up to `NEW_PER_SESSION`. */
export const SESSION_SIZE = 15;
export const NEW_PER_SESSION = 10;
/**
 * A recall card joins once the item has been recognised in a review: FSRS gives a
 * first right answer a stability of about 2.3 days.
 */
export const RECALL_AFTER = 2;

export type Drill = "read" | "listen" | "pick" | "dictation" | "type";

/** Each direction's drills, easiest first. */
const ladder: Record<Direction, Drill[]> = {
  recognize: ["read", "listen"],
  recall: ["pick", "dictation", "type"],
};

/** Drills that need sound, and what they become without it. */
export const withoutAudio: Partial<Record<Drill, Drill>> = { listen: "read", dictation: "pick" };

/** One card of a session. `options` are item ids (the answer among them) for choice drills. */
export type SessionCard = {
  cardId: string;
  itemId: string;
  direction: Direction;
  drill: Drill;
  options: string[];
  answer: number;
};

export function drillFor(direction: Direction, card: StoredCard): Drill {
  const days = strength(card);
  if (direction === "recognize") return days < 7 ? "read" : "listen";
  return days < 7 ? "pick" : days < 21 ? "dictation" : "type";
}

/** The FSRS rating for an answer to `asked`, when the card called for `expected`. */
export function ratingFor(
  direction: Direction,
  expected: Drill,
  asked: Drill,
  result: { correct: boolean; note?: string },
): Grade {
  if (!result.correct) return ratings.again;
  const easier = ladder[direction].indexOf(asked) < ladder[direction].indexOf(expected);
  return result.note || easier ? ratings.hard : ratings.good;
}

/** Recall cards an item is ready for: recognised for `RECALL_AFTER` days, with no recall card yet. */
export function recallReady(cards: Record<string, StoredCard>): string[] {
  return Object.entries(cards)
    .map(([id, card]) => ({ ...parseCardId(id), card }))
    .filter(
      ({ itemId, direction, card }) =>
        direction === "recognize" && strength(card) >= RECALL_AFTER && !cards[cardId(itemId, "recall")],
    )
    .map(({ itemId }) => cardId(itemId, "recall"));
}

/** Cards due now (reviewed before) and new cards waiting for their first review. */
export function reviewCounts(cards: Record<string, StoredCard>, now: number): { due: number; fresh: number } {
  let due = 0;
  let fresh = 0;
  for (const card of Object.values(cards)) {
    if (isNew(card)) fresh++;
    else if (card.due <= now) due++;
  }
  return { due, fresh };
}

/** When the next card falls due, if none is due now. */
export function nextDue(cards: Record<string, StoredCard>, now: number): number | null {
  const later = Object.values(cards)
    .filter((c) => !isNew(c) && c.due > now)
    .map((c) => c.due);
  return later.length ? Math.min(...later) : null;
}

/**
 * Due cards first (most overdue first), then new ones in course order, at most one
 * card per item, so a word isn't asked both ways in one session.
 */
export function buildSession(
  deck: ReviewItem[],
  cards: Record<string, StoredCard>,
  now: number,
  random: () => number = Math.random,
): SessionCard[] {
  const items = new Map(deck.map((item, order) => [item.id, { item, order }]));
  const all = Object.entries(cards)
    .map(([id, card]) => ({ id, card, ...parseCardId(id) }))
    .filter((c) => items.has(c.itemId));
  const due = all.filter((c) => !isNew(c.card) && c.card.due <= now).sort((a, b) => a.card.due - b.card.due);
  const fresh = all
    .filter((c) => isNew(c.card))
    .sort((a, b) => items.get(a.itemId)!.order - items.get(b.itemId)!.order);

  const picked: typeof all = [];
  const seenItems = new Set<string>();
  const take = (list: typeof all, limit: number) => {
    for (const c of list) {
      if (picked.length >= SESSION_SIZE || limit <= 0) return;
      if (seenItems.has(c.itemId)) continue;
      seenItems.add(c.itemId);
      picked.push(c);
      limit--;
    }
  };
  take(due, SESSION_SIZE);
  take(fresh, NEW_PER_SESSION);

  const known = new Set(deck.filter((item) => cards[cardId(item.id, "recognize")]).map((item) => item.id));
  return shuffle(picked, random).map(({ id, itemId, direction, card }) => {
    const drill = drillFor(direction, card);
    const item = items.get(itemId)!.item;
    const options = shuffle([item, ...distractors(item, deck, known, random)], random);
    return {
      cardId: id,
      itemId,
      direction,
      drill,
      options: options.map((o) => o.id),
      answer: options.indexOf(item),
    };
  });
}

/** Normalised text, to tell options apart. */
const key = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** Two items read the same: the same Slovak, or the same meaning in some language. */
const confusable = (a: ReviewItem, b: ReviewItem) =>
  key(a.sk) === key(b.sk) ||
  (Object.keys(a.meaning) as Locale[]).some((l) => key(a.meaning[l]) === key(b.meaning[l]));

/** What an item looks like as an option: a bare word, a question or another sentence, and how long. */
type Shape = { form: "word" | "question" | "sentence"; exclaims: boolean; pos: string; topic?: string; words: number };

function shapeOf(item: ReviewItem): Shape {
  const last = item.sk.trim().at(-1);
  const form = last === "?" ? "question" : last === "." || last === "!" ? "sentence" : "word";
  return {
    form,
    exclaims: last === "!",
    // From the word's tags (lexicon.ts); without them, a "to …" gloss is a verb.
    pos: item.tags?.pos ?? (/^to /i.test(item.meaning.en) ? "verb" : form === "word" ? "noun" : "expression"),
    topic: item.tags?.topic,
    words: item.sk.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length,
  };
}

/**
 * How unlike two shapes are. A question among statements, or a bare word among
 * sentences, gives itself away; "Dobrú chuť!" among "Dobrý deň." hardly does; an
 * adjective among nouns does. Sharing a topic brings an option closer: rooms
 * among rooms, food among food, which makes the choice a real one.
 */
function shapeDistance(a: Shape, b: Shape): number {
  let distance = 0;
  if (a.form !== b.form) distance += a.form === "question" || b.form === "question" ? 4 : 3;
  else if (a.exclaims !== b.exclaims) distance += 1;
  if (a.pos !== b.pos) distance += 2;
  if (a.topic && a.topic === b.topic) distance -= 1;
  return distance + Math.min(2, Math.abs(a.words - b.words));
}

/**
 * Three wrong options shaped like the answer (a word among words, a question among
 * questions, the same part of speech, about as long, from the same topic where it
 * can), preferring words the learner has met, which can't be
 * mistaken for the answer or each other (so "Ahoj" and "Čau", both "Hi", never compete).
 * Being new counts like one step of shape; the random part varies the pick among equals.
 */
function distractors(item: ReviewItem, deck: ReviewItem[], known: Set<string>, random: () => number): ReviewItem[] {
  const shape = shapeOf(item);
  const ranked = deck
    .filter((other) => other !== item)
    .map((other) => ({
      other,
      score: shapeDistance(shape, shapeOf(other)) + (known.has(other.id) ? 0 : 1) + random(),
    }))
    .sort((a, b) => a.score - b.score);
  const chosen: ReviewItem[] = [];
  for (const { other } of ranked) {
    if (chosen.length === 3) break;
    if ([item, ...chosen].some((x) => confusable(x, other))) continue;
    chosen.push(other);
  }
  return chosen;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
