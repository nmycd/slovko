// The full course content. Import this from server code only (pages, route
// handlers): client components get what they need as props, so the browser
// never downloads every unit. Client-safe helpers live in ./helpers.
import type { DictionaryEntry } from "../dictionary";
import { isReviewable, reviewItemId, type ReviewItem } from "../review/items";
import { locales, type Locale } from "../i18n/locales";
import { speakableTexts, stripMarkup } from "./helpers";
import { lessonIllustrations } from "./illustrations";
import { lexicon } from "./lexicon";
import { addSpelling } from "./spelling";
import { namesIn, withTileCase } from "./tile-case";
import { localizeUnit, type Catalog } from "./translatable";
import type { BuildExercise, Exercise, ExerciseId, Lesson, MemoWord, Unit, UnitOutline } from "./types";
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
import uz1 from "./translations/uz/unit1.json";
import uz2 from "./translations/uz/unit2.json";
import uz3 from "./translations/uz/unit3.json";
import uz4 from "./translations/uz/unit4.json";
import uz5 from "./translations/uz/unit5.json";
import uz6 from "./translations/uz/unit6.json";
import uz7 from "./translations/uz/unit7.json";
import uz8 from "./translations/uz/unit8.json";
import uz9 from "./translations/uz/unit9.json";
import uz10 from "./translations/uz/unit10.json";
import ka1 from "./translations/ka/unit1.json";
import ka2 from "./translations/ka/unit2.json";
import ka3 from "./translations/ka/unit3.json";
import ka4 from "./translations/ka/unit4.json";
import ka5 from "./translations/ka/unit5.json";
import ka6 from "./translations/ka/unit6.json";
import ka7 from "./translations/ka/unit7.json";
import ka8 from "./translations/ka/unit8.json";
import ka9 from "./translations/ka/unit9.json";
import ka10 from "./translations/ka/unit10.json";

export type * from "./types";
export * from "./helpers";

// Follows the A1 syllabus of Krížom-krážom (Lekcia 1–10). Lesson content is
// original; the book sets the topic, vocabulary and grammar order.
export const course: Unit[] = [unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8, unit9, unit10];

/** The lessons as written (no spelling cards): for ids and order. `findLesson` gives a lesson as played. */
export const allLessons: Lesson[] = course.flatMap((u) => u.lessons);

// Translation catalogs, in unit order (see ./translatable and scripts/sync-translations.ts).
const catalogs: Record<Exclude<Locale, "en">, Catalog[]> = {
  uk: [uk1, uk2, uk3, uk4, uk5, uk6, uk7, uk8, uk9, uk10] as Catalog[],
  ru: [ru1, ru2, ru3, ru4, ru5, ru6, ru7, ru8, ru9, ru10] as Catalog[],
  uz: [uz1, uz2, uz3, uz4, uz5, uz6, uz7, uz8, uz9, uz10] as Catalog[],
  ka: [ka1, ka2, ka3, ka4, ka5, ka6, ka7, ka8, ka9, ka10] as Catalog[],
};

/**
 * The course as played: translations and explanations in the learner's native
 * language, spelling cards (./spelling) in the lessons, and word-order tiles marked
 * for lowercase display (./tile-case).
 */
export const localizedCourse: Record<Locale, Unit[]> = Object.fromEntries(
  locales.map((locale) => {
    const units = locale === "en" ? course : course.map((unit, i) => localizeUnit(unit, catalogs[locale][i]));
    // Spelling cards' glosses and explanations' grammar cards point at exercises by "lessonId#exerciseId".
    const lessons = new Map(units.flatMap((u) => u.lessons).map((l) => [l.id, l]));
    const meaning = (gloss: string) => {
      const [lessonId, id] = gloss.split("#");
      const ex = lessons.get(lessonId)?.exercises.find((x) => x.id === id);
      return ex?.type === "intro" ? ex.en : undefined;
    };
    const names = namesIn([...lessons.values()]);
    // An explanation's grammar card, with the unit and lesson it's in.
    const places = new Map(
      units.flatMap((u) =>
        u.lessons.map((l, i) => [l.id, { unit: u.number, lesson: i + 1, title: l.title }] as const),
      ),
    );
    const withRule = (ex: Exercise): Exercise => {
      if ((ex.type !== "choice" && ex.type !== "fill") || !ex.ref) return ex;
      const [lessonId, id] = ex.ref.split("#");
      const exercises = lessons.get(lessonId)?.exercises ?? [];
      const index = exercises.findIndex((x) => x.id === id);
      const card = exercises[index];
      const place = places.get(lessonId);
      return card?.type === "grammar" && place
        ? { ...ex, rule: { card, ...place, index, count: exercises.length } }
        : ex;
    };
    const played = (lesson: Lesson) => {
      const withSpelling = addSpelling(lesson, meaning);
      return {
        ...withSpelling,
        exercises: withSpelling.exercises.map((ex) => withRule(withTileCase(ex, names))),
      };
    };
    return [locale, withWordPools(units.map((unit) => ({ ...unit, lessons: unit.lessons.map(played) })))];
  }),
) as Record<Locale, Unit[]>;

/**
 * Gives each writing lesson its `wordPool`: the words taught on intro cards since the
 * previous writing lesson (those word review takes too: up to three words, no lists),
 * once each. It keeps as many memorize rounds as the pool fills, four words a round.
 */
