import type { CheckResult } from "@/lib/answers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// A log of speaking answers: what the learner was asked to say, what speech-to-text
// heard and how it was graded (no audio), to find where speaking practice goes wrong.
// Only the service role writes or reads it (see supabase/migrations/0007).

export type SpeechAttempt = {
  user_id: string;
  expected: string;
  heard: string;
  result: CheckResult;
  model: string;
  keyterms: boolean;
  audio_type: string;
  audio_bytes: number;
  peak: number | null;
  user_agent: string | null;
};

export async function logSpeechAttempt(attempt: SpeechAttempt) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const { error } = await admin
    .from("stt_attempts")
    .insert({ ...attempt, correct: attempt.result.correct });
  if (error) console.error("Logging a speech attempt failed:", error.message);
}
