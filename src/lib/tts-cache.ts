// Course audio cache in Supabase Storage. Shared by /api/tts and
// scripts/generate-audio.ts, so both agree on where a phrase's clip lives: phrases at
// the top level, word tiles in tile-styles/<style>/ and the takes they're cut from in
// takes/, single words in words/ and theirs in word-takes/.
import { createHash } from "node:crypto";
import type { TileStyle } from "@/lib/course/helpers";
import { synthesize, ttsModel, voiceId } from "@/lib/elevenlabs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const TTS_BUCKET = "tts";

const hash = (key: string) => createHash("sha256").update(`${voiceId}|${ttsModel}|${key}`).digest("hex");

/** Storage path of a phrase's clip. Changes when the voice or model changes. */
export function ttsCachePath(text: string): string {
  return `${hash(text)}.mp3`;
}

/**
 * Storage path of a word tile's clip in a style (see `tileStyles`), made for its own
 * exercise (`exercise`: "u3-l1#build-kde-je"). Changes when the sentence does. (The
 * first cuts, in style C, sit in tiles/, played no more.)
 */
export function tileCachePath(exercise: string, sentence: string, tile: string, style: TileStyle): string {
  return `tile-styles/${style}/${hash(`${exercise}|${sentence}|${tile}`)}.mp3`;
}

/** Storage path of a single word's clip, cut from a take of words said one at a time. */
export function wordCachePath(text: string): string {
  return `words/${hash(`word|${text}`)}.mp3`;
}

/**
 * Storage path, without extension, of a take of single words said one at a time:
 * the audio (`.mp3`) and its character timings (`.json`), which also give its words.
 */
export function wordTakePath(text: string): string {
  return `word-takes/${hash(text)}`;
}

/**
 * Storage path, without extension, of a take that tile clips are cut from: the voiced
 * sentence (`.mp3`) and its character timings (`.json`).
 */
export function takeCachePath(text: string): string {
  return `takes/${hash(text)}`;
}

function bucket() {
  return getSupabaseAdmin()?.storage.from(TTS_BUCKET) ?? null;
}

export function isTtsCacheConfigured(): boolean {
  return bucket() !== null;
}

/**
 * Whether a cache miss may call ElevenLabs. Set TTS_LIVE_GENERATION=false in
 * production once all course audio is pre-generated, so requests never cost
 * credits.
 */
export function liveGenerationEnabled(): boolean {
  return process.env.TTS_LIVE_GENERATION !== "false";
}

/** A stored file, or null when there's none. */
export async function readCached(path: string): Promise<ArrayBuffer | null> {
  const storage = bucket();
  if (!storage) return null;
  const { data } = await storage.download(path);
  return data ? data.arrayBuffer() : null;
}

export function readCachedAudio(text: string): Promise<ArrayBuffer | null> {
  return readCached(ttsCachePath(text));
}

export async function storeCached(path: string, bytes: ArrayBuffer | Buffer, contentType: string): Promise<void> {
  const storage = bucket();
  if (!storage) throw new Error("Supabase (URL + secret key) is not configured.");
  const { error } = await storage.upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`TTS cache upload failed: ${error.message}`);
}

/** Generates a phrase with ElevenLabs and stores it in the cache (if configured). */
export async function generateAndCache(text: string): Promise<ArrayBuffer> {
  const audio = await synthesize(text);
  const storage = bucket();
  if (storage) {
    const { error } = await storage.upload(ttsCachePath(text), audio, {
      contentType: "audio/mpeg",
      upsert: true,
    });
    if (error) throw new Error(`TTS cache upload failed: ${error.message}`);
  }
  return audio;
}

/** Every file currently in the cache's top level, or in `folder` ("tiles"), as paths. */
export async function listCachedPaths(folder = ""): Promise<Set<string>> {
  const storage = bucket();
  const paths = new Set<string>();
  if (!storage) return paths;
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.list(folder, { limit: 1000, offset });
    if (error) throw new Error(`Listing TTS cache failed: ${error.message}`);
    // Folders (tiles/, takes/) are listed too, without an id.
    data.filter((f) => f.id !== null).forEach((f) => paths.add(folder ? `${folder}/${f.name}` : f.name));
    if (data.length < 1000) return paths;
  }
}

export async function removeCachedPaths(paths: string[]): Promise<void> {
  const storage = bucket();
  if (!storage || paths.length === 0) return;
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await storage.remove(paths.slice(i, i + 100));
    if (error) throw new Error(`Removing old clips failed: ${error.message}`);
  }
}
