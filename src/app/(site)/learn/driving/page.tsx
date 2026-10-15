import type { Metadata } from "next";
import { CourseComingSoon } from "@/components/course-coming-soon";

export const metadata: Metadata = { title: "Driving exam" };

export default function DrivingPage() {
  return <CourseComingSoon title="courses.driving.title" body="courses.driving.body" />;
}
