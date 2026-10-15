import { dictionary } from "@/lib/course";

// GET /api/dictionary: every word, phrase and grammar card for the search on /learn.
// It reads no request data, so it's prerendered at build time; the search box fetches
// it when first used, so /learn itself stays light.
export function GET() {
  return Response.json(dictionary);
}
