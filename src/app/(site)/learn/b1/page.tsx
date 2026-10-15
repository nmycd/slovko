import type { Metadata } from "next";
import { CourseComingSoon } from "@/components/course-coming-soon";

export const metadata: Metadata = { title: "B1" };

export default function B1Page() {
  return <CourseComingSoon title="courses.b1.title" body="courses.b1.body" />;
}
