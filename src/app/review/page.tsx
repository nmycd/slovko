import type { Metadata } from "next";
import { ReviewPlayer } from "@/components/review/review-player";

export const metadata: Metadata = { title: "Word review" };

export default function ReviewPage() {
  return <ReviewPlayer />;
}
