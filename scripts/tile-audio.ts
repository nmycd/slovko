// Word-tile clips, cut from a take of their own sentence (CONTENT-PIPELINE.md,
// stage 9, "Word tiles"). Run as part of scripts/generate-audio.ts.
//
// For every word-order exercise with a Slovak answer: the answer is voiced with
// character timings, split on spaces into words (word k is tile k), and each word is
// cut out at the pauses. Each wrong tile is voiced in the same sentence, in place of
// the tile it competes with, and cut out the same way; one take carries several wrong
// tiles when they replace different words. The takes are kept in storage too, so
// clips can be cut again without paying for them twice.

import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalize, slips, stripDiacritics, toTiles } from "../src/lib/answers";
import { isSilentTile, LIVE_TILE_STYLE, tileStyles, type TileStyle } from "../src/lib/course/helpers";
import type { BuildExercise, Lesson, Trap } from "../src/lib/course/types";
import { synthesizeWithTimings, withRetries, type Alignment } from "../src/lib/elevenlabs";
import * as cache from "../src/lib/tts-cache";

/** A sentence to voice, and the words to cut out of it as tile clips. */
export type Take = {
  text: string;
  /** Word `word` of the take becomes the clip of `tile`. */
  cuts: { word: number; tile: string }[];
};

export type TilePlan = {
  /** "u3-l1#build-kde-je": the lesson and exercise. */
  key: string;
  sentence: string;
  takes: Take[];
};

/** Where each word sits in a sentence: the same runs `toTiles` splits it into. */
export function wordSpans(sentence: string): { start: number; end: number }[] {
  return [...sentence.matchAll(/[^\s.,!?…:;"“”„«»—–]+/g)].map((m) => ({
    start: m.index,
    end: m.index + m[0].length,
  }));
}

/**
 * The tile a wrong one stands in for: its trap's `right`, or else the right tile most
 * like it in form.
 */
function rivalOf(wrong: string, tiles: string[], traps: Trap[]): number {
  const trap = traps.find((t) => normalize(t.wrong) === normalize(wrong));
  const right = trap ? tiles.findIndex((tile) => normalize(tile) === normalize(trap.right)) : -1;
  if (right >= 0) return right;
  const form = (w: string) => stripDiacritics(w.toLowerCase());
  const distance = (tile: string) => slips(form(wrong), form(tile)) / Math.max(wrong.length, tile.length);
  let best = 0;
  tiles.forEach((tile, i) => {
    if (distance(tile) < distance(tiles[best])) best = i;
  });
  return best;
}

/**
 * The sentence with some of its words replaced. A new word takes the case of the one
 * it replaces: a capital at the start, a name keeps its own, "Ako" mid-sentence is "ako".
 */
function withWords(sentence: string, replace: Map<number, string>): string {
  const spans = wordSpans(sentence);
  let out = sentence;
  [...replace.entries()]
    .sort(([a], [b]) => b - a)
    .forEach(([k, word]) => {
      const { start, end } = spans[k];
      const capital = /^\p{Lu}/u.test(sentence.slice(start, end));
      const said =
        k === 0 && capital
          ? word[0].toLocaleUpperCase() + word.slice(1)
          : !capital
            ? word[0].toLocaleLowerCase() + word.slice(1)
            : word;
      out = out.slice(0, start) + said + out.slice(end);
    });
  return out;
}

/** The takes for one exercise: the answer, then as few frames as hold its wrong tiles. */
export function planExercise(key: string, ex: BuildExercise): TilePlan {
  const sentence = ex.answers[0];
  const tiles = toTiles(sentence);
  const cuts = tiles
    .map((tile, word) => ({ word, tile }))
    .filter(({ tile }, k) => !isSilentTile(tile) && tiles.indexOf(tile) === k);
  const takes: Take[] = [{ text: sentence, cuts }];

  // Each frame swaps in at most one wrong tile per word.
  const frames: Map<number, string>[] = [];
  for (const wrong of ex.distractors) {
    if (isSilentTile(wrong)) continue;
    const word = rivalOf(wrong, tiles, ex.traps ?? []);
    let frame = frames.find((f) => !f.has(word));
    if (!frame) frames.push((frame = new Map()));
    frame.set(word, wrong);
  }
  for (const frame of frames) {
    takes.push({
      text: withWords(sentence, frame),
      cuts: [...frame.entries()].sort(([a], [b]) => a - b).map(([word, tile]) => ({ word, tile })),
    });
  }
  return { key, sentence, takes };
}

