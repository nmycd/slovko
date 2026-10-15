import type { Metadata } from "next";
import { ReviewOverview } from "@/components/review/review-overview";

export const metadata: Metadata = { title: "Word review" };

export default function ReviewTabPage() {
  return <ReviewOverview />;
}
