import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GrammarCards } from "@/components/grammar/grammar-review";
import { allLessons, findLesson, lessonVariants } from "@/lib/course";
import type { GrammarExercise } from "@/lib/course/types";
import { locales, type Locale } from "@/lib/i18n/locales";

// Grammar review: a grammar lesson's teaching cards, read again (the list of every
// grammar lesson is the layout's).
export function generateStaticParams() {
  return allLessons.filter((l) => l.kind === "grammar").map((l) => ({ lessonId: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/grammar/[lessonId]">): Promise<Metadata> {
  const found = findLesson((await params).lessonId);
  return { title: found ? `${found.lesson.title} (${found.lesson.titleEn})` : "Grammar review" };
}

export default function GrammarPage({ params }: PageProps<"/grammar/[lessonId]">) {
  return (
    <Suspense>
      <Grammar params={params} />
    </Suspense>
  );
}

async function Grammar({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const found = findLesson(lessonId);
  const variants = lessonVariants(lessonId);
  if (!found || !variants || found.lesson.kind !== "grammar") notFound();
  // Only the lesson's teaching cards: its drills need answering, and this page checks nothing.
  const cards = Object.fromEntries(
    locales.map((locale) => [
      locale,
      variants[locale].exercises.filter((ex): ex is GrammarExercise => ex.type === "grammar"),
    ]),
  ) as Record<Locale, GrammarExercise[]>;
  return (
    <GrammarCards level={found.course.level} premiumUnit={found.unit.premium} cards={cards} />
  );
}