/** Every word-order exercise with a Slovak answer, in course order. */
export function planTiles(lessons: Lesson[]): TilePlan[] {
  return lessons.flatMap((lesson) =>
    lesson.exercises.flatMap((ex) =>
      ex.type === "build" && ex.promptLang === "en" ? [planExercise(`${lesson.id}#${ex.id}`, ex)] : [],
    ),
  );
}

// ---- Cutting ----

const RATE = 44100;
/** Loudness is measured in frames of 220 samples (5 ms), a whole number of samples. */
const FRAME = 220;
const dB = (x: number) => 10 ** (x / 20);
/** Quieter than this is silence, trimmed from a clip's ends. */
const SILENT = dB(-50);

/** Runs ffmpeg with `input` on stdin; resolves with stdout. */
function ffmpeg(args: string[], input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-v", "error", ...args]);
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (d: Buffer) => out.push(d));
    child.stderr.on("data", (d: Buffer) => err.push(d));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`ffmpeg: ${Buffer.concat(err).toString()}`)),
    );
    child.stdin.end(input);
  });
}

/** MP3 → mono samples at 44.1 kHz. */
async function decode(mp3: ArrayBuffer): Promise<Float32Array> {
  const pcm = await ffmpeg(["-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", String(RATE), "pipe:1"], Buffer.from(mp3));
  return new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
}

/**
 * A clip → MP3 in a style (see `tileStyles`): slowed if it's shorter than the style's
 * `shortest`, with its `leadInMs` of silence first. Encoded through a file rather than
 * a pipe so the encoder can write the header that tells players to skip its padding
 * (or every clip would start late).
 */
let encoded = 0;

async function encode(samples: Float32Array, dir: string, style: TileStyle): Promise<Buffer> {
  const { shortest, leadInMs } = tileStyles[style];
  // A name of its own: exercises are encoded side by side.
  const file = join(dir, `${++encoded}.mp3`);
  const pcm = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
  const seconds = samples.length / RATE;
  // atempo needs sound around a short clip, or it eats its start and end; it also
  // slows to half speed at most, so slower takes two.
  const tempo = seconds / shortest;
  const slow = tempo >= 1 ? [] : tempo >= 0.5 ? [tempo] : [Math.sqrt(tempo), Math.sqrt(tempo)];
  const pad = Math.max(leadInMs, 60);
  const filters = [
    ...(leadInMs || slow.length ? [`adelay=${slow.length ? pad : leadInMs}:all=1`] : []),
    ...(slow.length ? [`apad=pad_dur=${pad / 1000}`, ...slow.map((t) => `atempo=${t.toFixed(3)}`)] : []),
  ];
  await ffmpeg(
    [
      ...["-y", "-f", "f32le", "-ar", String(RATE), "-ac", "1", "-i", "pipe:0"],
      ...(filters.length ? ["-af", filters.join(",")] : []),
      ...["-c:a", "libmp3lame", "-b:a", "128k", file],
    ],
    pcm,
  );
  const mp3 = await readFile(file);
  await rm(file);
  return mp3;
}

/** Loudness (RMS) of each frame. */
function loudness(samples: Float32Array): Float32Array {
  const frames = new Float32Array(Math.ceil(samples.length / FRAME));
  for (let f = 0; f < frames.length; f++) {
    const from = f * FRAME;
    const to = Math.min(samples.length, from + FRAME);
    let sum = 0;
    for (let i = from; i < to; i++) sum += samples[i] * samples[i];
    frames[f] = Math.sqrt(sum / (to - from));
  }
  return frames;
}

type Span = { start: number; end: number };
/** A word of a take, with its timing in seconds. */
type Word = Span & { text: string };

/**
 * Each word's timing in seconds, from the take's character timings: the runs between
 * spaces, punctuation dropped, as `toTiles` splits the sentence. Throws unless the
 * words are the sentence's tiles, one for one.
 */
