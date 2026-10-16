// Pre-generates every course phrase with ElevenLabs into the Supabase
// Storage cache that /api/tts serves from, then the word tiles' clips in the style
// lessons play (scripts/tile-audio.ts).
//
//   npm run generate:audio -- --dry-run   # what's missing and how many characters it costs
//   npm run generate:audio                # generate missing clips (safe to re-run; resumes)
//   npm run generate:audio -- --prune     # also delete clips no longer used
//                                         # (old voice/model, removed phrases)
//
// Word tiles only:
//   --tiles-only                          # skip the phrases
//   --only u3-,u1-l3#build-volam-sa-tomas # just these exercises (key prefixes)
//   --styles                              # also cut every clip in styles A–D for dev mode (free)
//   --styles e1                           # …or in these styles; E1 and E2 voice the words one by one ($)
//   --recut                               # cut every clip again from its stored take (free)
//   --revoice                             # voice again stored word-by-word takes that ran words together ($)
//   --budget 7000                         # voice nothing more after this many characters
//   --save <dir>                          # also write takes and clips there, with a page to listen on
//
// Refuses to spend credits on the placeholder voice: set ELEVENLABS_VOICE_ID first.

import { loadEnvConfig } from "@next/env";
// Reads no environment, so it may load first.
import { isTileStyle, tileStyle, tileStyles, type TileStyle } from "../src/lib/course/helpers";

// Must run before importing modules that read the environment when loaded.
loadEnvConfig(process.cwd());

const argv = process.argv.slice(2);
const args = new Set(argv);
const value = (flag: string) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};
const dryRun = args.has("--dry-run");
const prune = args.has("--prune");
const tilesOnly = args.has("--tiles-only");
const CONCURRENCY = 3;

/** The styles `--styles` asks for: those named, or the free ones (cut from the sentence). */
function styles() {
  if (!args.has("--styles")) return [];
  const named = value("--styles");
  if (!named || named.startsWith("--")) return (Object.keys(tileStyles) as TileStyle[]).filter((s) => !tileStyle(s).words);
  const list = named.split(",");
  const unknown = list.filter((s) => !isTileStyle(s));
  if (unknown.length) throw new Error(`Unknown style: ${unknown.join(", ")}`);
  return list as TileStyle[];
}

async function main() {
  const { allLessons, speakableSet } = await import("../src/lib/course");
  const { isElevenLabsConfigured, ttsModel, voiceId, withRetries } = await import("../src/lib/elevenlabs");
  const cache = await import("../src/lib/tts-cache");
  const { generateTiles } = await import("./tile-audio");

  if (!cache.isTtsCacheConfigured()) throw new Error("Supabase (URL + secret key) is not configured.");
  if (!isElevenLabsConfigured()) throw new Error("ELEVENLABS_API_KEY is not set.");

  const phrases = [...speakableSet];
  const cached = await cache.listCachedPaths();
  const missing = tilesOnly ? [] : phrases.filter((text) => !cached.has(cache.ttsCachePath(text)));
  const wanted = new Set(phrases.map(cache.ttsCachePath));
  const unused = [...cached].filter((path) => !wanted.has(path));
  const characters = missing.reduce((n, text) => n + text.length, 0);

  console.log(`voice ${voiceId} · model ${ttsModel}`);
  if (!tilesOnly) {
    console.log(`${phrases.length} phrases · ${phrases.length - missing.length} cached · ${missing.length} missing`);
    console.log(`characters to generate: ${characters.toLocaleString("en")}`);
    console.log(`unused clips in cache: ${unused.length}${prune ? " (will be deleted)" : ""}`);
  }
  const tileOptions = {
    dryRun,
    prune,
    recut: args.has("--recut"),
    only: value("--only")?.split(",").filter(Boolean) ?? [],
    save: value("--save"),
    styles: styles(),
    revoice: args.has("--revoice"),
    budget: value("--budget") ? Number(value("--budget")) : Infinity,
  };
  if (Number.isNaN(tileOptions.budget)) throw new Error("--budget takes a number of characters.");
  if (dryRun) {
    await generateTiles(allLessons, tileOptions);
    return;
  }

  if (!process.env.ELEVENLABS_VOICE_ID) {
    throw new Error("Set ELEVENLABS_VOICE_ID to the chosen Slovak voice before generating.");
  }

  let done = 0;
  let failed = 0;
  const queue = [...missing];

  async function worker() {
    for (let text = queue.shift(); text !== undefined; text = queue.shift()) {
      try {
        await withRetries(() => cache.generateAndCache(text));
        done++;
        console.log(`[${String(done).padStart(4)}/${missing.length}] ${text}`);
      } catch (err) {
        failed++;
        console.error(`✗ ${text}: ${(err as Error).message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (prune && !tilesOnly) {
    await cache.removeCachedPaths(unused);
    console.log(`deleted ${unused.length} unused clips`);
  }
  if (!tilesOnly) console.log(`\ngenerated ${done}, failed ${failed}`);

  failed += await generateTiles(allLessons, tileOptions);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
