// Single-word clips, cut from takes of words said one at a time (CONTENT-PIPELINE.md,
// stage 9, "Short words are never voiced on their own"). Run as part of
// scripts/generate-audio.ts.
//
// A word voiced on its own (ma, ťa, ho) comes out wrong, maybe not even in Slovak. So
// the course's single words are voiced eight to a take, "ťa… kúpeľňa… ho… …", long
// and short mixed so the voice keeps to Slovak, and each is cut out at the pauses, as
// word tiles are (style E2). Words that ran together get one more take, with others.

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { toTiles } from "../src/lib/answers";
import { synthesizeWithTimings, withRetries, type Alignment } from "../src/lib/elevenlabs";
import * as cache from "../src/lib/tts-cache";
import { cutWords, decode, encode, wordTimes } from "./tile-audio";

/** Words to a take. */
const BATCH = 8;
/** How word clips are finished: 60 ms of silence first, no slowing (as tiles' E2). */
const STYLE = "e2";

/**
 * Takes of the given words: long and short dealt out together, each said with "…".
 * Too few to fill a take, they're joined by `carriers` (other words, said but not
 * kept), so no word is ever voiced nearly alone.
 */
export function wordTakes(words: string[], carriers: string[] = []): string[] {
  const filler = carriers.filter((w) => !words.includes(w)).slice(0, Math.max(0, BATCH - words.length));
  const byLength = [...words, ...filler].sort((a, b) => b.length - a.length || a.localeCompare(b));
  const count = Math.ceil(byLength.length / BATCH);
  const batches: string[][] = Array.from({ length: count }, () => []);
  byLength.forEach((word, i) => batches[i % count].push(word));
  // Longest and shortest in turn, so no take is all little words.
  return batches.map((batch) => {
    const mixed: string[] = [];
    while (batch.length) mixed.push(...[batch.shift(), batch.pop()].filter((w): w is string => w !== undefined));
    return `${mixed.join("… ")}…`;
  });
}

export type WordOptions = {
  dryRun: boolean;
  /** Voice these words again in new takes, though they have clips (one that sounds wrong). */
  redo: string[];
  /** The seed of new takes; a second take uses the next. */
  seed: number;
  /** Cut every clip again from the stored takes (free). */
  recut: boolean;
  /** Voice nothing more once this many characters are spent. */
  budget: number;
  /** Also write each take and its clips here. */
  save?: string;
};

