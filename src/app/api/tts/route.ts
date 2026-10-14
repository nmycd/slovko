import { createHash } from "node:crypto";
import { speakableSet } from "@/lib/course";
import { isElevenLabsConfigured, synthesize, ttsModel, voiceId } from "@/lib/elevenlabs";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const BUCKET = "tts";

// GET /api/tts?text=Dobrý%20deň.
// Only course phrases are accepted. Generated audio is cached in Supabase
// Storage (when configured) so each phrase is paid for once, and the
// response is immutable so browsers cache it too.
export async function GET(request: Request) {
  const text = new URL(request.url).searchParams.get("text") ?? "";
  if (!speakableSet.has(text)) {
    return Response.json({ error: "Unknown phrase" }, { status: 400 });
  }
  if (!isElevenLabsConfigured()) {
    return Response.json({ error: "TTS not configured" }, { status: 503 });
  }

  const key = createHash("sha256").update(`${voiceId}|${ttsModel}|${text}`).digest("hex");
  const path = `${key}.mp3`;
  const storage = getSupabaseAdmin()?.storage.from(BUCKET);

  let audio: ArrayBuffer | null = null;
  if (storage) {
    const { data } = await storage.download(path);
    if (data) audio = await data.arrayBuffer();
  }
  if (!audio) {
    try {
      audio = await synthesize(text);
    } catch (err) {
      console.error(err);
      return Response.json({ error: "TTS failed" }, { status: 502 });
    }
    if (storage) {
      const { error } = await storage.upload(path, audio, { contentType: "audio/mpeg", upsert: true });
      if (error) console.error("TTS cache upload failed:", error.message);
    }
  }

  return new Response(audio, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
