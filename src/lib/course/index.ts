import type { Exercise, Lesson, Unit } from "./types";
import { unit1 } from "./units/unit1";
import { unit2 } from "./units/unit2";

export type * from "./types";

// Units 3–10 follow the A1 syllabus order (Krížom-krážom A1). Lessons are
// still to be written; they show on the path as "coming soon".
function planned(
  number: number,
  title: string,
  titleEn: string,
  topics: string[],
  grammar: string[],
): Unit {
  return { id: `u${number}`, number, title, titleEn, topics, grammar, premium: true, lessons: [] };
}

export const course: Unit[] = [
  unit1,
  unit2,
  planned(3, "Internát", "Dormitory", ["Home and office", "Directions", "Opposites"], [
    "Adjectives",
    "Possessive pronouns",
    "Čí? Aký? Ktorý?",
  ]),
  planned(4, "Mestá a miesta", "Towns and places", ["The town", "Jobs"], [
    "Nominative case",
    "Numbers 2, 3, 4 + nouns",
    "The verb stáť",
  ]),
  planned(5, "Dnes máme oslavu", "We have a party today", ["Shopping", "Colours"], [
    "Accusative case",
    "Modal verbs",
    "The verb ísť",
  ]),
  planned(6, "V reštaurácii", "In the restaurant", ["Restaurant", "Getting around"], [
    "Instrumental case",
    "Verb groups V–VII",
  ]),
  planned(7, "Na univerzite", "At university", ["University", "Daily routine", "Telling time"], [
    "Past tense",
    "Ešte, už",
  ]),
  planned(8, "Vo firme", "In the company", ["Days and months", "Dates", "CV"], [
    "Locative case",
    "Double negation",
  ]),
  planned(9, "Na konferencii", "At the conference", ["Conference", "Computers"], [
    "Reflexive verbs",
  ]),
  planned(10, "Noviny", "Newspapers", ["Review"], ["Review of A1"]),
];

export const allLessons: Lesson[] = course.flatMap((u) => u.lessons);

export function findLesson(lessonId: string): { unit: Unit; lesson: Lesson } | null {
  for (const unit of course) {
    const lesson = unit.lessons.find((l) => l.id === lessonId);
    if (lesson) return { unit, lesson };
  }
  return null;
}

/** The lesson after `lessonId` in course order, if any. */
export function nextLessonId(lessonId: string): string | null {
  const i = allLessons.findIndex((l) => l.id === lessonId);
  return i >= 0 && i + 1 < allLessons.length ? allLessons[i + 1].id : null;
}

/** Slovak strings an exercise may play as audio. */
export function speakableTexts(ex: Exercise): string[] {
  switch (ex.type) {
    case "intro":
    case "listen":
    case "speak":
      return [ex.sk];
    case "choice":
      return [ex.sk, ex.optionsLang === "sk" ? ex.options[ex.answer] : undefined].filter(
        (t): t is string => Boolean(t),
      );
    case "build":
      return ex.promptLang === "sk" ? [ex.prompt] : [ex.answers[0]];
    case "match":
      return ex.pairs.map((p) => p.sk);
    case "fill":
      return [fillSentence(ex.before, ex.options[ex.answer], ex.after)];
  }
}

export function fillSentence(before: string, word: string, after: string): string {
  return `${before} ${word}${/^[.,!?…]/.test(after) ? "" : " "}${after}`.trim();
}

/**
 * Every Slovak string in the course that may be sent to text-to-speech.
 * The TTS route only accepts these, so the API key can't be used for
 * arbitrary text.
 */
export const speakableSet: ReadonlySet<string> = new Set(
  allLessons.flatMap((l) => l.exercises.flatMap(speakableTexts)),
);
