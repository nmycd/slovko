import {
  isTileStyle,
  LESSON_TILE_STYLE,
  singleWords,
  speakableSet,
  tileExercises,
  tileWords,
  WORD_CLIPS,
} from "@/lib/course";
import { isElevenLabsConfigured } from "@/lib/elevenlabs";
import {
  generateAndCache,
  liveGenerationEnabled,
  readCached,
  readCachedAudio,
  tileCachePath,
  wordCachePath,
} from "@/lib/tts-cache";

// GET /api/tts?text=Dobrý%20deň.
// GET /api/tts?text=je&in=u3-l1%23build-kde-je-kupelna&v=3  (a word tile in its exercise;
//   `v` only busts browser caches when the clips are made again)
// GET /api/tts?text=je&in=…&style=a  (dev mode: the tile in one of `tileStyles`, no fallback)
// GET /api/tts?text=ma&v=1  (a single word: its clip from a take of words said one at a time)
// Only course phrases are accepted, and a tile only in its own exercise. Audio comes
// from the Supabase Storage cache (filled ahead of time by `npm run generate:audio`); a
// missing phrase is generated on the fly unless TTS_LIVE_GENERATION=false. A tile plays
// its clip in `LESSON_TILE_STYLE`, or the word's own clip until that's made; tile clips
// are never generated here. Phrase responses are immutable so browsers cache them too.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const text = params.get("text") ?? "";
  const exercise = params.get("in");
  const style = params.get("style");

  if (exercise !== null) {
    const ex = tileExercises.get(exercise);
    if (!ex || !tileWords(ex).includes(text) || (style !== null && !isTileStyle(style))) {
      return Response.json({ error: "Unknown tile" }, { status: 400 });
    }
    if (style !== null) {
      const clip = await readCached(tileCachePath(exercise, ex.answers[0], text, style));
      return clip
        ? audio(clip, "public, max-age=604800")
        : Response.json({ error: "Not cut in this style" }, { status: 404 });
    }
    const clip = LESSON_TILE_STYLE && (await readCached(tileCachePath(exercise, ex.answers[0], text, LESSON_TILE_STYLE)));
    // Kept a week, not forever: a sentence that changes keeps its URL.
    if (clip) return audio(clip, "public, max-age=604800");
  }

  if (!speakableSet.has(text)) {
    return Response.json({ error: "Unknown phrase" }, { status: 400 });
  }
  // A single word said one at a time, cut from a take of several.
  const word = exercise === null && WORD_CLIPS && singleWords.has(text);
  if (word) {
    const clip = await readCached(wordCachePath(text));
    if (clip) return audio(clip, "public, max-age=604800");
  }
  let clip = await readCachedAudio(text);
  if (!clip) {
    if (!isElevenLabsConfigured() || !liveGenerationEnabled()) {
      // The client falls back to the browser's speech synthesis.
      return Response.json({ error: "Audio not available" }, { status: 503 });
    }
    try {
      clip = await generateAndCache(text);
    } catch (err) {
      console.error(err);
      return Response.json({ error: "TTS failed" }, { status: 502 });
    }
  }
  // A stand-in for a tile's or a word's own clip is kept an hour, so that one takes over soon.
  return audio(clip, exercise !== null || word ? "public, max-age=3600" : "public, max-age=31536000, immutable");
}

function audio(clip: ArrayBuffer, cacheControl: string): Response {
  return new Response(clip, { headers: { "content-type": "audio/mpeg", "cache-control": cacheControl } });
}
