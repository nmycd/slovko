import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import {
  allLessons,
  findLesson,
  lessonVariants,
  nextLessonId,
} from "@/lib/course";
import { lessonIllustrations } from "@/lib/course/illustrations";

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
      lessons={variants}
      premiumUnit={found.unit.premium}
      nextId={nextLessonId(lessonId)}
      pictures={lessonIllustrations(lessonId)}
    />
  );
}
