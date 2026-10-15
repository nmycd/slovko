import type { Metadata } from "next";
import { CourseComingSoon } from "@/components/course-coming-soon";

export const metadata: Metadata = { title: "A2" };

export default function A2Page() {
  return <CourseComingSoon title="courses.a2.title" body="courses.a2.body" />;
}
