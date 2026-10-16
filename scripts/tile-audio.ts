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
import { isSilentTile, LESSON_TILE_STYLE, tileStyle, tileStyles, type TileStyle } from "../src/lib/course/helpers";
import type { BuildExercise, Lesson, Trap } from "../src/lib/course/types";
import { synthesizeWithTimings, withRetries, type Alignment } from "../src/lib/elevenlabs";
import * as cache from "../src/lib/tts-cache";

/** A sentence to voice, and the words to cut out of it as tile clips. */
export type Take = {
  text: string;
  /** Word `word` of the take becomes the clip of `tile`. */
  cuts: { word: number; tile: string }[];
  /** A take of the words one at a time, for this style only (option E). */
  style?: TileStyle;
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

/**
 * Option E's take for an exercise: its tiles, right then wrong, said one at a time,
 * joined as the style says ("To. Je. Naša." or "To… je… naša…").
 */
export function wordByWordTake(plan: TilePlan, style: TileStyle): Take {
  const join = tileStyle(style).words ?? ". ";
  const tiles = plan.takes.filter((t) => !t.style).flatMap((t) => t.cuts.map((c) => c.tile));
  const said = join.startsWith(".") ? tiles.map((w) => w[0].toLocaleUpperCase() + w.slice(1)) : tiles;
  return { text: said.join(join) + join.trim(), cuts: tiles.map((tile, word) => ({ word, tile })), style };
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

/** The shortest silence between two words said one at a time that counts as a pause. */
const WORD_GAP = 0.05;

/**
 * Where to cut between two words said one at a time (option E), as a frame: the middle
 * of the longest pause between the middles of the two words, or null if they ran
 * together without one.
 */
function pauseBetween(frames: Float32Array, before: Word, after: Word): number | null {
  const at = (s: number) => Math.max(0, Math.min(frames.length - 1, Math.round((s * RATE) / FRAME)));
  const from = at((before.start + before.end) / 2);
  const to = at((after.start + after.end) / 2);
  let best = { start: 0, length: 0 };
  let run = 0;
  for (let f = from; f <= to; f++) {
    run = frames[f] < PAUSE ? run + 1 : 0;
    if (run > best.length) best = { start: f - run + 1, length: run };
  }
  return (best.length * FRAME) / RATE >= WORD_GAP ? best.start + Math.floor(best.length / 2) : null;
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
 * length and loudness. Words said one at a time (`oneByOne`, option E) are cut only at
 * real pauses: a word with none on one side ran into its neighbour, and fails.
 */
export function cutWords(samples: Float32Array, words: Word[], wanted: number[], oneByOne = false): Clip[] {
  const frames = loudness(samples);
  const pauses = words.slice(1).map((w, k) => (oneByOne ? pauseBetween(frames, words[k], w) : null));
  const cuts = words.slice(1).map((w, k) => pauses[k] ?? cutBetween(frames, words[k], w));
  const last = words.length - 1;
  return wanted.map((k) => {
    const runOn = oneByOne && ((k > 0 && pauses[k - 1] === null) || (k < last && pauses[k] === null));
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
    const problem = runOn
      ? "no pause next to it: it ran into the next word"
      : seconds < 0.08
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
  /** Delete tile clips and takes no exercise uses any more (and the old tiles/). */
  prune: boolean;
  /** Cut every clip again from its stored take (free), not just the missing ones. */
  recut: boolean;
  /** Voice again, with another seed, stored word-by-word takes whose words ran together (paid). */
  revoice: boolean;
  /** Voice nothing more once this many characters are spent in the run. */
  budget: number;
  /** Only exercises whose key starts with one of these ("u3-", "u1-l3#build-volam-sa-tomas"). */
  only: string[];
  /** Also write each take and its clips here, with a page to listen to them on. */
  save?: string;
  /**
   * Styles to make besides the lessons' own (`LESSON_TILE_STYLE`), for dev mode to
   * compare. The styles cut from the sentence use its stored takes only (free); word
   * by word (E) voices a take of its own (paid).
   */
  styles: TileStyle[];
};

const styleNames = Object.keys(tileStyles) as TileStyle[];
/** How many more takes, with other seeds, a word-by-word take gets if its words ran together. */
const REVOICES = 1;
const ranTogether = (clips: Clip[]) => clips.filter((c) => c.problem?.startsWith("no pause")).length;

/** Generates the missing tile clips. Returns how many takes or clips failed. */
export async function generateTiles(lessons: Lesson[], options: TileOptions): Promise<number> {
  const all = planTiles(lessons);
  const wanted = [...new Set([...(LESSON_TILE_STYLE ? [LESSON_TILE_STYLE] : []), ...options.styles])];
  const cutStyles = wanted.filter((s) => !tileStyle(s).words);
  // Sentence takes are only paid for when lessons play a style cut from them.
  const voiceSentences = LESSON_TILE_STYLE !== null && cutStyles.includes(LESSON_TILE_STYLE);
  const plans = all
    .filter((p) => !options.only.length || options.only.some((prefix) => p.key.startsWith(prefix)))
    .map((p) => ({
      ...p,
      takes: [
        ...(cutStyles.length ? p.takes : []),
        ...wanted.filter((s) => tileStyle(s).words).map((s) => wordByWordTake(p, s)),
      ],
    }));
  const [takes, oldClips, ...styled] = await Promise.all([
    cache.listCachedPaths("takes"),
    cache.listCachedPaths("tiles"),
    ...styleNames.map((s) => cache.listCachedPaths(`tile-styles/${s}`)),
  ]);
  const clips = new Set(styled.flatMap((set) => [...set]));
  const clipPath = (plan: TilePlan, tile: string, style: TileStyle) =>
    cache.tileCachePath(plan.key, plan.sentence, tile, style);
  const stored = (take: Take) => {
    const path = cache.takeCachePath(take.text);
    return takes.has(`${path}.mp3`) && takes.has(`${path}.json`);
  };

  // What each cut is for: the styles its clip is missing in (or all of them, cutting
  // again), and the local copy to listen to. A word-by-word take makes only its style.
  const jobs = plans.map((plan) => ({
    plan,
    takes: plan.takes
      .map((take) => {
        const cuts = take.cuts.map((c) => {
          const styles = take.style ? [take.style] : cutStyles;
          const missing = styles.filter((st) => !clips.has(clipPath(plan, c.tile, st)));
          return { ...c, missing, styles: options.recut ? styles : missing };
        });
        const missing = cuts.some((c) => c.missing.length);
        const paid = Boolean(take.style) || voiceSentences;
        const usable = stored(take) || (missing && paid);
        return {
          take,
          cuts: usable ? cuts.filter((c) => c.styles.length || options.save) : [],
          voice: !stored(take) && missing && paid,
        };
      })
      .filter((t) => t.cuts.length),
  }));
  const work = jobs.filter((j) => j.takes.length);
  const toVoice = work.flatMap((j) => j.takes.filter((t) => t.voice));
  const characters = toVoice.reduce((n, t) => n + t.take.text.length, 0);
  const tileCount = all.reduce((n, p) => n + p.takes.reduce((m, t) => m + t.cuts.length, 0), 0);
  const missingIn = (style: TileStyle) =>
    plans.reduce(
      (n, p) =>
        n +
        new Set(
          p.takes
            .filter((t) => (t.style ? t.style === style : !tileStyle(style).words))
            .flatMap((t) => t.cuts.map((c) => c.tile))
            .filter((tile) => !clips.has(clipPath(p, tile, style))),
        ).size,
      0,
    );

  // Every clip and take any style could use: takes are paid for, so pruning keeps them all.
  const everyTake = all.flatMap((p) => [
    ...p.takes,
    ...styleNames.filter((st) => tileStyle(st).words).map((st) => wordByWordTake(p, st)),
  ]);
  const wantedTakes = new Set(everyTake.flatMap((t) => [".mp3", ".json"].map((ext) => cache.takeCachePath(t.text) + ext)));
  const wantedClips = new Set(
    all.flatMap((p) => p.takes.flatMap((t) => t.cuts.flatMap((c) => styleNames.map((st) => clipPath(p, c.tile, st))))),
  );
  const unused = [...[...clips].filter((path) => !wantedClips.has(path)), ...oldClips];
  const unusedTakes = [...takes].filter((path) => !wantedTakes.has(path));

  console.log(`\nword tiles: ${all.length} exercises · ${tileCount} tiles · lessons play ${LESSON_TILE_STYLE ?? "the words' own clips"}`);
  if (options.only.length) console.log(`only ${options.only.join(", ")}: ${plans.length} exercises`);
  console.log(`clips missing: ${wanted.map((st) => `${st} ${missingIn(st)}`).join(" · ")}${options.recut ? " · cutting the rest again" : ""}`);
  console.log(`takes to voice: ${toVoice.length} · characters to generate: ${characters.toLocaleString("en")}`);
  if (Number.isFinite(options.budget)) console.log(`budget: ${options.budget.toLocaleString("en")} characters, re-voices included`);
  console.log(
    `unused in cache: ${unused.length} clips (${oldClips.size} in the old tiles/), ${unusedTakes.length / 2} takes${options.prune ? " (will be deleted)" : ""}`,
  );
  if (options.dryRun) return 0;

  const tmp = await mkdtemp(join(tmpdir(), "slovko-tiles-"));
  const page = new Map<string, string>();
  let failed = 0;
  let done = 0;
  let spent = 0;
  const queue = [...work];

  /** Voices a take, within the budget. */
  async function voiceTake(text: string, seed: number) {
    if (spent + text.length > options.budget) throw new Error(`over the budget of ${options.budget} characters`);
    spent += text.length;
    return withRetries(() => synthesizeWithTimings(text, seed));
  }

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
      // Stored before cutting, so a failed cut never costs the take again.
      const storeTake = async (audio: ArrayBuffer, alignment: Alignment) => {
        await cache.storeCached(`${path}.mp3`, audio, "audio/mpeg");
        await cache.storeCached(`${path}.json`, Buffer.from(JSON.stringify(alignment)), "application/json");
      };
      let audio: ArrayBuffer | null;
      let alignment: Alignment;
      if (voice) {
        ({ audio, alignment } = await voiceTake(take.text, 1));
        await storeTake(audio, alignment);
      } else {
        audio = await cache.readCached(`${path}.mp3`);
        const json = await cache.readCached(`${path}.json`);
        if (!audio || !json) throw new Error(`take "${take.text}" is listed but can't be read`);
        alignment = JSON.parse(Buffer.from(json).toString());
      }

      let words: Word[];
      try {
        words = wordTimes(take.text, alignment);
      } catch (err) {
        failed++;
        console.error(`✗ ${plan.key} "${take.text}": ${(err as Error).message}`);
        continue;
      }
      const wanted = cuts.map((c) => c.word);
      let cut = cutWords(await decode(audio), words, wanted, Boolean(take.style));
      // Words said one at a time that ran together: another seed, keeping the better take.
      for (let seed = 2; take.style && ranTogether(cut) && (voice || options.revoice) && seed <= 1 + REVOICES; seed++) {
        if (spent + take.text.length > options.budget) {
          console.error(`  not voiced again (budget): "${take.text}"`);
          break;
        }
        const again = await voiceTake(take.text, seed);
        let againCut: Clip[];
        try {
          againCut = cutWords(await decode(again.audio), wordTimes(take.text, again.alignment), wanted, true);
        } catch {
          continue;
        }
        const better = ranTogether(againCut) < ranTogether(cut);
        console.log(`  voiced again (seed ${seed}): "${take.text}" ran together ${ranTogether(cut)} → ${ranTogether(againCut)}${better ? ", kept" : ""}`);
        if (better) {
          ({ audio, alignment } = again);
          cut = againCut;
          await storeTake(audio, alignment);
        }
      }
      await save(`take-${t}.mp3`, Buffer.from(audio), `<i>${html(take.text)}</i>`);

      for (const [i, { tile, word, styles }] of cuts.entries()) {
        const clip = cut[i];
        const short = clip.problem?.startsWith("too short") ?? false;
        if (clip.problem) {
          failed++;
          console.error(`✗ ${plan.key} "${tile}" in "${take.text}": ${clip.problem}`);
        }
        // A clip that failed is never kept (an older one is removed), except a word too
        // short for lessons, which dev mode still compares in the other cut styles.
        const keep = styles.filter((st) => !clip.problem || (short && !take.style && st !== LESSON_TILE_STYLE));
        const stale = styles.filter((st) => !keep.includes(st) && clips.has(clipPath(plan, tile, st)));
        if (stale.length) await cache.removeCachedPaths(stale.map((st) => clipPath(plan, tile, st)));
        let kept: Buffer | undefined;
        for (const style of keep) {
          const mp3 = await encode(clip.samples, tmp, style);
          await cache.storeCached(clipPath(plan, tile, style), mp3, "audio/mpeg");
          kept ??= mp3;
        }
        if (kept && !clip.problem) {
          await save(`${t}-${word}-${tile}.mp3`, kept, `<b>${html(tile)}</b> ${clip.seconds.toFixed(2)} s`);
        }
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
  console.log(`word tiles: ${done} exercises done, ${failed} failed · characters spent: ${spent.toLocaleString("en")}`);
  return failed;
}

function html(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}
