// Course audio cache in Supabase Storage. Shared by /api/tts and
// scripts/generate-audio.ts, so both agree on where a phrase's clip lives.
import { createHash } from "node:crypto";
import { synthesize, ttsModel, voiceId } from "@/lib/elevenlabs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const TTS_BUCKET = "tts";

/** Storage path of a phrase's clip. Changes when the voice or model changes. */
export function ttsCachePath(text: string): string {
  return `${createHash("sha256").update(`${voiceId}|${ttsModel}|${text}`).digest("hex")}.mp3`;
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

export async function readCachedAudio(text: string): Promise<ArrayBuffer | null> {
  const storage = bucket();
  if (!storage) return null;
  const { data } = await storage.download(ttsCachePath(text));
  return data ? data.arrayBuffer() : null;
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

/** Every clip currently in the cache (paths). */
export async function listCachedPaths(): Promise<Set<string>> {
  const storage = bucket();
  const paths = new Set<string>();
  if (!storage) return paths;
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.list("", { limit: 1000, offset });
    if (error) throw new Error(`Listing TTS cache failed: ${error.message}`);
    data.forEach((f) => paths.add(f.name));
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
