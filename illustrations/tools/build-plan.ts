/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON from course modules and the Gemini API */
// Builds illustrations/plan/unitN.json from illustrations/plan/map-uN.json.
// Usage: npx tsx illustrations/tools/build-plan.ts . <unit number> <printed page minus PDF page> [--course a2]
//
// map-uN.json: { "u1-l1#dobre-rano": { "picture": "…" | "reuse": "u1-l1#dobry-den", "panel": "p6-6" | null,
//                                     "panel2"?: "p7-16", "printedPage"?: 9 } }
// Keys are "lessonId#exerciseId". A reuse may name an entry of an earlier unit ("u1-l1#dobry-vecer"),
// or of an earlier course (an A2 entry may reuse an A1 picture).
// A panel name is p<PDF page>-<label>, matching book-panels-uN.txt and the crop file.
// printedPage overrides the offset where the scan skips a page inside a lesson.
// A2's plan is in illustrations/plan/a2/ and its crops in illustrations/book-refs/a2/ (the
// two books' page numbers would clash).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { courseOf } from "../../src/lib/course/courses";
import { courseArg, courseFiles, loadUnitFile, type CourseFiles } from "../../scripts/course-files";

type Mapping = Record<
  string,
  { picture?: string; reuse?: string; panel: string | null; panel2?: string; printedPage?: number }
>;

function textOf(ex: any): string {
  switch (ex.type) {
    case "intro": return `${ex.sk} = ${ex.en}`;
    case "grammar": return ex.title;
    case "choice": return [ex.sk, ex.question].filter(Boolean).join(" ");
    default: return ex.sk ?? ex.prompt ?? "";
  }
}

function bookRef(files: CourseFiles, panel: string, offset: number, printedPage?: number) {
  const match = panel.match(/^p(\d+)-(.+)$/);
  if (!match) throw new Error(`Bad panel name ${panel}`);
  const file = join(files.bookRefs, "panels", `${panel}.jpg`);
  const crop = relative(join(__dirname, ".."), file); // from illustrations/
  if (!existsSync(file)) throw new Error(`Missing crop ${crop}`);
  const pdfPage = Number(match[1]);
  return { pdfPage, printedPage: printedPage ?? pdfPage + offset, panel: match[2], crop };
}

async function main() {
  const { files, rest } = courseArg();
  const [, n, offsetArg] = rest;
  const offset = Number(offsetArg);
  if (!n || Number.isNaN(offset)) throw new Error("Usage: build-plan.ts <repo root> <unit number> <offset> [--course a2]");
  const unit: any = await loadUnitFile(files, Number(n));
  const readMap = (of: CourseFiles, unitN: string): Mapping =>
    JSON.parse(readFileSync(join(of.plan, `map-u${unitN}.json`), "utf8"));
  const mapping = readMap(files, n);
  // A reuse may point into an earlier unit ("u1-l1#dobry-vecer"), or an earlier course's;
  // look it up in that unit's map.
  const mapOf = (key: string) => {
    const of = courseFiles(courseOf(key).id);
    const unitN = key.slice(of.course.prefix.length).match(/^u(\d+)-/)?.[1];
    return !unitN || (of.course === files.course && unitN === n) ? mapping : readMap(of, unitN);
  };
  const items = [];
  for (const [key, m] of Object.entries(mapping)) {
    const [lessonId, id] = key.split("#");
    const lesson = unit.lessons.find((l: any) => l.id === lessonId);
    const ex = lesson?.exercises.find((e: any) => e.id === id);
    if (!ex) throw new Error(`No exercise ${key}`);
    if (m.reuse && !mapOf(m.reuse)[m.reuse]?.picture) throw new Error(`${key} reuses ${m.reuse}, which has no picture`);
    const book = [m.panel, m.panel2].filter((p): p is string => Boolean(p)).map((p) => bookRef(files, p, offset, m.printedPage));
    items.push({
      lesson: lessonId,
      exercise: id,
      type: ex.type,
      text: textOf(ex),
      ...(m.reuse ? { reuse: m.reuse } : { picture: m.picture }),
      book: book.length === 0 ? null : book.length === 1 ? book[0] : book,
    });
  }
  const pictures = items.filter((i) => "picture" in i).length;
  const out = { unit: unit.id, pictures, items };
  writeFileSync(join(files.plan, `unit${n}.json`), JSON.stringify(out, null, 2) + "\n");
  console.log(`${files.course.id === "a1" ? "" : `${files.course.level} `}unit ${n}: ${items.length} entries, ${pictures} new pictures, ${items.filter((i) => i.book).length} with a book match`);
}
main();
