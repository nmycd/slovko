// Gives every exercise that has no `id` one, written into its unit file. Existing
// ids are never changed: translations, `ref`s, pictures and spelling cards point
// at exercises by id (see src/lib/course/AUTHORING.md, "Exercise ids").
//
//   npm run course:ids
//
// An id is made from the exercise: an intro card's Slovak ("dobry-den"), otherwise
// its type and a few words of its Slovak, or a grammar card's title
// ("choice-dovidenia", "grammar-adjective-three-endings"); "-2" if that's taken.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fillSentence, stripMarkup } from "../src/lib/course/helpers";
import type { Exercise, Unit } from "../src/lib/course/types";

const UNITS = join(__dirname, "../src/lib/course/units");
const TYPES = "intro|choice|build|listen|spell|match|speak|fill|grammar";
// The start of an exercise in a unit file: the only objects there with a `type`.
const START = new RegExp(`\\{(\\s*)(?:id: "([^"]*)",\\s*)?type: "(${TYPES})"`, "g");
const SMALL = new Set(["a", "an", "and", "the", "of", "to", "in", "on", "with", "for", "is", "are"]);

/** Up to `max` words of `text`, lowercase ASCII, joined with "-". */
function slug(text: string, max: number, skipSmall = false): string {
  let words = stripMarkup(text)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (skipSmall && words.some((w) => !SMALL.has(w))) words = words.filter((w) => !SMALL.has(w));
  return words.slice(0, max).join("-");
}

function idFor(ex: Exercise): string {
  const named = (words: string) => (words ? `${ex.type}-${words}` : ex.type);
  switch (ex.type) {
    case "intro":
      return slug(ex.sk, 3) || ex.type;
    case "grammar":
      return named(slug(ex.title, 3, true));
    case "choice":
      return named(ex.sk ? slug(ex.sk, 3) : slug(ex.options[ex.answer], 3, ex.optionsLang === "en"));
    case "fill":
      return named(slug(fillSentence(ex.before, ex.options[ex.answer], ex.after), 3));
    case "build":
      return named(slug(ex.promptLang === "en" ? ex.answers[0] : ex.prompt, 3));
    case "match":
      return named(slug(ex.pairs[0].sk, 2));
    case "listen":
    case "speak":
    case "spell":
      return named(slug(ex.sk, 3));
  }
}

async function main() {
  let added = 0;
  for (let n = 1; n <= 10; n++) {
    const file = join(UNITS, `unit${n}.ts`);
    const source = readFileSync(file, "utf8");
    const unit = ((await import(file)) as Record<string, Unit>)[`unit${n}`];
    const exercises = unit.lessons.flatMap((lesson) => lesson.exercises.map((ex) => ({ lesson, ex })));
    const starts = [...source.matchAll(START)];
    // The file's exercise starts must line up with the unit's exercises, or an id would land on the wrong one.
    const lined =
      starts.length === exercises.length &&
      starts.every((m, i) => m[3] === exercises[i].ex.type && (m[2] ?? undefined) === (exercises[i].ex.id || undefined));
    if (!lined) throw new Error(`unit${n}.ts: can't line up exercises with the source; add ids by hand`);

    const ids = new Map<Exercise, string>();
    for (const lesson of unit.lessons) {
      const taken = new Set(lesson.exercises.map((ex) => ex.id).filter(Boolean));
      for (const ex of lesson.exercises.filter((e) => !e.id)) {
        const base = idFor(ex);
        let id = base;
        for (let k = 2; taken.has(id); k++) id = `${base}-${k}`;
        taken.add(id);
        ids.set(ex, id);
      }
    }
    if (!ids.size) continue;

    let out = "";
    let at = 0;
    starts.forEach((m, i) => {
      const id = ids.get(exercises[i].ex);
      if (!id) return;
      const space = m[1];
      out += `${source.slice(at, m.index)}{${space}id: "${id}",${space.includes("\n") ? space : " "}type: "${m[3]}"`;
      at = m.index + m[0].length;
    });
    writeFileSync(file, out + source.slice(at));
    console.log(`unit${n}.ts: ${ids.size} id(s) added`);
    added += ids.size;
  }
  console.log(added ? `${added} id(s) added` : "every exercise has an id");
}

void main();
