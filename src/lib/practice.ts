// Extra practice (writing, pronunciation): ten exercises the learner has met, drawn
// mostly from where they are now. Pure, so the rules are easy to test.
import type { Locale } from "@/lib/i18n";

export type PracticeKind = "writing" | "pronunciation";

/** One exercise of the pool: where its lesson sits in course order (`at`), and its meaning in each language. */
export type PracticeItem = {
  id: string;
  lessonId: string;
  at: number;
  sk: string;
  en: Record<Locale, string>;
};

/** Every lesson in course order (A1, then A2): its id and whether it's an optional writing lesson. */
export type LessonOrder = { id: string; writing: boolean }[];

export const PRACTICE_SIZE = 10;

/**
 * Up to `size` exercises from lessons the learner has met: those they've finished,
 * and writing lessons they've passed on the path (optional, and where most dictations
 * live). Recent ones come up more often: an exercise d lessons back from the furthest
 * finished lesson weighs 1/√(d+1), so the last ten lessons get about a fifth of the
 * picks after 150 lessons and the oldest half still about a third. Drawn without
 * repeats, weighted (Efraimidis–Spirakis).
 */
export function pickPractice(
  items: PracticeItem[],
  order: LessonOrder,
  completed: Record<string, unknown>,
  size = PRACTICE_SIZE,
  random: () => number = Math.random,
): PracticeItem[] {
  const furthest = order.findLastIndex((l) => completed[l.id]);
  if (furthest < 0) return [];
  const met = (at: number) => at <= furthest && (Boolean(completed[order[at].id]) || order[at].writing);
  return items
    .filter((item) => met(item.at))
    .map((item) => ({ item, key: random() ** Math.sqrt(furthest - item.at + 1) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, size)
    .map(({ item }) => item);
}
