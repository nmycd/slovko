import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutBanner } from "@/components/checkout-banner";
import { CoursePath } from "@/components/course-path";
import { courseOutlines } from "@/lib/course";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <>
      {/* The banner reads ?checkout= from the URL, which is request-time data. */}
      <Suspense>
        <CheckoutBanner />
      </Suspense>
      <CoursePath outlines={courseOutlines} />
    </>
  );
}
