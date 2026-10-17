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

/** A finished lesson as progress keeps it: `at`, when last finished (missing on older records). */
type Finished = { at?: number };

/**
 * Up to `size` exercises from lessons the learner has met: those they've finished,
 * and writing lessons they've reached (optional, and where most dictations live: met
 * once the lesson before them is finished). Recently finished lessons come up more often: met lessons are ranked by when
 * they were last finished, newest first, and the lesson ranked r weighs 1/√(r+1), so
 * after 150 lessons the last ten get about a fifth of the picks and the oldest half
 * still about a third. Ranking by time rather than by place in the course keeps the
 * weights sane when lessons are taken out of order (Premium learners may play ahead).
 * A writing lesson reached but not taken counts as finished when the lesson before it
 * was; records with no time rank after all timed ones, later lessons first. Drawn
 * without repeats, weighted (Efraimidis–Spirakis).
 */
export function pickPractice(
  items: PracticeItem[],
  order: LessonOrder,
  completed: Record<string, Finished>,
  size = PRACTICE_SIZE,
  random: () => number = Math.random,
): PracticeItem[] {
  // When each met lesson was finished, or reached (0: not known).
  const when = new Map<number, number>();
  order.forEach((lesson, at) => {
    const done = completed[lesson.id] ?? (lesson.writing && at > 0 ? completed[order[at - 1].id] : undefined);
    if (done) when.set(at, done.at ?? 0);
  });
  const rank = new Map(
    [...when.entries()]
      .sort(([a, ta], [b, tb]) => tb - ta || b - a)
      .map(([at], r) => [at, r]),
  );
  return items
    .filter((item) => rank.has(item.at))
    .map((item) => ({ item, key: random() ** Math.sqrt(rank.get(item.at)! + 1) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, size)
    .map(({ item }) => item);
}
