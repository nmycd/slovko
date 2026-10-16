// ElevenLabs REST calls. Server only: the API key must never reach the browser.

const API = "https://api.elevenlabs.io/v1";

export const ttsModel = process.env.ELEVENLABS_TTS_MODEL ?? "eleven_multilingual_v2";
export const sttModel = process.env.ELEVENLABS_STT_MODEL ?? "scribe_v2";
// Pick a voice that sounds natural in Slovak from the ElevenLabs Voice Library.
export const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

function apiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  return key;
}

export class ElevenLabsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function speechRequest(text: string, extra: object = {}): RequestInit {
  return {
    method: "POST",
    headers: { "xi-api-key": apiKey(), "content-type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: ttsModel,
      // multilingual_v2 detects the language itself and doesn't take language_code.
      ...(ttsModel.includes("multilingual_v2") ? {} : { language_code: "sk" }),
      voice_settings: { stability: 0.6, similarity_boost: 0.75, speed: 0.9 },
      ...extra,
    }),
  };
}

/** Slovak text → MP3 bytes. */
export async function synthesize(text: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, speechRequest(text));
  if (!res.ok) throw new ElevenLabsError(`TTS failed: ${await res.text()}`, res.status);
  return res.arrayBuffer();
}

/** When each character of a take is said, in seconds. */
export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

/**
 * Slovak text → MP3 bytes and each character's timing, for cutting words out (see
 * scripts/tile-audio.ts). A fixed seed keeps a sentence's takes as alike as it can.
 */
export async function synthesizeWithTimings(text: string): Promise<{ audio: ArrayBuffer; alignment: Alignment }> {
  const res = await fetch(
    `${API}/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
    speechRequest(text, { seed: 1 }),
  );
  if (!res.ok) throw new ElevenLabsError(`TTS failed: ${await res.text()}`, res.status);
  const data = (await res.json()) as { audio_base64: string; alignment: Alignment | null };
  if (!data.alignment) throw new Error("TTS returned no timings");
  const bytes = Buffer.from(data.audio_base64, "base64");
  return { audio: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), alignment: data.alignment };
}

/**
 * Runs an ElevenLabs call, retrying rate limits, server errors and network failures
 * (for scripts). Anything else fails at once, so a bad reply isn't paid for again.
 */
export async function withRetries<T>(call: () => Promise<T>, attempts = 5): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (err) {
      const retryable =
        err instanceof ElevenLabsError ? err.status === 429 || err.status >= 500 : err instanceof TypeError;
      if (!retryable || attempt >= attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
}

/**
 * Recorded audio → transcript, transcribed as Slovak. `keyterms` are words and short
 * phrases the speaker is likely to say: the recogniser leans towards them (a learner's
 * accent can otherwise turn a word into a similar-sounding one), at 20% more cost.
 */
export async function transcribe(audio: Blob, keyterms: string[] = []): Promise<string> {
  const form = new FormData();
  form.append("model_id", sttModel);
  form.append("language_code", "sk");
  form.append("tag_audio_events", "false");
  keyterms.forEach((term) => form.append("keyterms", term));
  form.append("file", audio, `speech.${extensionFor(audio.type)}`);
  const res = await fetch(`${API}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": apiKey() },
    body: form,
  });
  if (!res.ok) throw new ElevenLabsError(`STT failed: ${await res.text()}`, res.status);
  const data = (await res.json()) as { text?: string };
  return data.text?.trim() ?? "";
}

/**
 * Keyterms for an expected answer: the phrase itself (if it's short enough to be one:
 * at most five words) and its words of two letters or more. Keyterms may not contain
 * punctuation.
 */
export function keytermsFor(expected: string): string[] {
  const words = expected
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const phrase = words.length > 1 && words.length <= 5 ? [words.join(" ")] : [];
  return [...new Set([...phrase, ...words.filter((w) => w.length >= 2)])];
}

/** File extension for a recording's MIME type (Chrome records webm, Safari mp4). */
function extensionFor(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}
