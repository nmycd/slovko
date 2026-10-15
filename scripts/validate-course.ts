// Checks course content for structural mistakes the type checker can't see.
//
//   npm run validate:course            # whole course
//   npm run validate:course -- u3      # one unit (loads only that unit's file)
//   npm run validate:course -- --no-i18n   # skip the uk/ru translation checks
//
// Exits with code 1 when there are errors. Warnings are style hints.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalize, toTiles } from "../src/lib/answers";
import { fillSentence, speakableTexts } from "../src/lib/course/helpers";
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

const args = process.argv.slice(2);
const onlyUnit = args.find((a) => !a.startsWith("--"));
const checkI18n = !args.includes("--no-i18n");
const TRANSLATED_LOCALES = ["uk", "ru"] as const;
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
  check(
    where,
    lesson.id === `${unit.id}-l${index + 1}`,
    `id should be ${unit.id}-l${index + 1}`,
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

  lesson.exercises.forEach((ex, i) =>
    checkExercise(`${where} #${i + 1} (${ex.type})`, ex),
  );
}

// ---- Translations (uk, ru) ----------------------------------------------

const SLOVAK_LETTERS = /[áäčďéíĺľňóôŕšťúýž]/i;
const flatten = (f: Field): string[] =>
  typeof f === "string" ? [f] : (f as (string | string[])[]).flat();
// Lists whose items correspond one-to-one with the English source.
const PARALLEL_LISTS = [
  "options",
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
    const file = join(
      __dirname,
      "../src/lib/course/translations",
      locale,
      `unit${unit.number}.json`,
    );
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
        checkLocalizedExercise(
          `${locale} ${lesson.id} #${i + 1} (${ex.type})`,
          ex,
        ),
      );
  }
}

async function loadUnits(): Promise<Unit[]> {
  if (!onlyUnit) return (await import("../src/lib/course")).course;
  // One unit only: import just its file, so other half-written units can't break the run.
  const n = onlyUnit.replace(/^u/, "");
  const mod = (await import(`../src/lib/course/units/unit${n}`)) as Record<
    string,
    Unit
  >;
  return [mod[`unit${n}`]];
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
 * The spelling plan (src/lib/course/spelling.json) is current: every word a typed
 * sentence needs was spelled on its own before, and every card sits in its lesson.
 */
function checkSpelling(units: Unit[]) {
  const rerun = "run npm run plan:spelling";
  const lessons = units.flatMap((u) => u.lessons);
  for (const id of Object.keys(spellingPlan)) {
    check("spelling.json", lessons.some((l) => l.id === id), `unknown lesson ${id}: ${rerun}`);
  }
  const spelled = new Set<string>();
  const needed = new Set<string>();
  for (const lesson of lessons) {
    for (const card of spellingPlan[lesson.id] ?? []) {
      check(
        `${lesson.id} spelling`,
        card.after >= -1 && card.after < lesson.exercises.length,
        `"${card.sk}" is placed after exercise ${card.after}, past the lesson's end: ${rerun}`,
      );
    }
    addSpelling(lesson, () => undefined).exercises.forEach((ex) => {
      if (ex.type === "spell") spelled.add(ex.sk.toLowerCase());
      if (ex.type !== "listen") return;
      for (const word of sentenceWords(ex.sk).filter(needsSpelling)) {
        needed.add(word);
        check(lesson.id, spelled.has(word), `"${word}" is typed before it was spelled on its own: ${rerun}`);
      }
    });
  }
  const unused = Object.values(spellingPlan)
    .flat()
    .filter((c) => !needed.has(c.sk.toLowerCase()));
  hint("spelling.json", !unused.length, `cards no typed sentence needs: ${unused.map((c) => c.sk).join(", ")} (${rerun})`);
}

async function main() {
  const seenIds = new Set<string>();
  const units = await loadUnits();
  for (const unit of units) {
    check(unit.id, unit.id === `u${unit.number}`, "unit id must be u<number>");
    check(
      unit.id,
      unit.premium === unit.number > 2,
      "units 1–2 are free, 3–10 premium",
    );
    slovak(unit.id, unit.title);
    hint(
      unit.id,
      unit.lessons.length >= 4,
      `has ${unit.lessons.length} lessons (4+ expected)`,
    );
    unit.lessons.forEach((lesson, i) => {
      check(lesson.id, !seenIds.has(lesson.id), "duplicate lesson id");
      seenIds.add(lesson.id);
      checkLesson(unit, lesson, i);
    });
    if (checkI18n) checkTranslations(unit);
    summarize(unit);
  }

  if (!onlyUnit) checkSpelling(units);

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
