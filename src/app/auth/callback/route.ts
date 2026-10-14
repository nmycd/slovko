import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

// Landing point for email confirmation links and OAuth sign-in (PKCE):
// exchanges the one-time code for a session cookie, then continues.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/learn";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/learn";

  const supabase = await getSupabaseServer();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
