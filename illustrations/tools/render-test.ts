// Test renders of planned pictures with Gemini image models ("Nano Banana").
// Usage: npx tsx illustrations/tools/render-test.ts [--with-crop] [--dry-run] [--model ID] [--size 1K] u1-l1#3 u1-l2#9 …
// --dry-run prints the prompt (text parts and image files) without calling the API.
//
// Sends the style references (illustrations/style-refs/, git-ignored), the cast
// looks from README.md and the entry's picture description. With --with-crop it
// also sends the textbook crop: for internal comparison only, never for pictures
// we ship. Output goes to illustrations/test-renders/ (git-ignored).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { buildParts, describeParts, dir, renderImage } from "./gemini";

loadEnvConfig(process.cwd());

type Book = { crop: string };
type Entry = { lesson: string; exercise: number; picture?: string; reuse?: string; book: Book | Book[] | null };

function parseArgs() {
  const args = process.argv.slice(2);
  const opt = { withCrop: false, dryRun: false, model: "gemini-nano-banana-2.1", size: "1K", ids: [] as string[] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--with-crop") opt.withCrop = true;
    else if (args[i] === "--dry-run") opt.dryRun = true;
    else if (args[i] === "--model") opt.model = args[++i];
    else if (args[i] === "--size") opt.size = args[++i];
    else opt.ids.push(args[i]);
  }
  return opt;
}

function findEntry(id: string): Entry {
  const [lesson, index] = id.split("#");
  const unit = lesson.split("-")[0].slice(1);
  const plan = JSON.parse(readFileSync(join(dir, `plan/unit${unit}.json`), "utf8"));
  const entry = plan.items.find((e: Entry) => e.lesson === lesson && e.exercise === Number(index));
  if (!entry) throw new Error(`No plan entry ${id}`);
  return entry.reuse ? { ...findEntry(entry.reuse), book: entry.book } : entry;
}

async function render(id: string, opt: ReturnType<typeof parseArgs>) {
  const entry = findEntry(id);
  const book = Array.isArray(entry.book) ? entry.book[0] : entry.book;
  const parts = buildParts(entry.picture!, opt.withCrop ? book?.crop : undefined);
  if (opt.dryRun) {
    console.log(`--- ${id}${opt.withCrop ? " (with crop)" : ""}\n${describeParts(parts)}`);
    return 0;
  }
  const out = await renderImage(parts, opt.model, opt.size);
  const name = `${id.replace("#", "-")}${opt.withCrop ? "-crop" : ""}.${out.ext}`;
  writeFileSync(join(dir, "test-renders", name), out.data);
  console.log(`${name}  ${out.summary}`);
  return out.cost;
}

async function main() {
  const opt = parseArgs();
  if (!process.env.GEMINI_API_KEY && !opt.dryRun) throw new Error("GEMINI_API_KEY is not set (.env.local)");
  mkdirSync(join(dir, "test-renders"), { recursive: true });
  const costs = await Promise.all(
    opt.ids.map((id) => render(id, opt).catch((e) => (console.error(`${id}: ${e.message}`), 0))),
  );
  console.log(`total ≈ $${costs.reduce((a, b) => a + b, 0).toFixed(4)} (${opt.model}, ${opt.size})`);
}
main();
