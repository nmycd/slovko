// Course translations: every base-language (English) field of the course has
// a stable key, e.g. "u1-l3.5.question". Translations live in
// translations/<locale>/unitN.json as { key: { en: source, t: translation } };
// keeping the English source next to each translation lets the validator spot
// translations that went stale after the English changed.
//
// Slovak text is never translated, so the audio cache is unaffected.

import type { Exercise, Lesson, Unit } from "./types";

export type Field = string | string[] | string[][];
export type CatalogEntry = { en: Field; t: Field };
export type Catalog = Record<string, CatalogEntry>;

/** Every translatable field of a unit, keyed, with its English source. */
export function translatableFields(unit: Unit): Record<string, Field> {
  const fields: Record<string, Field> = {
    [`${unit.id}.titleEn`]: unit.titleEn,
    [`${unit.id}.topics`]: unit.topics,
    [`${unit.id}.grammar`]: unit.grammar,
  };
  for (const lesson of unit.lessons) {
    fields[`${lesson.id}.titleEn`] = lesson.titleEn;
    lesson.exercises.forEach((ex, i) => {
      for (const [field, value] of Object.entries(exerciseFields(ex))) {
        fields[`${lesson.id}.${i}.${field}`] = value;
      }
    });
  }
  return fields;
}

function exerciseFields(ex: Exercise): Record<string, Field> {
  switch (ex.type) {
    case "intro":
      return { en: ex.en, ...(ex.note ? { note: ex.note } : {}) };
    case "listen":
    case "speak":
    case "fill":
      return { en: ex.en };
    case "spell":
      // Added after translation, with the meaning already in the learner's language.
      return {};
    case "choice":
      return { question: ex.question, ...(ex.optionsLang === "en" ? { options: ex.options } : {}) };
    case "build":
      return ex.promptLang === "en"
        ? { prompt: ex.prompt }
        : { answers: ex.answers, distractors: ex.distractors };
    case "match":
      return { pairs: ex.pairs.map((p) => p.en) };
    case "grammar":
      return {
        title: ex.title,
        body: ex.body,
        ...(ex.table?.caption ? { "table.caption": ex.table.caption } : {}),
        ...(ex.table?.head ? { "table.head": ex.table.head } : {}),
        ...(ex.table ? { "table.rows": ex.table.rows } : {}),
        ...(ex.examples?.length ? { examples: ex.examples.map((e) => e.en) } : {}),
      };
  }
}

/**
 * True when a translation is filled in. Where the English source is empty
 * (e.g. a blank table header cell), the translation may be empty too.
 */
export function isTranslated(value: Field | undefined, source?: Field): boolean {
  if (value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0 || source === "";
  return (
    value.length > 0 &&
    value.every((v, i) => isTranslated(v as Field, Array.isArray(source) ? (source[i] as Field) : undefined))
  );
}

/** An empty translation with the same shape as the source (for new catalog entries). */
export function emptyLike(source: Field): Field {
  if (typeof source === "string") return "";
  return source.map((v) => (Array.isArray(v) ? v.map(() => "") : "")) as Field;
}

/** The unit with translations applied; untranslated fields stay English. */
export function localizeUnit(unit: Unit, catalog: Catalog): Unit {
  const tr = <T extends Field>(key: string, fallback: T): T => {
    const t = catalog[key]?.t;
    return (isTranslated(t, fallback) ? t : fallback) as T;
  };
  return {
    ...unit,
    titleEn: tr(`${unit.id}.titleEn`, unit.titleEn),
    topics: tr(`${unit.id}.topics`, unit.topics),
    grammar: tr(`${unit.id}.grammar`, unit.grammar),
    lessons: unit.lessons.map(
      (lesson): Lesson => ({
        ...lesson,
        titleEn: tr(`${lesson.id}.titleEn`, lesson.titleEn),
        exercises: lesson.exercises.map((ex, i) => localizeExercise(ex, (field, fallback) =>
          tr(`${lesson.id}.${i}.${field}`, fallback),
        )),
      }),
    ),
  };
}

function localizeExercise(ex: Exercise, tr: <T extends Field>(field: string, fallback: T) => T): Exercise {
  switch (ex.type) {
    case "intro":
      return { ...ex, en: tr("en", ex.en), ...(ex.note ? { note: tr("note", ex.note) } : {}) };
    case "listen":
    case "speak":
    case "fill":
      return { ...ex, en: tr("en", ex.en) };
    case "spell":
      return ex;
    case "choice":
      return {
        ...ex,
        question: tr("question", ex.question),
        options: ex.optionsLang === "en" ? tr("options", ex.options) : ex.options,
      };
    case "build":
      return ex.promptLang === "en"
        ? { ...ex, prompt: tr("prompt", ex.prompt) }
        : { ...ex, answers: tr("answers", ex.answers), distractors: tr("distractors", ex.distractors) };
    case "match": {
      const en = tr("pairs", ex.pairs.map((p) => p.en));
      return { ...ex, pairs: ex.pairs.map((p, i) => ({ ...p, en: en[i] ?? p.en })) };
    }
    case "grammar": {
      const examples = ex.examples && tr("examples", ex.examples.map((e) => e.en));
      return {
        ...ex,
        title: tr("title", ex.title),
        body: tr("body", ex.body),
        ...(ex.table
          ? {
              table: {
                ...ex.table,
                ...(ex.table.caption ? { caption: tr("table.caption", ex.table.caption) } : {}),
                ...(ex.table.head ? { head: tr("table.head", ex.table.head) } : {}),
                rows: tr("table.rows", ex.table.rows),
              },
            }
          : {}),
        ...(ex.examples && examples
          ? { examples: ex.examples.map((e, i) => ({ ...e, en: examples[i] ?? e.en })) }
          : {}),
      };
    }
  }
}
