import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticePlayer } from "@/components/practice/practice-player";
import { courses, localizedCourses } from "@/lib/course";
import { locales, type Locale } from "@/lib/i18n/locales";
import type { LessonOrder, PracticeItem, PracticeKind } from "@/lib/practice";

// Extra practice: writing (the course's dictations) and pronunciation (its speaking
// exercises), ten at a time from lessons the learner has met (see lib/practice).
const kinds = { writing: "listen", pronunciation: "speak" } as const;

export function generateStaticParams() {
  return Object.keys(kinds).map((kind) => ({ kind }));
}

export async function generateMetadata({ params }: PageProps<"/practice/[kind]">): Promise<Metadata> {
  const { kind } = await params;
  return { title: kind === "pronunciation" ? "Pronunciation practice" : "Writing practice" };
}

/** Every lesson in course order, and the pool of one kind's exercises in it. */
function pool(kind: PracticeKind): { order: LessonOrder; items: PracticeItem[] } {
  const type = kinds[kind];
  const lessons = courses.flatMap((c) =>
    localizedCourses[c.id].en.flatMap((u, ui) =>
      u.lessons.map((lesson, li) => ({ lesson, course: c.id, ui, li })),
    ),
  );
  const items = lessons.flatMap(({ lesson, course, ui, li }, at) =>
    lesson.exercises.flatMap((ex, ei) => {
      if (ex.type !== type) return [];
      // The same exercise in each language, for its meaning.
      const en = Object.fromEntries(
        locales.map((locale) => {
          const same = localizedCourses[course][locale][ui].lessons[li].exercises[ei];
          return [locale, "en" in same ? same.en : ""];
        }),
      ) as Record<Locale, string>;
      return [{ id: ex.id, lessonId: lesson.id, at, sk: ex.sk, en }];
    }),
  );
  return { order: lessons.map(({ lesson }) => ({ id: lesson.id, writing: lesson.kind === "writing" })), items };
}

export default async function PracticePage({ params }: PageProps<"/practice/[kind]">) {
  const { kind } = await params;
  if (!(kind in kinds)) notFound();
  const { order, items } = pool(kind as PracticeKind);
  return <PracticePlayer kind={kind as PracticeKind} order={order} items={items} />;
}
