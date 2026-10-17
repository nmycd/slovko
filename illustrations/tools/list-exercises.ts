/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON from course modules and the Gemini API */
// Prints a unit's exercises with their ids (what map-uN.json keys point at).
// Usage: npx tsx illustrations/tools/list-exercises.ts . <unit number> [--course a2]
import { courseArg, loadUnitFile } from "../../scripts/course-files";
async function main() {
  const { files, rest } = courseArg();
  const [, n] = rest;
  const unit: any = await loadUnitFile(files, Number(n));
  for (const lesson of unit.lessons) {
    console.log(`\n${lesson.id} ${lesson.kind ?? "vocab"} — ${lesson.title} (${lesson.titleEn})`);
    lesson.exercises.forEach((ex: any) => {
      const gist =
        ex.type === "intro" ? `${ex.sk} = ${ex.en}` :
        ex.type === "grammar" ? ex.title :
        ex.type === "match" ? ex.pairs.map((p: any) => p.sk).join(", ") :
        ex.type === "build" ? (ex.promptLang === "sk" ? ex.prompt : ex.answers[0]) :
        ex.type === "fill" ? `${ex.before} ___ ${ex.after}` :
        ex.type === "choice" ? `${ex.sk ?? ""} ${ex.question ?? ""}`.trim() :
        ex.sk ?? "";
      console.log(`  #${ex.id.padEnd(32)} ${ex.type.padEnd(7)} ${gist}`);
    });
  }
}
main();
