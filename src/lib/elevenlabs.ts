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

/** Slovak text → MP3 bytes. */
export async function synthesize(text: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": apiKey(), "content-type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: ttsModel,
      // multilingual_v2 detects the language itself and doesn't take language_code.
      ...(ttsModel.includes("multilingual_v2") ? {} : { language_code: "sk" }),
      voice_settings: { stability: 0.6, similarity_boost: 0.75, speed: 0.9 },
    }),
  });
  if (!res.ok) throw new ElevenLabsError(`TTS failed: ${await res.text()}`, res.status);
  return res.arrayBuffer();
}

/** Recorded audio → transcript, transcribed as Slovak. */
export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append("model_id", sttModel);
  form.append("language_code", "sk");
  form.append("tag_audio_events", "false");
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

/** File extension for a recording's MIME type (Chrome records webm, Safari mp4). */
function extensionFor(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}
