// Checks course content for structural mistakes the type checker can't see.
//
//   npm run validate:course            # the whole A1 course
//   npm run validate:course -- u3      # one unit (loads only that unit's file)
//   npm run validate:course -- --no-i18n   # skip the translation checks
//   npm run validate:course -- --course a2       # the A2 course (a2-u3 or u3 for one unit)
//
// Exits with code 1 when there are errors. Warnings are style hints.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalize, toTiles } from "../src/lib/answers";
import { fillSentence, speakableTexts } from "../src/lib/course/helpers";
import { lexicon } from "../src/lib/course/lexicon";
import { capitalisedWords, properNames } from "../src/lib/course/names";
import { addSpelling, needsSpelling, sentenceWords, spellingPlan } from "../src/lib/course/spelling";
import {
  isTranslated,
  localizeUnit,
  translatableFields,
  type Catalog,
  type Field,
} from "../src/lib/course/translatable";
import type { Exercise, Lesson, Unit } from "../src/lib/course/types";
import { isReviewable, reviewItemId } from "../src/lib/review/items";
import { courses } from "../src/lib/course/courses";
import { courseArg, earlierCourses, loadUnitFile, unitNumber, type CourseFiles } from "./course-files";

const { files, rest: args } = courseArg();
const { course } = files;
const onlyUnit = args.find((a) => !a.startsWith("--"));
const checkI18n = !args.includes("--no-i18n");
const TRANSLATED_LOCALES = ["uk", "ru", "uz", "ka"] as const;
const errors: string[] = [];
const warnings: string[] = [];

