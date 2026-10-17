import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GrammarReview, type GrammarUnit } from "@/components/grammar/grammar-review";
import { allLessons, courseOutlines, findLesson, lessonVariants } from "@/lib/course";
import { lessonIllustrations } from "@/lib/course/illustrations";
import type { GrammarExercise } from "@/lib/course/types";
import { locales, type Locale } from "@/lib/i18n/locales";

// Grammar review: a grammar lesson's teaching cards, read again, beside every grammar
// lesson of its course.
export function generateStaticParams() {
  return allLessons.filter((l) => l.kind === "grammar").map((l) => ({ lessonId: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/grammar/[lessonId]">): Promise<Metadata> {
  const found = findLesson((await params).lessonId);
  return { title: found ? `${found.lesson.title} (${found.lesson.titleEn})` : "Grammar review" };
}

export default function GrammarPage({ params }: PageProps<"/grammar/[lessonId]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Grammar params={params} />
    </Suspense>
  );
}

async function Grammar({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const found = findLesson(lessonId);
  const variants = lessonVariants(lessonId);
  if (!found || !variants || found.lesson.kind !== "grammar") notFound();
  const outlines = courseOutlines[found.course.id];
  const pick = <T,>(of: (locale: Locale) => T) =>
    Object.fromEntries(locales.map((locale) => [locale, of(locale)])) as Record<Locale, T>;
  // Only the lesson's teaching cards: its drills need answering, and this page checks nothing.
  const cards = pick((locale) =>
    variants[locale].exercises.filter((ex): ex is GrammarExercise => ex.type === "grammar"),
  );
  // The course's grammar lessons in order, by unit (units without one left out).
  const units = pick((locale): GrammarUnit[] =>
    outlines[locale]
      .map((u) => ({
        number: u.number,
        premium: u.premium,
        lessons: u.lessons.filter((l) => l.kind === "grammar").map(({ id, title, titleEn }) => ({ id, title, titleEn })),
      }))
      .filter((u) => u.lessons.length > 0),
  );
  const pictures = lessonIllustrations(lessonId);
  return (
    <GrammarReview
      course={found.course.id}
      lessonId={lessonId}
      premiumUnit={found.unit.premium}
      cards={cards}
      units={units}
      pictures={Object.fromEntries(cards.en.filter((c) => pictures[c.id]).map((c) => [c.id, pictures[c.id]]))}
      place={{
        unit: found.unit.number,
        lesson: found.unit.lessons.findIndex((l) => l.id === lessonId) + 1,
      }}
    />
  );
}
