import type { Metadata } from "next";
import { CoursePage } from "@/components/course-page";
import { courseOutlines } from "@/lib/course";

export const metadata: Metadata = { title: "A2" };

export default function A2Page() {
  return <CoursePage course="a2" outlines={courseOutlines.a2} />;
}
