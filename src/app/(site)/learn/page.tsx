import type { Metadata } from "next";
import { CoursePath } from "@/components/course-path";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return <CoursePath />;
}
