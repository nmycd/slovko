import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/env";

// Keeps the Supabase auth session fresh: refreshes an expired access token
// and writes the new cookies onto both the request and the response.
// Also sends signed-out visitors from lessons and reviews to the sign-in page, and
// signed-in users from the landing page to their learning path.
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // getClaims verifies the JWT locally and refreshes it when expired.
  const { data } = await supabase.auth.getClaims();

  const signedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    // Keep any cookies Supabase just cleared or refreshed.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // Signed-in users skip the landing page.
  if (signedIn && pathname === "/") return redirectTo(new URL("/learn", request.url));

  if (!signedIn && (pathname.startsWith("/lesson/") || pathname === "/review")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return redirectTo(login);
  }
  return response;
}

export const config = {
  matcher: [
    // Skip static files, images and the Stripe webhook (it has no session).
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)",
  ],
};