// Slovak letters plus punctuation. Catches Czech (ě, ř, ů) and other stray characters.
const SLOVAK =
  /^[A-Za-zÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽáäčďéíĺľňóôŕšťúýž0-9\s.,!?…:;"“”„'’()\-–—/*]*$/;

function check(where: string, ok: unknown, message: string) {
  if (!ok) errors.push(`${where}: ${message}`);
}
function hint(where: string, ok: unknown, message: string) {
  if (!ok) warnings.push(`${where}: ${message}`);
}
const unique = (items: string[]) =>
  new Set(items.map(normalize)).size === items.length;
const balanced = (text: string) => (text.match(/\*\*/g) ?? []).length % 2 === 0;
/** Where an exercise is, for messages: "u1-l1#dobry-den (intro)". */
const at = (lesson: Lesson, ex: Exercise, i: number) => `${lesson.id}#${ex.id || i + 1} (${ex.type})`;
/** The exercise a "lessonId#exerciseId" pointer names, with its place in the lesson. */
function pointee(lessons: Map<string, Lesson>, pointer: string): { ex?: Exercise; index: number } {
  const [lessonId, id] = pointer.split("#");
  const exercises = lessons.get(lessonId)?.exercises ?? [];
  const index = exercises.findIndex((ex) => ex.id === id);
  return { ex: exercises[index], index };
}

function slovak(where: string, text: string, allowMarkup = false) {
  check(where, text.trim().length > 0, "empty Slovak text");
  check(where, SLOVAK.test(text), `unexpected characters in "${text}"`);
  if (allowMarkup) check(where, balanced(text), `unbalanced ** in "${text}"`);
  else
    check(
      where,
      !text.includes("**"),
      `** markup is only allowed in grammar cards and notes: "${text}"`,
    );
}

/** Capitalised words past the start of a sentence that names.ts doesn't list. */
function unlistedCapitals(text: string): string[] {
  const out: string[] = [];
  let start = true;
  for (const token of text.split(/\s+/)) {
    const word = normalize(token);
    if (!word) continue;
    if (!start && /^[^\p{L}]*\p{Lu}/u.test(token) && !properNames.has(word) && !capitalisedWords.has(word)) {
      out.push(token);
    }
    start = /[.!?…]\P{L}*$/u.test(token);
  }
  return out;
}

function checkExercise(where: string, ex: Exercise) {
  switch (ex.type) {
    case "intro":
      slovak(where, ex.sk);
      check(where, ex.en.trim(), "intro needs `en`");
      if (ex.note) check(where, balanced(ex.note), "unbalanced ** in note");
      break;
    case "choice": {
      check(where, ex.question.trim(), "choice needs a question");
      check(
        where,
        ex.options.length >= 2 && ex.options.length <= 4,
        "choice needs 2–4 options",
      );
      check(where, unique(ex.options), "choice options must be unique");
      check(
        where,
        ex.answer >= 0 && ex.answer < ex.options.length,
        "choice answer index out of range",
      );
      if (ex.sk) slovak(where, ex.sk);
      if (ex.optionsLang === "sk") ex.options.forEach((o) => slovak(where, o));
      break;
    }
    case "fill": {
      check(
        where,
        ex.options.length >= 2 && ex.options.length <= 4,
        "fill needs 2–4 options",
      );
      check(where, unique(ex.options), "fill options must be unique");
      check(
        where,
        ex.answer >= 0 && ex.answer < ex.options.length,
        "fill answer index out of range",
      );
      check(
        where,
        (ex.before + ex.after).trim(),
        "fill needs text around the gap",
      );
      check(where, ex.en.trim(), "fill needs `en`");
      slovak(
        where,
        fillSentence(ex.before, ex.options[ex.answer] ?? "", ex.after),
      );
      break;
    }
    case "build": {
      check(where, ex.answers.length > 0, "build needs at least one answer");
      const tiles = toTiles(ex.answers[0] ?? "");
      hint(where, tiles.length >= 2, "build answer has a single tile");
      hint(
        where,
        tiles.length + ex.distractors.length <= 12,
        "more than 12 tiles is hard to read",
      );
      check(
        where,
        ex.distractors.length >= 1,
        "build needs at least one distractor",
      );
      const tileSet = new Set(tiles.map(normalize));
      for (const d of ex.distractors) {
        check(
          where,
          !tileSet.has(normalize(d)),
          `distractor "${d}" is also in the answer (ambiguous)`,
        );
        check(
          where,
          toTiles(d).length === 1,
          `distractor "${d}" must be one word`,
        );
      }
      check(where, unique(ex.answers), "build answers must be unique");
      // Traps: a distractor, the answer tile it competes with, and why.
      const distractors = new Set(ex.distractors.map(normalize));
      for (const trap of ex.traps ?? []) {
        check(where, ex.promptLang === "en", "traps are for answers in Slovak");
        check(where, distractors.has(normalize(trap.wrong)), `trap "${trap.wrong}" is not a distractor`);
        check(where, tileSet.has(normalize(trap.right)), `trap's right tile "${trap.right}" is not in the answer`);
        check(where, trap.why.trim(), `trap "${trap.wrong}" has no why`);
      }
      check(where, unique((ex.traps ?? []).map((trap) => normalize(trap.wrong))), "a distractor has two traps");
      if (ex.promptLang === "sk") slovak(where, ex.prompt);
      else ex.answers.forEach((a) => slovak(where, a));
      break;
    }
    case "listen":
      slovak(where, ex.sk);
      hint(where, ex.sk.length <= 80, "listen sentence over 80 characters");
      // Names are graded leniently, so the grader has to know every one.
      for (const word of unlistedCapitals(ex.sk)) {
        check(where, false, `"${word}" is capitalised: add it to properNames or capitalisedWords in src/lib/course/names.ts`);
      }
      break;
    case "spell":
      slovak(where, ex.sk);
      check(where, sentenceWords(ex.sk).length === 1, "a spelling card is one word");
      break;
    case "speak":
      slovak(where, ex.sk);
      hint(where, ex.sk.length <= 60, "speak sentence over 60 characters");
      break;
    case "match":
      check(
        where,
        ex.pairs.length >= 3 && ex.pairs.length <= 5,
        "match needs 3–5 pairs",
      );
      check(
        where,
        unique(ex.pairs.map((p) => p.sk)),
        "match Slovak sides must be unique",
      );
      check(
        where,
        unique(ex.pairs.map((p) => p.en)),
        "match English sides must be unique",
      );
      ex.pairs.forEach((p) => slovak(where, p.sk));
      break;
    case "grammar": {
      check(where, ex.title.trim(), "grammar card needs a title");
      check(where, ex.body.length >= 1, "grammar card needs a body");
      hint(
        where,
        ex.body.length <= 3,
        "grammar card has more than 3 paragraphs",
      );
      ex.body.forEach((p) =>
        check(where, balanced(p), "unbalanced ** in body"),
      );
      if (ex.table) {
        const width = ex.table.head?.length ?? ex.table.rows[0]?.length ?? 0;
        check(where, ex.table.rows.length > 0, "grammar table has no rows");
        hint(where, ex.table.rows.length <= 8, "grammar table over 8 rows");
        ex.table.rows.forEach((row, r) =>
          check(
            where,
            row.length === width,
            `table row ${r + 1} has ${row.length} cells, expected ${width}`,
          ),
        );
        [...(ex.table.head ?? []), ...ex.table.rows.flat()].forEach((c) =>
          check(where, balanced(c), `unbalanced ** in table cell "${c}"`),
        );
      }
      hint(where, (ex.examples?.length ?? 0) <= 4, "more than 4 examples");
      ex.examples?.forEach((e) => {
        slovak(where, e.sk, true);
        check(where, e.en.trim(), "example needs `en`");
      });
      break;
    }
  }
  for (const text of speakableTexts(ex)) {
    hint(
      where,
      text.length <= 150,
      `audio text over 150 characters: "${text.slice(0, 40)}…"`,
    );
  }
}

function checkLesson(unit: Unit, lesson: Lesson, index: number) {
  const where = lesson.id;
  // A lesson id is a name, like an exercise id: progress, translations, refs, pictures
  // and spelling cards point at it, so it never changes when lessons are inserted. The
  // first lessons were numbered (u4-l1 … u4-l7) and keep their numbers, in order; a
  // lesson added later takes the unit and a name (u4-rodina).
  check(
    where,
    new RegExp(`^${unit.id}-[a-z0-9]+(-[a-z0-9]+)*$`).test(lesson.id),
    `id should be ${unit.id}- and a name in lowercase letters, digits and hyphens`,
  );
  const numbered = (l: Lesson) => Number(l.id.match(new RegExp(`^${unit.id}-l(\\d+)$`))?.[1] ?? NaN);
  const before = unit.lessons.slice(0, index).map(numbered).filter((n) => !Number.isNaN(n));
  check(
    where,
    Number.isNaN(numbered(lesson)) || numbered(lesson) === before.length + 1,
    `numbered ids run in order: this should be ${unit.id}-l${before.length + 1}, or a new lesson with a name`,
  );
  check(
    where,
    lesson.title.trim() && lesson.titleEn.trim(),
    "lesson needs title and titleEn",
  );
  slovak(where, lesson.title);
  const n = lesson.exercises.length;
  check(where, n >= 8 && n <= 22, `has ${n} exercises (8–22 allowed)`);
  hint(where, n >= 10 && n <= 18, `has ${n} exercises (10–18 recommended)`);

  const teaching = lesson.exercises.filter(
    (e) => e.type === "intro" || e.type === "grammar",
  ).length;
  hint(
    where,
    teaching <= n * 0.45,
    `${teaching}/${n} exercises are teaching cards; add more practice`,
  );
  const last = lesson.exercises[n - 1];
  check(
    where,
    last && last.type !== "intro" && last.type !== "grammar",
    "must not end on a teaching card",
  );

  // Writing practice: memorize rounds and dictations only, and rounds nowhere else.
  check(
    where,
    lesson.kind === "writing"
      ? lesson.exercises.every((e) => e.type === "memorize" || e.type === "listen") &&
          lesson.exercises.some((e) => e.type === "memorize")
      : lesson.exercises.every((e) => e.type !== "memorize"),
    lesson.kind === "writing"
      ? "a writing lesson holds memorize rounds and dictations only"
      : "memorize rounds belong in writing lessons",
  );

  if (lesson.kind === "grammar") {
    const firstGrammar = lesson.exercises.findIndex(
      (e) => e.type === "grammar",
    );
    check(
      where,
      firstGrammar >= 0 && firstGrammar <= 2,
      "grammar lessons start with a grammar card",
    );
  }
  const practiceTypes = new Set(lesson.exercises.map((e) => e.type));
  hint(
    where,
    practiceTypes.size >= 4,
    `only ${practiceTypes.size} exercise types; mix more`,
  );

  // Ids: what translations, refs, pictures and spelling cards point at.
  const ids = new Set<string>();
  lesson.exercises.forEach((ex, i) => {
    const place = at(lesson, ex, i);
    if (!ex.id) return check(place, false, "no id: run npm run course:ids");
    check(place, /^[a-z0-9]+(-[a-z0-9]+)*$/.test(ex.id), `id "${ex.id}" must be lowercase letters, digits and hyphens`);
    check(place, !ex.id.startsWith("spell-"), `id "${ex.id}": spell- is for spelling cards`);
    check(place, !ids.has(ex.id), `id "${ex.id}" is used twice in the lesson`);
    ids.add(ex.id);
  });

  lesson.exercises.forEach((ex, i) => checkExercise(at(lesson, ex, i), ex));
}

// ---- Translations (uk, ru) ----------------------------------------------

const SLOVAK_LETTERS = /[áäčďéíĺľňóôŕšťúýž]/i;
const flatten = (f: Field): string[] =>
  typeof f === "string" ? [f] : (f as (string | string[])[]).flat();
// Lists whose items correspond one-to-one with the English source.
const PARALLEL_LISTS = [
  "options",
  "traps",
  "pairs",
  "body",
  "table.head",
  "examples",
  "topics",
  "grammar",
];

function checkShape(where: string, key: string, source: Field, t: Field) {
  if (typeof source === "string") {
    check(where, typeof t === "string", "translation must be a string");
    return;
  }
  if (!Array.isArray(t))
    return check(where, false, "translation must be a list");
  if (key.endsWith("table.rows")) {
    const rows = source as string[][];
    check(
      where,
      t.length === rows.length,
      `table has ${t.length} rows, source has ${rows.length}`,
    );
    rows.forEach((row, r) => {
      const tr = (t as string[][])[r] ?? [];
      check(
        where,
        tr.length === row.length,
        `table row ${r + 1} has ${tr.length} cells, source has ${row.length}`,
      );
      row.forEach((cell, c) => {
        // Slovak cells (diacritics or highlighted endings) stay as they are.
        if (
          (SLOVAK_LETTERS.test(cell) || cell.includes("**")) &&
          tr[c] !== undefined
        )
          hint(
            where,
            tr[c] === cell,
            `Slovak cell "${cell}" was changed to "${tr[c]}"`,
          );
      });
    });
    return;
  }
  const field = key.split(".").slice(2).join(".") || key.split(".").pop()!;
  if (PARALLEL_LISTS.some((name) => field === name || key.endsWith(`.${name}`)))
    check(
      where,
      t.length === source.length,
      `has ${t.length} items, source has ${source.length}`,
    );
}

function checkScript(where: string, locale: string, source: Field, t: Field) {
  for (const text of flatten(t)) {
    check(
      where,
      (text.match(/\*\*/g) ?? []).length % 2 === 0,
      `unbalanced ** in "${text}"`,
    );
    if (locale === "uk")
      check(
        where,
        !/[ыэъё]/i.test(text),
        `Russian letters in Ukrainian: "${text}"`,
      );
    if (locale === "ru")
      check(
        where,
        !/[іїєґ]/i.test(text),
        `Ukrainian letters in Russian: "${text}"`,
      );
    // Uzbek is Latin script; Georgian is Georgian, with Latin only for the Slovak.
    // Anything else (Cyrillic, a stray Arabic letter…) is a slip.
    if (locale === "uz")
      check(
        where,
        !/[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(text),
        `letters from another script in Uzbek (Latin): "${text}"`,
      );
    if (locale === "ka")
      check(
        where,
        !/[^\p{Script=Georgian}\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(text) &&
          !/[\u1C90-\u1CBF]/u.test(text),
        `letters from another script (or capitals) in Georgian: "${text}"`,
      );
  }
  const src = flatten(source);
  flatten(t).forEach((text, i) => {
    const s = src[i];
    if (
      s &&
      text === s &&
      !SLOVAK_LETTERS.test(s) &&
      !s.includes("**") && // highlighted Slovak, kept on purpose
      /[a-z]{3,}\s+[a-z]{3,}/i.test(s)
    )
      hint(where, false, `looks untranslated: "${text}"`);
  });
}

function checkLocalizedExercise(where: string, ex: Exercise) {
  if (ex.type === "build" && ex.promptLang === "sk") {
    const tiles = new Set(toTiles(ex.answers[0] ?? "").map(normalize));
    check(
      where,
      ex.answers.length > 0 && ex.distractors.length > 0,
      "needs answers and distractors",
    );
    for (const d of ex.distractors) {
      check(
        where,
        !tiles.has(normalize(d)),
        `distractor "${d}" is also in the answer (ambiguous)`,
      );
      check(
        where,
        toTiles(d).length === 1,
        `distractor "${d}" must be one word`,
      );
    }
    check(where, unique(ex.answers), "answers must be unique");
  }
  if (ex.type === "choice" && ex.optionsLang === "en")
    check(where, unique(ex.options), "options must be unique");
  if (ex.type === "match")
    check(
      where,
      unique(ex.pairs.map((p) => p.en)),
      "translated sides must be unique",
    );
}

function checkTranslations(unit: Unit) {
  for (const locale of TRANSLATED_LOCALES) {
    const file = join(files.translations, locale, `unit${unit.number}.json`);
    const label = `${locale}/${unit.id}`;
    if (!existsSync(file)) {
      errors.push(`${label}: catalog missing (run npm run i18n:sync)`);
      continue;
    }
    let catalog: Catalog;
    try {
      catalog = JSON.parse(readFileSync(file, "utf8"));
    } catch (err) {
      errors.push(`${label}: invalid JSON: ${(err as Error).message}`);
      continue;
    }
    const fields = translatableFields(unit);
    let missing = 0;
    for (const [key, source] of Object.entries(fields)) {
      const entry = catalog[key];
      if (!entry || !isTranslated(entry.t, source)) {
        missing++;
        continue;
      }
      const where = `${locale} ${key}`;
      check(
        where,
        JSON.stringify(entry.en) === JSON.stringify(source),
        'stale: the English changed; update "en" and "t"',
      );
      checkShape(where, key, source, entry.t);
      checkScript(where, locale, source, entry.t);
    }
    check(label, missing === 0, `${missing} untranslated key(s)`);
    for (const key of Object.keys(catalog))
      hint(
        `${locale} ${key}`,
        key in fields,
        "not in the course any more (npm run i18n:sync removes it)",
      );
    for (const lesson of localizeUnit(unit, catalog).lessons)
      lesson.exercises.forEach((ex, i) =>
        checkLocalizedExercise(`${locale} ${at(lesson, ex, i)}`, ex),
      );
  }
}

/** The course's units, and every course's (only when checking the whole course). */
async function loadUnits(): Promise<{ units: Unit[]; all?: (id: CourseFiles["course"]["id"]) => Unit[] }> {
  if (!onlyUnit) {
    const { courseUnits } = await import("../src/lib/course");
    return { units: courseUnits[course.id], all: (id) => courseUnits[id] };
  }
  // One unit only: import just its file, so other half-written units can't break the run.
  const n = unitNumber(files, onlyUnit);
  if (Number.isNaN(n)) {
    console.error(`No unit "${onlyUnit}": name one like ${files.unitId(3)}.`);
    process.exit(2);
  }
  return { units: [await loadUnitFile(files, n)] };
}

/** A JSON map of the course's (spelling plan, pictures), or an empty one if it has none yet. */
function readMap<T>(file: string): Record<string, T> {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
}

function summarize(unit: Unit) {
  const exercises = unit.lessons.flatMap((l) => l.exercises);
  const byType = Object.entries(
    exercises.reduce<Record<string, number>>(
      (acc, e) => ({ ...acc, [e.type]: (acc[e.type] ?? 0) + 1 }),
      {},
    ),
  )
    .map(([t, c]) => `${t} ${c}`)
    .join(", ");
  const kinds = unit.lessons.map((l) => (l.kind ?? "vocab")[0]).join("");
  console.log(
    `${unit.id.padEnd(4)} ${String(unit.lessons.length).padStart(2)} lessons [${kinds}]  ${String(exercises.length).padStart(3)} exercises  (${byType})`,
  );
}

/**
 * The course's spelling plan (spelling.json) is current: every word a typed sentence
 * needs was spelled on its own before (here or in an earlier course), and every card
 * sits in its lesson. A card's gloss may be an earlier course's intro card.
 */
function checkSpelling(units: Unit[], earlier: Unit[]) {
  const rerun = `run npm run plan:spelling${course.id === "a1" ? "" : ` -- --course ${course.id}`}`;
  const plan = readMap<unknown>(files.spelling);
  const lessons = units.flatMap((u) => u.lessons);
  const byId = new Map([...earlier, ...units].flatMap((u) => u.lessons).map((l) => [l.id, l]));
  for (const id of Object.keys(plan)) {
    check("spelling.json", lessons.some((l) => l.id === id), `unknown lesson ${id}: ${rerun}`);
  }
  const spelled = new Set<string>(
    earlier.flatMap((u) => u.lessons).flatMap((l) => spellingPlan[l.id] ?? []).map((c) => c.sk.toLowerCase()),
  );
  const needed = new Set<string>();
  for (const lesson of lessons) {
    for (const card of spellingPlan[lesson.id] ?? []) {
      check(
        `${lesson.id} spelling`,
        card.after === undefined || lesson.exercises.some((ex) => ex.id === card.after),
        `"${card.sk}" is placed after ${card.after}, which isn't in the lesson: ${rerun}`,
      );
      if (card.gloss)
        check(
          `${lesson.id} spelling`,
          pointee(byId, card.gloss).ex?.type === "intro",
          `"${card.sk}": gloss ${card.gloss} is not an intro card: ${rerun}`,
        );
    }
    const played = addSpelling(lesson, () => undefined).exercises;
    check(`${lesson.id} spelling`, new Set(played.map((ex) => ex.id)).size === played.length, "two spelling cards share an id");
    played.forEach((ex) => {
      if (ex.type === "spell") spelled.add(ex.sk.toLowerCase());
      // A writing lesson's sentences lean on its memorize rounds instead.
      if (ex.type !== "listen" || lesson.kind === "writing") return;
      for (const word of sentenceWords(ex.sk).filter(needsSpelling)) {
        needed.add(word);
        check(lesson.id, spelled.has(word), `"${word}" is typed before it was spelled on its own: ${rerun}`);
      }
    });
  }
  const unused = lessons
    .flatMap((l) => spellingPlan[l.id] ?? [])
    .filter((c) => !needed.has(c.sk.toLowerCase()));
  hint("spelling.json", !unused.length, `cards no typed sentence needs: ${unused.map((c) => c.sk).join(", ")} (${rerun})`);
}

// ---- Word tags (lexicon.ts) ----------------------------------------------

/**
 * Every review word (an intro card of up to three words) needs tags: word review picks
 * wrong options by them. The tags should agree with how the card is written: a
 * sentence or question ends in punctuation, a bare word doesn't, a verb is glossed "to …".
 */
function checkLexicon(units: Unit[], everyCourse?: Unit[]) {
  const items = new Set<string>();
  for (const lesson of units.flatMap((u) => u.lessons)) {
    lesson.exercises.forEach((ex) => {
      if (ex.type !== "intro" || !isReviewable(ex.sk)) return;
      const id = reviewItemId(ex.sk);
      if (items.has(id)) return;
      items.add(id);
      const where = `${lesson.id}#${ex.id}`;
      const tags = lexicon[id];
      check(where, tags, `"${ex.sk}" has no tags in src/lib/course/lexicon.ts (word review needs them)`);
      if (!tags) return;
      const punctuated = /[.!?]$/.test(ex.sk.trim());
      hint(where, punctuated === (tags.pos === "expression"), `"${ex.sk}": tagged ${tags.pos}, but ${punctuated ? "ends like a sentence" : "has no end punctuation"}`);
      hint(where, (tags.pos === "verb") === /^to /i.test(ex.en), `"${ex.sk}": a verb is glossed "to …" and only a verb is`);
    });
  }
  // The tags are every course's: one entry per word, wherever it's taught.
  if (everyCourse) {
    const taught = new Set(
      everyCourse
        .flatMap((u) => u.lessons)
        .flatMap((l) => l.exercises)
        .flatMap((ex) => (ex.type === "intro" && isReviewable(ex.sk) ? [reviewItemId(ex.sk)] : [])),
    );
    for (const id of Object.keys(lexicon)) hint("lexicon.ts", taught.has(id), `tags for "${id}", which no intro card teaches`);
  }
}

// ---- Explanations' grammar cards (ref) ------------------------------------

/** A `ref` points to a grammar card taught at or before its exercise; an earlier course's are all before. */
function checkRefs(units: Unit[], earlier: Unit[]) {
  const order = [...earlier, ...units].flatMap((u) => u.lessons.map((l) => l.id));
  const lessons = new Map([...earlier, ...units].flatMap((u) => u.lessons).map((l) => [l.id, l]));
  for (const lesson of units.flatMap((u) => u.lessons)) {
    lesson.exercises.forEach((ex, i) => {
      if ((ex.type !== "choice" && ex.type !== "fill") || !ex.ref) return;
      const where = `${lesson.id}#${ex.id}`;
      check(where, ex.why, "has a ref but no why to show it with");
      const [lessonId] = ex.ref.split("#");
      const card = pointee(lessons, ex.ref);
      check(where, card.ex?.type === "grammar", `ref ${ex.ref} is not a grammar card`);
      const earlier =
        order.indexOf(lessonId) < order.indexOf(lesson.id) || (lessonId === lesson.id && card.index < i);
      check(where, earlier, `ref ${ex.ref} comes after the exercise`);
    });
  }
}

// ---- Pictures (illustrations.json) ----------------------------------------

/** Every picture belongs to an exercise ("lessonId#exerciseId"), so none is lost when exercises change. */
function checkPictures(units: Unit[]) {
  const lessons = new Map(units.flatMap((u) => u.lessons).map((l) => [l.id, l]));
  for (const key of Object.keys(readMap(files.illustrations))) {
    if (!units.some((u) => key.startsWith(`${u.id}-`))) continue; // a unit not being checked
    check(
      `illustrations.json ${key}`,
      pointee(lessons, key).ex,
      "no such exercise: rename the key (and its plan entry) to the exercise's id, or drop it",
    );
  }
}

async function main() {
  const seenIds = new Set<string>();
  const { units, all } = await loadUnits();
  // Earlier courses come before all of this one (refs and spelling may lean on them).
  const earlier = all ? earlierCourses(course.id).flatMap((c) => all(c.id)) : [];
  if (course.id !== "a1") console.log(`${course.level}: ${units.length} unit(s)`);
  for (const unit of units) {
    check(unit.id, unit.id === files.unitId(unit.number), `unit id must be ${files.unitId(unit.number)}`);
    check(
      unit.id,
      unit.premium === unit.number > course.freeUnits,
      course.freeUnits
        ? `units 1–${course.freeUnits} are free, the rest premium`
        : `every ${course.level} unit is premium`,
    );
    slovak(unit.id, unit.title);
    unit.lessons.forEach((lesson, i) => {
      check(lesson.id, !seenIds.has(lesson.id), "duplicate lesson id");
      seenIds.add(lesson.id);
      checkLesson(unit, lesson, i);
    });
    if (checkI18n) checkTranslations(unit);
    summarize(unit);
  }

  if (!onlyUnit) checkSpelling(units, earlier);
  checkLexicon(units, all && courses.flatMap((c) => all(c.id)));
  if (!onlyUnit) checkRefs(units, earlier);
  checkPictures(units);

  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  }
  if (errors.length) {
    console.log(`\n${errors.length} error(s):`);
    errors.forEach((e) => console.log(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log("\n✓ no errors");
}

void main();
