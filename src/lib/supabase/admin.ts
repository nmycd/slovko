import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/env";

let admin: SupabaseClient | null = null;

/**
 * Service-role client that bypasses RLS. Server only: webhooks, TTS cache,
 * usage caps. Has no request context, so scripts can use it too.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secret) return null;
  admin ??= createClient(supabaseUrl, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
