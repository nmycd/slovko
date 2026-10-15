import { after } from "next/server";
import { checkSpoken } from "@/lib/answers";
import { speakTargets } from "@/lib/course";
import { properNames } from "@/lib/course/names";
import { isSupabaseConfigured } from "@/lib/env";
import { isElevenLabsConfigured, keytermsFor, sttModel, transcribe } from "@/lib/elevenlabs";
import { logSpeechAttempt } from "@/lib/stt-log";
import { consumeSttQuota } from "@/lib/stt-quota";
import { getCurrentUser } from "@/lib/supabase/server";

const MAX_BYTES = 2 * 1024 * 1024; // ~1 minute of 16 kHz WAV; answers are a few seconds.

// POST /api/stt  (multipart: audio=<Blob>, expected=<the exercise's sentence>, peak=<0–1>) → { text }
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
  // What the learner was asked to say: only a speaking exercise's sentence counts.
  const expected = form.get("expected");
  const target = typeof expected === "string" && speakTargets.has(expected) ? expected : null;
  if (user && !(await consumeSttQuota(user.id))) {
    return Response.json(
      { error: "Speaking practice is resting for today. Try again tomorrow, or skip this one." },
      { status: 429 },
    );
  }

  try {
    const keyterms = target ? keytermsFor(target) : [];
    const text = await transcribe(audio, keyterms);
    if (user && target) {
      const peak = Number(form.get("peak"));
      const userAgent = request.headers.get("user-agent");
      after(() =>
        logSpeechAttempt({
          user_id: user.id,
          expected: target,
          heard: text,
          result: checkSpoken(text, target, (word) => properNames.has(word)),
          model: sttModel,
          keyterms: keyterms.length > 0,
          audio_type: audio.type,
          audio_bytes: audio.size,
          peak: Number.isFinite(peak) ? peak : null,
          user_agent: userAgent,
        }),
      );
    }
    return Response.json({ text });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }
}
