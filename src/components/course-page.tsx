"use client";

import { useApp } from "@/components/app-provider";
import { CourseComingSoon } from "@/components/course-coming-soon";
import { CoursePath } from "@/components/course-path";
import { courseById, courseOpen, type CourseId } from "@/lib/course/courses";
import type { UnitOutline } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n";

/**
 * A course tab after A1: its learning path, or while the course isn't launched, its
 * "coming soon" page, which only dev-mode accounts see past (see `Course.launched`).
 */
export function CoursePage({ course, outlines }: { course: CourseId; outlines: Record<Locale, UnitOutline[]> }) {
  const { dev } = useApp();
  const info = courseById(course);
  if (courseOpen(info, dev)) return <CoursePath course={course} outlines={outlines} />;
  return info.soon ? <CourseComingSoon title={info.soon.title} body={info.soon.body} /> : null;
}
