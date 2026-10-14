import { isSupabaseConfigured } from "@/lib/env";
import { isElevenLabsConfigured, transcribe } from "@/lib/elevenlabs";
import { consumeSttQuota } from "@/lib/stt-quota";
import { getCurrentUser } from "@/lib/supabase/server";

const MAX_BYTES = 2 * 1024 * 1024; // ~1 minute of opus audio; answers are a few seconds.

// POST /api/stt  (multipart: audio=<Blob>) → { text }
export async function POST(request: Request) {
  if (!isElevenLabsConfigured()) {
    return Response.json({ error: "STT not configured" }, { status: 503 });
  }
  // Speech-to-text costs money per call, so require an account once auth exists.
  const user = isSupabaseConfigured ? await getCurrentUser() : null;
  if (isSupabaseConfigured && !user) {
    return Response.json({ error: "Sign in to use speaking exercises" }, { status: 401 });
  }

  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return Response.json({ error: "Missing audio" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return Response.json({ error: "Recording too long" }, { status: 413 });
  }
  if (user && !(await consumeSttQuota(user.id))) {
    return Response.json(
      { error: "Speaking practice is resting for today. Try again tomorrow, or skip this one." },
      { status: 429 },
    );
  }

  try {
    return Response.json({ text: await transcribe(audio) });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }
}
