import { reviewDeck } from "@/lib/course";

// GET /api/review-deck: every card spaced-repetition review can draw on. It reads
// no request data, so it's prerendered at build time; review screens fetch it.
export function GET() {
  return Response.json(reviewDeck);
}
