import { speakableSet } from "@/lib/course";
import { isElevenLabsConfigured } from "@/lib/elevenlabs";
import { generateAndCache, liveGenerationEnabled, readCachedAudio } from "@/lib/tts-cache";

// GET /api/tts?text=Dobrý%20deň.
// Only course phrases are accepted. Audio comes from the Supabase Storage
// cache (filled ahead of time by `npm run generate:audio`); a miss is
// generated on the fly unless TTS_LIVE_GENERATION=false. Responses are
// immutable so browsers cache them too.
export async function GET(request: Request) {
  const text = new URL(request.url).searchParams.get("text") ?? "";
  if (!speakableSet.has(text)) {
    return Response.json({ error: "Unknown phrase" }, { status: 400 });
  }

  let audio = await readCachedAudio(text);
  if (!audio) {
    if (!isElevenLabsConfigured() || !liveGenerationEnabled()) {
      // The client falls back to the browser's speech synthesis.
      return Response.json({ error: "Audio not available" }, { status: 503 });
    }
    try {
      audio = await generateAndCache(text);
    } catch (err) {
      console.error(err);
      return Response.json({ error: "TTS failed" }, { status: 502 });
    }
  }

  return new Response(audio, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