export function wordTimes(text: string, alignment: Alignment): Word[] {
  const words: Word[] = [];
  let word: Word | null = null;
  alignment.characters.forEach((c, i) => {
    if (/[\s.,!?…:;"“”„«»—–]/.test(c)) {
      word = null;
      return;
    }
    const at = { start: alignment.character_start_times_seconds[i], end: alignment.character_end_times_seconds[i] };
    if (word) Object.assign(word, { text: word.text + c, end: at.end });
    else words.push((word = { text: c, ...at }));
  });
  const tiles = toTiles(text);
  const said = words.map((w) => w.text);
  if (said.length !== tiles.length || said.some((w, k) => w.normalize("NFC") !== tiles[k].normalize("NFC"))) {
    throw new Error(`timings give ${said.length} words (${said.join(" ")}) for ${tiles.length} tiles`);
  }
  return words;
}

/** Quieter than this between two words is a pause. */
const PAUSE = dB(-40);

/**
 * Where to cut between two words, as a frame: in the middle of the pause between them
 * if there is one near the timings' boundary, else at the boundary itself. The search
 * reaches only a little way into either word, so it never cuts one short. After v, z,
 * s or k, said as part of the next word, the boundary is just before that word's
 * start, so its clip doesn't begin with the preposition.
 */
function cutBetween(frames: Float32Array, before: Word, after: Word): number {
  const at = (s: number) => Math.max(0, Math.min(frames.length - 1, Math.round((s * RATE) / FRAME)));
  const reach = (w: Span) => Math.min(0.04, 0.15 * (w.end - w.start));
  const from = at(Math.min(before.end, after.start) - reach(before));
  const to = at(Math.max(before.end, after.start) + reach(after));
  let quietest = from;
  for (let f = from; f <= to; f++) if (frames[f] < frames[quietest]) quietest = f;
  if (frames[quietest] > PAUSE) {
    return at(isSilentTile(before.text) ? after.start - 0.01 : (before.end + after.start) / 2);
  }
  const limit = Math.max(frames[quietest] * 2, SILENT);
  let lo = quietest;
  let hi = quietest;
  while (lo > from && frames[lo - 1] <= limit) lo--;
  while (hi < to && frames[hi + 1] <= limit) hi++;
  return Math.round((lo + hi) / 2);
}

/** Fades the ends in place, so a cut through sound doesn't click. */
function fade(clip: Float32Array) {
  const fadeIn = Math.min(clip.length, Math.round(RATE * 0.008));
  const fadeOut = Math.min(clip.length, Math.round(RATE * 0.015));
  for (let i = 0; i < fadeIn; i++) clip[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fadeIn);
  for (let i = 0; i < fadeOut; i++) clip[clip.length - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fadeOut);
}

/** A word cut out of a take: where in it (seconds), and what's wrong with it, if anything. */
export type Clip = { samples: Float32Array; start: number; seconds: number; problem?: string };

/**
 * Cuts words out of a take: each from the cut before it to the cut after it (see
 * `cutBetween`), with the silence at its ends trimmed to a little, and checked for
 * length and loudness.
 */
export function cutWords(samples: Float32Array, words: Word[], wanted: number[]): Clip[] {
  const frames = loudness(samples);
  const cuts = words.slice(1).map((w, k) => cutBetween(frames, words[k], w));
  const last = words.length - 1;
  return wanted.map((k) => {
    // The outer ends stay near the timings, leaving out any breath before the sentence.
    const from = k === 0 ? Math.max(0, Math.floor(((words[0].start - 0.1) * RATE) / FRAME)) : cuts[k - 1];
    const to = k === last ? Math.min(frames.length, Math.ceil(((words[last].end + 0.25) * RATE) / FRAME)) : cuts[k];
    let first = from;
    let end = to;
    while (first < end - 1 && frames[first] < SILENT) first++;
    while (end > first + 1 && frames[end - 1] < SILENT) end--;
    const start = Math.max(from * FRAME, first * FRAME - Math.round(RATE * 0.02));
    const stop = Math.min(to * FRAME, end * FRAME + Math.round(RATE * 0.04), samples.length);
    const clip = samples.slice(start, stop);
    fade(clip);

    const seconds = clip.length / RATE;
    let peak = 0;
    for (let f = first; f < end; f++) peak = Math.max(peak, frames[f]);
    const timed = words[k].end - words[k].start;
    const problem =
      seconds < 0.08
        ? `too short (${seconds.toFixed(2)} s)`
        : peak < dB(-30)
          ? "silent"
          : seconds > timed + 0.6
            ? `too long (${seconds.toFixed(2)} s for a ${timed.toFixed(2)} s word)`
            : undefined;
    return { samples: clip, start: start / RATE, seconds, problem };
  });
}

// ---- Generating ----

export type TileOptions = {
  dryRun: boolean;
  /** Delete tile clips and takes no exercise uses any more. */
  prune: boolean;
  /** Cut every clip again from its stored take (free), not just the missing ones. */
  recut: boolean;
  /** Only exercises whose key starts with one of these ("u3-", "u1-l3#build-volam-sa-tomas"). */
  only: string[];
  /** Also write each take and its clips here, with a page to listen to them on. */
  save?: string;
  /** Also cut every clip in each of `tileStyles`, for dev mode to compare (free). */
  styles: boolean;
};

const styleNames = Object.keys(tileStyles) as TileStyle[];

/** Generates the missing tile clips. Returns how many takes or clips failed. */
export async function generateTiles(lessons: Lesson[], options: TileOptions): Promise<number> {
  const all = planTiles(lessons);
  const plans = all.filter((p) => !options.only.length || options.only.some((prefix) => p.key.startsWith(prefix)));
  const [clips, takes, ...styled] = await Promise.all([
    cache.listCachedPaths("tiles"),
    cache.listCachedPaths("takes"),
    ...(options.styles || options.prune ? styleNames.map((s) => cache.listCachedPaths(`tile-styles/${s}`)) : []),
  ]);
  const styleClips = new Set(styled.flatMap((set) => [...set]));
  const clipPath = (plan: TilePlan, tile: string, style?: TileStyle) =>
    cache.tileCachePath(plan.key, plan.sentence, tile, style);
  const stored = (take: Take) => {
    const path = cache.takeCachePath(take.text);
    return takes.has(`${path}.mp3`) && takes.has(`${path}.json`);
  };

  // What each cut is for: the lessons' clip (missing, or all to cut again), the dev
  // styles still missing (or all, cutting again), and the local copy to listen to.
  const jobs = plans.map((plan) => ({
    plan,
    takes: plan.takes
      .map((take) => {
        const cuts = take.cuts.map((c) => ({
          ...c,
          missing: !clips.has(clipPath(plan, c.tile)),
          styles: options.styles
            ? styleNames.filter((s) => options.recut || !styleClips.has(clipPath(plan, c.tile, s)))
            : [],
        }));
        const missing = cuts.some((c) => c.missing);
        // Anything but a missing clip only uses a take already paid for.
        const wanted = missing || stored(take) ? cuts.filter((c) => c.missing || options.recut || options.save || c.styles.length) : [];
        return { take, cuts: wanted, voice: missing && !stored(take) };
      })
      .filter((t) => t.cuts.length),
  }));
  const work = jobs.filter((j) => j.takes.length);
  const toVoice = work.flatMap((j) => j.takes.filter((t) => t.voice));
  const characters = toVoice.reduce((n, t) => n + t.take.text.length, 0);
  const tileCount = all.reduce((n, p) => n + p.takes.reduce((m, t) => m + t.cuts.length, 0), 0);
  const missingCount = jobs.reduce(
    (n, j) => n + j.plan.takes.reduce((m, t) => m + t.cuts.filter((c) => !clips.has(clipPath(j.plan, c.tile))).length, 0),
    0,
  );
  const styleCount = work.reduce((n, j) => n + j.takes.reduce((m, t) => m + t.cuts.reduce((k, c) => k + c.styles.length, 0), 0), 0);

  const wanted = new Set(all.flatMap((p) => p.takes.flatMap((t) => t.cuts.map((c) => clipPath(p, c.tile)))));
  const wantedTakes = new Set(
    all.flatMap((p) => p.takes.flatMap((t) => [".mp3", ".json"].map((ext) => cache.takeCachePath(t.text) + ext))),
  );
  const wantedStyles = new Set(
    all.flatMap((p) => p.takes.flatMap((t) => t.cuts.flatMap((c) => styleNames.map((s) => clipPath(p, c.tile, s))))),
  );
  const unused = [...clips, ...[...styleClips].filter((path) => !wantedStyles.has(path))].filter(
    (path) => !wanted.has(path) && !wantedStyles.has(path),
  );
  const unusedTakes = [...takes].filter((path) => !wantedTakes.has(path));

  console.log(`\nword tiles: ${all.length} exercises · ${tileCount} clips · ${all.reduce((n, p) => n + p.takes.length, 0)} takes`);
  if (options.only.length) console.log(`only ${options.only.join(", ")}: ${plans.length} exercises`);
  console.log(`clips missing: ${missingCount}${options.recut ? " · cutting the rest again" : ""}`);
  if (options.styles) console.log(`dev styles to cut: ${styleCount} clips (${styleNames.join(", ")})`);
  console.log(`takes to voice: ${toVoice.length} · characters to generate: ${characters.toLocaleString("en")}`);
  console.log(
    `unused in cache: ${unused.length} clips, ${unusedTakes.length / 2} takes${options.prune ? " (will be deleted)" : ""}`,
  );
  if (options.dryRun) return 0;

  const tmp = await mkdtemp(join(tmpdir(), "slovko-tiles-"));
  const page = new Map<string, string>();
  let failed = 0;
  let done = 0;
  const queue = [...work];

  async function run({ plan, takes: needed }: (typeof work)[number]) {
    const folder = plan.key.replace("#", "__");
    const listen: string[] = [];
    const save = async (name: string, bytes: Buffer, label: string) => {
      if (!options.save) return;
      await mkdir(join(options.save, folder), { recursive: true });
      await writeFile(join(options.save, folder, name), bytes);
      listen.push(`<span>${label} <audio controls preload="none" src="${folder}/${name}"></audio></span>`);
    };
    for (const [t, { take, cuts, voice }] of needed.entries()) {
      const path = cache.takeCachePath(take.text);
      let audio: ArrayBuffer | null;
      let alignment: Alignment;
      if (voice) {
        ({ audio, alignment } = await withRetries(() => synthesizeWithTimings(take.text)));
        // Stored before cutting, so a failed cut never costs the take again.
        await cache.storeCached(`${path}.mp3`, audio, "audio/mpeg");
        await cache.storeCached(`${path}.json`, Buffer.from(JSON.stringify(alignment)), "application/json");
      } else {
        audio = await cache.readCached(`${path}.mp3`);
        const json = await cache.readCached(`${path}.json`);
        if (!audio || !json) throw new Error(`take "${take.text}" is listed but can't be read`);
        alignment = JSON.parse(Buffer.from(json).toString());
      }
      await save(`take-${t}.mp3`, Buffer.from(audio), `<i>${html(take.text)}</i>`);

      let words: Word[];
      try {
        words = wordTimes(take.text, alignment);
      } catch (err) {
        failed++;
        console.error(`✗ ${plan.key} "${take.text}": ${(err as Error).message}`);
        continue;
      }
      const cut = cutWords(await decode(audio), words, cuts.map((c) => c.word));
      for (const [i, { tile, word, missing, styles }] of cuts.entries()) {
        const clip = cut[i];
        if (clip.problem) {
          failed++;
          console.error(`✗ ${plan.key} "${tile}" in "${take.text}": ${clip.problem}`);
          continue;
        }
        const live = await encode(clip.samples, tmp, LIVE_TILE_STYLE);
        if (missing || options.recut) await cache.storeCached(clipPath(plan, tile), live, "audio/mpeg");
        for (const style of styles) {
          const mp3 = style === LIVE_TILE_STYLE ? live : await encode(clip.samples, tmp, style);
          await cache.storeCached(clipPath(plan, tile, style), mp3, "audio/mpeg");
        }
        await save(`${t}-${word}-${tile}.mp3`, live, `<b>${html(tile)}</b> ${clip.seconds.toFixed(2)} s`);
      }
    }
    done++;
    console.log(`[${String(done).padStart(4)}/${work.length}] ${plan.key}: ${plan.sentence}`);
    page.set(plan.key, `<section><h2>${html(plan.key)}</h2>${listen.join("\n")}</section>`);
  }

  async function worker() {
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        await run(job);
      } catch (err) {
        failed++;
        console.error(`✗ ${job.plan.key}: ${(err as Error).message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: 3 }, worker));
  await rm(tmp, { recursive: true, force: true });

  if (options.save) {
    const sections = work.map((j) => page.get(j.plan.key) ?? "");
    await writeFile(
      join(options.save, "index.html"),
      `<!doctype html><meta charset="utf-8"><title>Tile clips</title><style>body{font:16px system-ui;margin:2rem}section{margin-bottom:2rem}span{display:inline-flex;align-items:center;gap:.4rem;margin:0 1rem .4rem 0}span:has(i){display:flex;margin-top:.8rem;color:#555}audio{height:2rem}</style>\n${sections.join("\n")}`,
    );
    console.log(`saved to ${join(options.save, "index.html")}`);
  }
  if (options.prune) {
    await cache.removeCachedPaths([...unused, ...unusedTakes]);
    console.log(`deleted ${unused.length} unused clips and ${unusedTakes.length / 2} takes`);
  }
  console.log(`word tiles: ${done} exercises done, ${failed} failed`);
  return failed;
}

function html(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}
