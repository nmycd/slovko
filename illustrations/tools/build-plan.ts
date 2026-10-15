/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON from course modules and the Gemini API */
// Builds illustrations/plan/unitN.json from illustrations/plan/map-uN.json.
// Usage: npx tsx illustrations/tools/build-plan.ts . <unit number> <printed page minus PDF page>
//
// map-uN.json: { "u1-l1#3": { "picture": "…" | "reuse": "u1-l1#1", "panel": "p6-6" | null,
//                             "panel2"?: "p7-16", "printedPage"?: 9 } }
// A reuse may name an entry of an earlier unit ("u1-l1#4").
// A panel name is p<PDF page>-<label>, matching book-panels-uN.txt and the crop file.
// printedPage overrides the offset where the scan skips a page inside a lesson.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

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

function bookRef(root: string, panel: string, offset: number, printedPage?: number) {
  const match = panel.match(/^p(\d+)-(.+)$/);
  if (!match) throw new Error(`Bad panel name ${panel}`);
  const crop = `book-refs/panels/${panel}.jpg`;
  if (!existsSync(join(root, "illustrations", crop))) throw new Error(`Missing crop ${crop}`);
  const pdfPage = Number(match[1]);
  return { pdfPage, printedPage: printedPage ?? pdfPage + offset, panel: match[2], crop };
}

async function main() {
  const [rootArg, n, offsetArg] = process.argv.slice(2);
  const root = resolve(rootArg);
  const offset = Number(offsetArg);
  if (!n || Number.isNaN(offset)) throw new Error("Usage: build-plan.ts <repo root> <unit number> <offset>");
  const unit = (await import(join(root, `src/lib/course/units/unit${n}.ts`)))[`unit${n}`];
  const readMap = (unitN: string): Mapping =>
    JSON.parse(readFileSync(join(root, `illustrations/plan/map-u${unitN}.json`), "utf8"));
  const mapping = readMap(n);
  // A reuse may point into an earlier unit ("u1-l1#4"); look it up in that unit's map.
  const mapOf = (key: string) => {
    const unitN = key.match(/^u(\d+)-/)?.[1];
    return !unitN || unitN === n ? mapping : readMap(unitN);
  };
  const items = [];
  for (const [key, m] of Object.entries(mapping)) {
    const [lessonId, index] = key.split("#");
    const lesson = unit.lessons.find((l: any) => l.id === lessonId);
    const ex = lesson?.exercises[Number(index)];
    if (!ex) throw new Error(`No exercise ${key}`);
    if (m.reuse && !mapOf(m.reuse)[m.reuse]?.picture) throw new Error(`${key} reuses ${m.reuse}, which has no picture`);
    const book = [m.panel, m.panel2].filter((p): p is string => Boolean(p)).map((p) => bookRef(root, p, offset, m.printedPage));
    items.push({
      lesson: lessonId,
      exercise: Number(index),
      type: ex.type,
      text: textOf(ex),
      ...(m.reuse ? { reuse: m.reuse } : { picture: m.picture }),
      book: book.length === 0 ? null : book.length === 1 ? book[0] : book,
    });
  }
  const pictures = items.filter((i) => "picture" in i).length;
  const out = { unit: unit.id, pictures, items };
  writeFileSync(join(root, `illustrations/plan/unit${n}.json`), JSON.stringify(out, null, 2) + "\n");
  console.log(`unit ${n}: ${items.length} entries, ${pictures} new pictures, ${items.filter((i) => i.book).length} with a book match`);
}
main();
