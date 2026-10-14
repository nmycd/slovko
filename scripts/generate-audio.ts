// Pre-generates every course phrase with ElevenLabs into the Supabase
// Storage cache that /api/tts serves from.
//
//   npm run generate:audio -- --dry-run   # what's missing and how many characters it costs
//   npm run generate:audio                # generate missing clips (safe to re-run; resumes)
//   npm run generate:audio -- --prune     # also delete clips no longer used
//                                         # (old voice/model, removed phrases)
//
// Refuses to spend credits on the placeholder voice: set ELEVENLABS_VOICE_ID first.

import { loadEnvConfig } from "@next/env";

// Must run before importing modules that read the environment when loaded.
loadEnvConfig(process.cwd());

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const prune = args.has("--prune");
const CONCURRENCY = 3;
const MAX_ATTEMPTS = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const { speakableSet } = await import("../src/lib/course");
  const { ElevenLabsError, isElevenLabsConfigured, ttsModel, voiceId } = await import(
    "../src/lib/elevenlabs"
  );
  const cache = await import("../src/lib/tts-cache");

  if (!cache.isTtsCacheConfigured()) throw new Error("Supabase (URL + secret key) is not configured.");
  if (!isElevenLabsConfigured()) throw new Error("ELEVENLABS_API_KEY is not set.");

  const phrases = [...speakableSet];
  const cached = await cache.listCachedPaths();
  const missing = phrases.filter((text) => !cached.has(cache.ttsCachePath(text)));
  const wanted = new Set(phrases.map(cache.ttsCachePath));
  const unused = [...cached].filter((path) => !wanted.has(path));
  const characters = missing.reduce((n, text) => n + text.length, 0);

  console.log(`voice ${voiceId} · model ${ttsModel}`);
  console.log(`${phrases.length} phrases · ${phrases.length - missing.length} cached · ${missing.length} missing`);
  console.log(`characters to generate: ${characters.toLocaleString("en")}`);
  console.log(`unused clips in cache: ${unused.length}${prune ? " (will be deleted)" : ""}`);
  if (dryRun) return;

  if (!process.env.ELEVENLABS_VOICE_ID) {
    throw new Error("Set ELEVENLABS_VOICE_ID to the chosen Slovak voice before generating.");
  }

  let done = 0;
  let failed = 0;
  const queue = [...missing];

  async function worker() {
    for (let text = queue.shift(); text !== undefined; text = queue.shift()) {
      for (let attempt = 1; ; attempt++) {
        try {
          await cache.generateAndCache(text);
          done++;
          console.log(`[${String(done).padStart(4)}/${missing.length}] ${text}`);
          break;
        } catch (err) {
          const status = err instanceof ElevenLabsError ? err.status : 0;
          const retryable = status === 0 || status === 429 || status >= 500;
          if (!retryable || attempt >= MAX_ATTEMPTS) {
            failed++;
            console.error(`✗ ${text}: ${(err as Error).message}`);
            break;
          }
          await sleep(1000 * 2 ** attempt);
        }
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (prune) {
    await cache.removeCachedPaths(unused);
    console.log(`deleted ${unused.length} unused clips`);
  }
  console.log(`\ngenerated ${done}, failed ${failed}`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
