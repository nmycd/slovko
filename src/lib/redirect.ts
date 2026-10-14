/** A same-site path to continue to after sign-in, or the fallback. Blocks open redirects. */
export function safeNext(next: string | null | undefined, fallback = "/learn"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
