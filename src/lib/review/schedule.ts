// The scheduler: FSRS (Free Spaced Repetition Scheduler, Anki's default since 2023),
// through ts-fsrs with its default weights. Each answer moves a card's due date to
// about when the learner would otherwise forget it (90% recall target).
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";

const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 365,
    enable_fuzz: true,
    // Sessions repeat a missed card themselves; FSRS schedules in days.
    enable_short_term: false,
  }),
);

/** A card's FSRS state as stored (dates as epoch milliseconds). */
export type StoredCard = Omit<Card, "due" | "last_review"> & { due: number; last_review?: number };

export const ratings = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good } as const;

const store = (card: Card): StoredCard => ({
  ...card,
  due: card.due.getTime(),
  last_review: card.last_review?.getTime(),
});

const load = (card: StoredCard): Card => ({
  ...card,
  due: new Date(card.due),
  last_review: card.last_review === undefined ? undefined : new Date(card.last_review),
});

/** A card just met in a lesson: new, and due straight away. */
export function newCard(now: number): StoredCard {
  return store(createEmptyCard(new Date(now)));
}

/** The card after an answer. */
export function graded(card: StoredCard, rating: Grade, now: number): StoredCard {
  return store(scheduler.next(load(card), new Date(now), rating).card);
}

/**
 * Whether an answer really moved a card: its first review, or a next interval that
 * changed by at least a day and at least a tenth. Not a card that's stuck, at the
 * 365-day cap or missed again at a day.
 */
export function moved(before: StoredCard, after: StoredCard): boolean {
  if (before.state === State.New) return true;
  return Math.abs(after.scheduled_days - before.scheduled_days) >= Math.max(1, 0.1 * before.scheduled_days);
}

export function isNew(card: StoredCard): boolean {
  return card.state === State.New;
}

/** Days the card is expected to stay remembered at 90%: how well it's known. */
export function strength(card: StoredCard): number {
  return card.state === State.New ? 0 : card.stability;
}
