// Public config (inlined into the client bundle). Every service is optional
// in development: without Supabase the app runs in guest mode, without
// ElevenLabs it falls back to the browser's speech synthesis.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

/** Testing switch: every lesson opens, ignoring lesson order and Premium. Never set it in production. */
export const unlockAllLessons = process.env.NEXT_PUBLIC_UNLOCK_ALL_LESSONS === "true";

/** Absolute site URL for redirects (Stripe, auth emails). */
export function siteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return request ? new URL(request.url).origin : "http://localhost:3000";
}
