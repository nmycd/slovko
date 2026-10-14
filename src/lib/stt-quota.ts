import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Hidden caps on speech-to-text, which costs money per call. Learners never
// see a counter; past the cap they get a friendly "try tomorrow" message.
const DAILY_LIMIT = Number(process.env.STT_DAILY_LIMIT ?? 100); // per user per day
const MONTHLY_LIMIT = Number(process.env.STT_MONTHLY_LIMIT ?? 20000); // all users, per calendar month

/** Counts one transcription for the user; false if a cap is reached. */
export async function consumeSttQuota(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return true; // no database (local guest mode): nothing to count against
  const { data, error } = await admin.rpc("consume_stt", {
    p_user: userId,
    p_daily_limit: DAILY_LIMIT,
    p_monthly_limit: MONTHLY_LIMIT,
  });
  if (error) {
    // Fail closed: without a working counter we can't bound the cost.
    console.error("STT quota check failed:", error.message);
    return false;
  }
  return data === true;
}
