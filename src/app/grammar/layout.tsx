import { GrammarFrame, type GrammarCourse } from "@/components/grammar/grammar-review";
import { courseOutlines, courses, courseUnits, type CourseId } from "@/lib/course";
import { locales, type Locale } from "@/lib/i18n/locales";

// Every course's grammar lessons in order, course by course and unit by unit, in each
// native language (units and courses without one left out). `place`: the lesson's
// number in its unit, as the lesson header counts it.
const grammarCourses = Object.fromEntries(
  locales.map((locale) => [
    locale,
    courses
      .map((course) => ({
        id: course.id,
        units: courseOutlines[course.id][locale]
          .map((u) => ({
            number: u.number,
            premium: u.premium,
            lessons: u.lessons.flatMap((l, i) =>
              l.kind === "grammar" ? [{ id: l.id, title: l.title, titleEn: l.titleEn, place: i + 1 }] : [],
            ),
          }))
          .filter((u) => u.lessons.length > 0),
      }))
      .filter((c) => c.units.length > 0),
  ]),
) as Record<Locale, GrammarCourse[]>;

// Each course's lessons that count towards finishing it (not the optional writing ones).
const required = Object.fromEntries(
  courses.map((c) => [c.id, courseUnits[c.id].flatMap((u) => u.lessons.filter((l) => l.kind !== "writing").map((l) => l.id))]),
) as Record<CourseId, string[]>;

// One frame for every grammar lesson, so the list keeps its folds and scroll from lesson to lesson.
export default function GrammarLayout({ children }: { children: React.ReactNode }) {
  return (
    <GrammarFrame courses={grammarCourses} required={required}>
      {children}
    </GrammarFrame>
  );
}
