/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON from course modules and the Gemini API */
// Prints a unit's exercises with their indices.
// Usage: npx tsx illustrations/tools/list-exercises.ts . <unit number>
import { resolve } from "node:path";
async function main() {
  const [root, n] = process.argv.slice(2);
  const unit = (await import(resolve(root, `src/lib/course/units/unit${n}.ts`)))[`unit${n}`];
  for (const lesson of unit.lessons) {
    console.log(`\n${lesson.id} ${lesson.kind ?? "vocab"} — ${lesson.title} (${lesson.titleEn})`);
    lesson.exercises.forEach((ex: any, i: number) => {
      const gist =
        ex.type === "intro" ? `${ex.sk} = ${ex.en}` :
        ex.type === "grammar" ? ex.title :
        ex.type === "match" ? ex.pairs.map((p: any) => p.sk).join(", ") :
        ex.type === "build" ? (ex.promptLang === "sk" ? ex.prompt : ex.answers[0]) :
        ex.type === "fill" ? `${ex.before} ___ ${ex.after}` :
        ex.type === "choice" ? `${ex.sk ?? ""} ${ex.question ?? ""}`.trim() :
        ex.sk ?? "";
      console.log(`  #${i} ${ex.type.padEnd(7)} ${gist}`);
    });
  }
}
main();