/** Makes the missing single-word clips. Returns how many words failed. */
export async function generateWords(words: string[], options: WordOptions): Promise<number> {
  const [clips, takes] = await Promise.all([cache.listCachedPaths("words"), cache.listCachedPaths("word-takes")]);
  const unknown = options.redo.filter((w) => !words.includes(w));
  if (unknown.length) throw new Error(`Not a single word of the course: ${unknown.join(", ")}`);
  const missing = words.filter((w) => !clips.has(cache.wordCachePath(w)) || options.redo.includes(w));
  // Long words first: they keep the voice in Slovak around a short one.
  const carriers = words
    .filter((w) => !missing.includes(w))
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
  const planned = wordTakes(missing, carriers);
  const characters = planned.reduce((n, t) => n + t.length, 0);
  const storedTakes = [...takes].filter((p) => p.endsWith(".json")).map((p) => p.slice(0, -".json".length));

  console.log(
    `\nsingle words: ${words.length} · clips to make: ${missing.length}${options.redo.length ? ` (redoing ${options.redo.join(", ")})` : ""}${options.recut ? " · cutting the rest again" : ""}`,
  );
  console.log(`takes to voice: ${planned.length} · characters to generate: ${characters.toLocaleString("en")}`);
  if (Number.isFinite(options.budget)) console.log(`budget: ${options.budget.toLocaleString("en")} characters, second takes included`);
  if (options.dryRun) return 0;

  const tmp = await mkdtemp(join(tmpdir(), "slovko-words-"));
  // Only the words being made are kept from a new take; carriers are said, not cut.
  const wanted = new Set(missing);
  let spent = 0;
  let failed = 0;
  let made = 0;

  /** Cuts a take's words out and stores those wanted; returns the ones that ran together. */
  async function cut(text: string, audio: ArrayBuffer, alignment: Alignment, only: (w: string) => boolean): Promise<string[]> {
    const said = toTiles(text);
    const clipsOf = cutWords(await decode(audio), wordTimes(text, alignment), said.map((_, k) => k), true);
    const ranTogether: string[] = [];
    for (const [k, word] of said.entries()) {
      if (!only(word)) continue;
      const clip = clipsOf[k];
      if (clip.problem) {
        if (clip.problem.startsWith("no pause")) ranTogether.push(word);
        else {
          failed++;
          console.error(`✗ "${word}" in "${text}": ${clip.problem}`);
        }
        continue;
      }
      const mp3 = await encode(clip.samples, tmp, STYLE);
      await cache.storeCached(cache.wordCachePath(word), mp3, "audio/mpeg");
      made++;
      if (options.save) {
        await mkdir(options.save, { recursive: true });
        await writeFile(join(options.save, `${word}.mp3`), mp3);
      }
    }
    return ranTogether;
  }

  /** Voices takes of these words (within the budget), cuts them, and returns those that ran together. */
  async function voice(texts: string[], seed: number): Promise<string[]> {
    const again: string[] = [];
    const queue = [...texts];
    async function worker() {
      for (let text = queue.shift(); text !== undefined; text = queue.shift()) {
        if (spent + text.length > options.budget) {
          failed += toTiles(text).length;
          console.error(`✗ not voiced (budget): "${text}"`);
          continue;
        }
        spent += text.length;
        try {
          const { audio, alignment } = await withRetries(() => synthesizeWithTimings(text, seed));
          const path = cache.wordTakePath(text);
          await cache.storeCached(`${path}.mp3`, audio, "audio/mpeg");
          await cache.storeCached(`${path}.json`, Buffer.from(JSON.stringify(alignment)), "application/json");
          again.push(...(await cut(text, audio, alignment, (w) => wanted.has(w))));
          console.log(`voiced (seed ${seed}): ${text}`);
        } catch (err) {
          failed += toTiles(text).length;
          console.error(`✗ "${text}": ${(err as Error).message}`);
        }
      }
    }
    await Promise.all(Array.from({ length: 3 }, worker));
    return again;
  }

  // Cutting again: every stored take gives its words back from its timings.
  const all = new Set(words);
  if (options.recut) {
    for (const path of storedTakes) {
      const audio = await cache.readCached(`${path}.mp3`);
      const json = await cache.readCached(`${path}.json`);
      if (!audio || !json) continue;
      const alignment = JSON.parse(Buffer.from(json).toString()) as Alignment;
      const text = alignment.characters.join("");
      const fresh = new Set(missing);
      try {
        // A word that ran together here may have a clip from another take: leave it be.
        const ranTogether = await cut(text, audio, alignment, (w) => all.has(w) && !fresh.has(w));
        ranTogether.forEach((w) => console.error(`  "${w}" ran together in "${text}", kept as it was`));
      } catch (err) {
        console.error(`✗ take "${text}": ${(err as Error).message}`);
      }
    }
  }

  const ranTogether = await voice(planned, options.seed);
  if (ranTogether.length) {
    console.log(`${ranTogether.length} words ran together: voicing them again, in new takes`);
    const still = await voice(wordTakes(ranTogether, carriers), options.seed + 1);
    still.forEach((w) => console.error(`✗ "${w}" ran together twice: it keeps its own clip`));
    failed += still.length;
  }
  await rm(tmp, { recursive: true, force: true });
  console.log(`single words: ${made} clips made, ${failed} failed · characters spent: ${spent.toLocaleString("en")}`);
  return failed;
}
