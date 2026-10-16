/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON from course modules */
// Renders every planned picture and hooks them up to the app.
// Usage: npx tsx illustrations/tools/render-plan.ts [--dry-run] [--unit N] [--concurrency 4] [--model ID] [--size 1K]
//
// 1. Renders each entry with a `picture` that has no file in illustrations/renders/
//    yet (so a failed or interrupted run resumes where it stopped).
// 2. Converts each render for the web: public/illustrations/<lesson>-<exercise id>-<hash>.webp,
//    960 px wide, near-white paper pushed to white so it blends into the page. The hash
//    comes from the render, so a redrawn picture gets a new URL, and the files can be
//    cached forever (next.config.ts marks /illustrations/* immutable).
// 3. Writes src/lib/course/illustrations.json: "lessonId#exerciseId" → picture, with
//    reuses resolved. Entries whose exercise text no longer matches the course are
//    left out (the exercise changed or was removed since the plan was made).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { buildParts, dir, RenderError, renderImage } from "./gemini";

loadEnvConfig(process.cwd());

const root = process.cwd();
const rendersDir = join(dir, "renders");
const publicDir = join(root, "public/illustrations");
const ATTEMPTS = 4;

type Entry = { lesson: string; exercise: string; type: string; text: string; picture?: string; reuse?: string };
const keyOf = (e: { lesson: string; exercise: string }) => `${e.lesson}#${e.exercise}`;
const fileOf = (key: string) => key.replace("#", "-");

function parseArgs() {
  const args = process.argv.slice(2);
  const opt = { dryRun: false, unit: 0, concurrency: 4, model: "gemini-nano-banana-2.1", size: "1K" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") opt.dryRun = true;
    else if (args[i] === "--unit") opt.unit = Number(args[++i]);
    else if (args[i] === "--concurrency") opt.concurrency = Number(args[++i]);
    else if (args[i] === "--model") opt.model = args[++i];
    else if (args[i] === "--size") opt.size = args[++i];
  }
  return opt;
}

function loadPlan(): Entry[] {
  const entries: Entry[] = [];
  for (let n = 1; n <= 10; n++) {
    const path = join(dir, `plan/unit${n}.json`);
    if (existsSync(path)) entries.push(...JSON.parse(readFileSync(path, "utf8")).items);
  }
  return entries;
}

function textOf(ex: any): string {
  switch (ex.type) {
    case "intro": return `${ex.sk} = ${ex.en}`;
    case "grammar": return ex.title;
    case "choice": return [ex.sk, ex.question].filter(Boolean).join(" ");
    default: return ex.sk ?? ex.prompt ?? "";
  }
}

async function courseTexts(): Promise<Map<string, string>> {
  const texts = new Map<string, string>();
  for (let n = 1; n <= 10; n++) {
    const unit = (await import(join(root, `src/lib/course/units/unit${n}.ts`)))[`unit${n}`];
    for (const lesson of unit.lessons) {
      for (const ex of lesson.exercises) texts.set(`${lesson.id}#${ex.id}`, textOf(ex));
    }
  }
  return texts;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function renderOne(entry: Entry, opt: ReturnType<typeof parseArgs>): Promise<number> {
  const key = keyOf(entry);
  for (let attempt = 1; ; attempt++) {
    try {
      const out = await renderImage(buildParts(entry.picture!), opt.model, opt.size);
      writeFileSync(join(rendersDir, `${fileOf(key)}.${out.ext}`), out.data);
      console.log(`✓ ${key}  ${out.summary}`);
      return out.cost;
    } catch (e) {
      const retry = e instanceof RenderError && e.retryable && attempt < ATTEMPTS;
      console.error(`${retry ? "…" : "✗"} ${key}: ${(e as Error).message}${retry ? ` (retry ${attempt})` : ""}`);
      if (!retry) return 0;
      await sleep(15_000 * attempt);
    }
  }
}

function renderedFile(key: string): string | undefined {
  return ["jpg", "png"].map((ext) => join(rendersDir, `${fileOf(key)}.${ext}`)).find(existsSync);
}

function toWeb(key: string): { src: string; width: number; height: number } | undefined {
  const source = renderedFile(key);
  if (!source) return undefined;
  const file = fileOf(key);
  const hash = createHash("sha256").update(readFileSync(source)).digest("hex").slice(0, 8);
  const name = `${file}-${hash}.webp`;
  const target = join(publicDir, name);
  if (!existsSync(target)) {
    const unhashed = join(publicDir, `${file}.webp`); // from before names carried a hash
    if (existsSync(unhashed)) renameSync(unhashed, target);
    else execFileSync("magick", [source, "-resize", "960x", "-channel", "RGB", "-level", "0%,95%", "+channel", "-quality", "80", target]);
  }
  // Drop this picture's older versions.
  const old = new RegExp(`^${file}-[0-9a-f]{8}\\.webp$`);
  for (const f of readdirSync(publicDir)) if (old.test(f) && f !== name) rmSync(join(publicDir, f));
  const [width, height] = execFileSync("magick", ["identify", "-format", "%w %h", target]).toString().split(" ").map(Number);
  return { src: `/illustrations/${name}`, width, height };
}

async function main() {
  const opt = parseArgs();
  const plan = loadPlan();
  const byKey = new Map(plan.map((e) => [keyOf(e), e]));
  const wanted = plan.filter((e) => e.picture && (!opt.unit || e.lesson.startsWith(`u${opt.unit}-`)));
  const todo = wanted.filter((e) => !renderedFile(keyOf(e)));
  console.log(`${wanted.length} pictures planned, ${todo.length} to render (${opt.model}, ${opt.size})`);
  if (opt.dryRun) return;
  if (todo.length && !process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set (.env.local)");

  mkdirSync(rendersDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });
  let spent = 0;
  let next = 0;
  await Promise.all(
    Array.from({ length: opt.concurrency }, async () => {
      while (next < todo.length) {
        const cost = await renderOne(todo[next++], opt);
        spent += cost;
      }
    }),
  );
  if (todo.length) console.log(`rendered; spent ≈ $${spent.toFixed(2)}`);

  // Hook up: every plan entry (reuses included) whose picture exists and whose exercise still matches.
  const texts = await courseTexts();
  const map: Record<string, { src: string; width: number; height: number }> = {};
  const stale: string[] = [];
  for (const entry of plan) {
    const key = keyOf(entry);
    if (texts.get(key) !== entry.text) {
      stale.push(key);
      continue;
    }
    let source = entry;
    while (source.reuse) source = byKey.get(source.reuse)!;
    const web = toWeb(keyOf(source));
    if (web) map[key] = web;
  }
  writeFileSync(join(root, "src/lib/course/illustrations.json"), JSON.stringify(map, null, 2) + "\n");
  console.log(`hooked up ${Object.keys(map).length} of ${plan.length} plan entries`);
  if (stale.length) console.log(`left out, exercise text changed: ${stale.join(", ")}`);
}
main();
