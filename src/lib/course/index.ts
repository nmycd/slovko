// The full course content. Import this from server code only (pages, route
// handlers): client components get what they need as props, so the browser
// never downloads every unit. Client-safe helpers live in ./helpers.
import { locales, type Locale } from "../i18n/locales";
import { speakableTexts } from "./helpers";
import { localizeUnit, type Catalog } from "./translatable";
import type { Lesson, Unit, UnitOutline } from "./types";
import { unit1 } from "./units/unit1";
import { unit2 } from "./units/unit2";
import { unit3 } from "./units/unit3";
import { unit4 } from "./units/unit4";
import { unit5 } from "./units/unit5";
import { unit6 } from "./units/unit6";
import { unit7 } from "./units/unit7";
import { unit8 } from "./units/unit8";
import { unit9 } from "./units/unit9";
import { unit10 } from "./units/unit10";
import uk1 from "./translations/uk/unit1.json";
import uk2 from "./translations/uk/unit2.json";
import uk3 from "./translations/uk/unit3.json";
import uk4 from "./translations/uk/unit4.json";
import uk5 from "./translations/uk/unit5.json";
import uk6 from "./translations/uk/unit6.json";
import uk7 from "./translations/uk/unit7.json";
import uk8 from "./translations/uk/unit8.json";
import uk9 from "./translations/uk/unit9.json";
import uk10 from "./translations/uk/unit10.json";
import ru1 from "./translations/ru/unit1.json";
import ru2 from "./translations/ru/unit2.json";
import ru3 from "./translations/ru/unit3.json";
import ru4 from "./translations/ru/unit4.json";
import ru5 from "./translations/ru/unit5.json";
import ru6 from "./translations/ru/unit6.json";
import ru7 from "./translations/ru/unit7.json";
import ru8 from "./translations/ru/unit8.json";
import ru9 from "./translations/ru/unit9.json";
import ru10 from "./translations/ru/unit10.json";

export type * from "./types";
export * from "./helpers";

// Follows the A1 syllabus of Krížom-krážom (Lekcia 1–10). Lesson content is
// original; the book sets the topic, vocabulary and grammar order.
export const course: Unit[] = [unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8, unit9, unit10];

export const allLessons: Lesson[] = course.flatMap((u) => u.lessons);

// Translation catalogs, in unit order (see ./translatable and scripts/sync-translations.ts).
const catalogs: Record<Exclude<Locale, "en">, Catalog[]> = {
  uk: [uk1, uk2, uk3, uk4, uk5, uk6, uk7, uk8, uk9, uk10] as Catalog[],
  ru: [ru1, ru2, ru3, ru4, ru5, ru6, ru7, ru8, ru9, ru10] as Catalog[],
};

/** The course with translations and explanations in the learner's native language. */
export const localizedCourse: Record<Locale, Unit[]> = Object.fromEntries(
  locales.map((locale) => [
    locale,
    locale === "en" ? course : course.map((unit, i) => localizeUnit(unit, catalogs[locale][i])),
  ]),
) as Record<Locale, Unit[]>;

export function findLesson(lessonId: string, locale: Locale = "en"): { unit: Unit; lesson: Lesson } | null {
  for (const unit of localizedCourse[locale]) {
    const lesson = unit.lessons.find((l) => l.id === lessonId);
    if (lesson) return { unit, lesson };
  }
  return null;
}

/** A lesson in every native language, for the lesson page. */
export function lessonVariants(lessonId: string): Record<Locale, Lesson> | null {
  const variants = locales.map((locale) => [locale, findLesson(lessonId, locale)?.lesson] as const);
  if (variants.some(([, lesson]) => !lesson)) return null;
  return Object.fromEntries(variants) as Record<Locale, Lesson>;
}

/** The lesson after `lessonId` in course order, if any. */
export function nextLessonId(lessonId: string): string | null {
  const i = allLessons.findIndex((l) => l.id === lessonId);
  return i >= 0 && i + 1 < allLessons.length ? allLessons[i + 1].id : null;
}

/** Units with lesson titles only, for the learning path, in every native language. */
export const courseOutlines: Record<Locale, UnitOutline[]> = Object.fromEntries(
  locales.map((locale) => [
    locale,
    localizedCourse[locale].map(({ lessons, ...unit }) => ({
      ...unit,
      lessons: lessons.map(({ id, title, titleEn, kind }) => ({ id, title, titleEn, kind })),
    })),
  ]),
) as Record<Locale, UnitOutline[]>;

/**
 * Every Slovak string in the course that may be sent to text-to-speech.
 * The TTS route only accepts these, so the API key can't be used for
 * arbitrary text.
 */
export const speakableSet: ReadonlySet<string> = new Set(
  allLessons.flatMap((l) => l.exercises.flatMap(speakableTexts)),
);
