// Keeps the course translation catalogs in step with the English source.
//
//   npm run i18n:sync            # add new keys (empty), drop removed ones, report status
//   npm run i18n:sync -- --check # report only; exit 1 if anything is missing or stale
//   npm run i18n:sync -- --course a2   # the A2 course's catalogs (A1's without it)
//
// Catalogs: src/lib/course/translations/<locale>/unitN.json (A2's in
// src/lib/course/a2/translations/), where each entry is
// { "en": <English source>, "t": <translation> }. Translators fill in "t". When
// the English changes, the entry is reported as stale until "en" and "t" are
// updated together.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { courseUnits } from "../src/lib/course";
import {
  emptyLike,
  isTranslated,
  translatableFields,
  type Catalog,
} from "../src/lib/course/translatable";
import { courseArg } from "./course-files";

const { files, rest: args } = courseArg();
const LOCALES = ["uk", "ru", "uz", "ka"] as const;
const DIR = files.translations;
const checkOnly = args.includes("--check");
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

let problems = 0;
for (const locale of LOCALES) {
  mkdirSync(join(DIR, locale), { recursive: true });
  for (const unit of courseUnits[files.course.id]) {
    const file = join(DIR, locale, `unit${unit.number}.json`);
    const old: Catalog = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
    const fields = translatableFields(unit);
    const next: Catalog = {};
    let missing = 0;
    let stale = 0;
    for (const [key, source] of Object.entries(fields)) {
      const entry = old[key];
      next[key] = entry ?? { en: source, t: emptyLike(source) };
      if (!isTranslated(next[key].t, source)) missing++;
      else if (!same(next[key].en, source)) stale++;
    }
    const removed = Object.keys(old).filter((k) => !(k in fields)).length;
    problems += missing + stale;
    console.log(
      `${locale} ${unit.id.padEnd(files.course.prefix.length + 4)} ${String(Object.keys(fields).length).padStart(4)} keys` +
        `  missing ${String(missing).padStart(4)}  stale ${String(stale).padStart(3)}  removed ${removed}`,
    );
    if (!checkOnly) writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
  }
}
if (checkOnly && problems) process.exit(1);
