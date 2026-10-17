import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import {
  allLessons,
  courseLessons,
  findLesson,
  lessonVariants,
  nextLessonId,
} from "@/lib/course";
import { lessonIllustrations } from "@/lib/course/illustrations";

// Every course's lessons, those of a course not launched yet too: the player keeps
// those to dev-mode accounts.
export function generateStaticParams() {
  return allLessons.map((l) => ({ lessonId: l.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/lesson/[lessonId]">): Promise<Metadata> {
  const found = findLesson((await params).lessonId);
  return {
    title: found ? `${found.lesson.title} (${found.lesson.titleEn})` : "Lesson",
  };
}

export default function LessonPage({
  params,
}: PageProps<"/lesson/[lessonId]">) {
  // Reading params inside Suspense keeps client navigation to a lesson instant.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const found = findLesson(lessonId);
  const variants = lessonVariants(lessonId);
  if (!found || !variants) notFound();
  // Only this lesson is sent to the browser, in each native language.
  return (
    <LessonPlayer
      course={found.course.id}
      lessons={variants}
      premiumUnit={found.unit.premium}
      nextId={nextLessonId(lessonId)}
      pictures={lessonIllustrations(lessonId)}
      place={{
        unit: found.unit.number,
        lesson: found.unit.lessons.findIndex((l) => l.id === lessonId) + 1,
      }}
      // The course's progress leaves out the optional writing lessons.
      courseLessonIds={courseLessons(found.course.id).filter((l) => l.kind !== "writing").map((l) => l.id)}
    />
  );
}