function withWordPools(units: Unit[]): Unit[] {
  let since = new Map<string, MemoWord>();
  return units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((lesson) => {
      if (lesson.kind !== "writing") {
        for (const ex of lesson.exercises) {
          if (ex.type !== "intro" || !isReviewable(ex.sk)) continue;
          const sk = stripMarkup(ex.sk);
          if (!since.has(sk.toLowerCase())) since.set(sk.toLowerCase(), { sk, en: stripMarkup(ex.en) });
        }
        return lesson;
      }
      const wordPool = [...since.values()];
      since = new Map();
      let rounds = Math.floor(wordPool.length / 4);
      return { ...lesson, wordPool, exercises: lesson.exercises.filter((ex) => ex.type !== "memorize" || rounds-- > 0) };
    }),
  }));
}

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

/**
 * The dictionary on /learn, in course order: every word and phrase the course
 * teaches (intro cards, grammar-card examples and matching pairs; each once, where it
 * first appears), and every grammar card. A word opens the card that teaches it: its
 * intro or grammar card, or for a matching pair the last of those before the pair.
 */
export const dictionary: DictionaryEntry[] = (() => {
  const seen = new Set<string>();
  const entries: DictionaryEntry[] = [];
  localizedCourse.en.forEach((unit, u) =>
    unit.lessons.forEach((lesson, l) => {
      const place = { lessonId: lesson.id, unit: unit.number, lesson: l + 1 };
      // A text of exercise `i` in each native language (English where one is missing).
      const inEach = (i: number, pick: (ex: Exercise) => string | undefined) =>
        Object.fromEntries(
          locales.map((locale) => [
            locale,
            pick(localizedCourse[locale][u].lessons[l].exercises[i]) ?? pick(lesson.exercises[i]) ?? "",
          ]),
        ) as Record<Locale, string>;
      const word = (from: "word" | "phrase", sk: string, meaning: Record<Locale, string>, card: ExerciseId) => {
        const text = stripMarkup(sk);
        const key = text.toLowerCase().replace(/[.!?…]+$/, "");
        if (seen.has(key)) return;
        seen.add(key);
        entries.push({ kind: from, sk: text, meaning, ...place, card });
      };

      let teaching: ExerciseId | undefined; // the last intro or grammar card so far
      lesson.exercises.forEach((ex, i) => {
        if (ex.type === "intro") {
          teaching = ex.id;
          word("word", ex.sk, inEach(i, (x) => (x.type === "intro" ? x.en : undefined)), ex.id);
        } else if (ex.type === "grammar") {
          teaching = ex.id;
          // Found by its title, or by a little word in its table (the tables mix Slovak
          // with translations, too noisy to search in full); its examples lead here too.
          const table = [...(ex.table?.head ?? []), ...(ex.table?.rows.flat() ?? [])];
          entries.push({
            kind: "grammar",
            sk: "",
            table: stripMarkup(table.join(" ")),
            meaning: inEach(i, (x) => (x.type === "grammar" ? x.title : undefined)),
            ...place,
            card: ex.id,
          });
          ex.examples?.forEach((e, k) =>
            word("phrase", e.sk, inEach(i, (x) => (x.type === "grammar" ? x.examples?.[k]?.en : undefined)), ex.id),
          );
        } else if (ex.type === "match" && teaching) {
          const card = teaching;
          ex.pairs.forEach((p, k) =>
            word("phrase", p.sk, inEach(i, (x) => (x.type === "match" ? x.pairs[k]?.en : undefined)), card),
          );
        }
      });
    }),
  );
  return entries;
})();

/**
 * The spaced-repetition deck: every word or short set phrase taught on an intro
 * card (no sentences or lists), once each, with every lesson that teaches it
 * (see ../review).
 */
export const reviewDeck: ReviewItem[] = (() => {
  const items = new Map<string, ReviewItem>();
  localizedCourse.en.forEach((unit, u) =>
    unit.lessons.forEach((lesson, l) => {
      const pictures = lessonIllustrations(lesson.id);
      lesson.exercises.forEach((ex, i) => {
        if (ex.type !== "intro" || !isReviewable(ex.sk)) return;
        const id = reviewItemId(ex.sk);
        const picture = pictures[ex.id];
        const item = items.get(id);
        if (item) {
          if (!item.lessons.includes(lesson.id)) item.lessons.push(lesson.id);
          item.picture ??= picture;
          return;
        }
        const meaning = Object.fromEntries(
          locales.map((locale) => {
            const same = localizedCourse[locale][u].lessons[l].exercises[i];
            return [locale, same.type === "intro" ? same.en : ex.en];
          }),
        ) as Record<Locale, string>;
        const tags = lexicon[id];
        items.set(id, {
          id,
          sk: stripMarkup(ex.sk),
          meaning,
          lessons: [lesson.id],
          ...(picture && { picture }),
          ...(tags && { tags }),
        });
      });
    }),
  );
  return [...items.values()];
})();

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
  localizedCourse.en.flatMap((u) => u.lessons).flatMap((l) => l.exercises.flatMap(speakableTexts)),
);

/**
 * Word-order exercises with a Slovak answer, by lesson and id ("u3-l1#build-kde-je"):
 * their tiles have clips cut from their own sentence (see `tileWords`).
 */
export const tileExercises: ReadonlyMap<string, BuildExercise> = new Map(
  allLessons.flatMap((l) =>
    l.exercises.flatMap((ex) =>
      ex.type === "build" && ex.promptLang === "en" ? [[`${l.id}#${ex.id}`, ex] as const] : [],
    ),
  ),
);

/** The sentences of speaking exercises: what /api/stt accepts as the expected answer. */
export const speakTargets: ReadonlySet<string> = new Set(
  localizedCourse.en
    .flatMap((u) => u.lessons)
    .flatMap((l) => l.exercises.flatMap((ex) => (ex.type === "speak" ? [ex.sk] : []))),
);
