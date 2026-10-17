import { CourseTabs } from "@/components/course-tabs";
import { LearnFrame } from "@/components/learn-frame";
import { courseUnits, courses, type CourseId } from "@/lib/course";

// Word review opens once one of these sets of lessons is done (the side card is closed
// until then): in some course, the lessons of its units before its first review stop,
// or its first lesson when the stops start with unit 1. The optional writing lessons
// don't count.
const reviewOpensAfter = courses
  .map((course) => {
    const required = courseUnits[course.id].map((u) => ({
      number: u.number,
      lessons: u.lessons.filter((l) => l.kind !== "writing").map((l) => l.id),
    }));
    const before = required.filter((u) => u.number < course.reviewFromUnit).flatMap((u) => u.lessons);
    return before.length ? before : required.flatMap((u) => u.lessons).slice(0, 1);
  })
  .filter((lessons) => lessons.length > 0);

// Each course's grammar lessons in order, for grammar review's link in the side column.
const grammarLessons = Object.fromEntries(
  courses.map((course) => [
    course.id,
    courseUnits[course.id].flatMap((u) => u.lessons.filter((l) => l.kind === "grammar").map((l) => l.id)),
  ]),
) as Record<CourseId, string[]>;

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CourseTabs />
      <LearnFrame reviewOpensAfter={reviewOpensAfter} grammarLessons={grammarLessons}>{children}</LearnFrame>
    </>
  );
}
