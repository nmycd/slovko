// The courses, in order: A1, then A2. Client-safe: ids, paths and switches, no content
// (that is ./index, on the server). A unit's or lesson's course shows in its id: A1's
// ids are bare (u3, u3-l1), every later course's start with its own (a2-u3, a2-u3-l1),
// so ids are unique across courses and progress, translations, pictures and audio can
// all be keyed by them.
import type { MessageKey } from "@/lib/i18n";

export type CourseId = "a1" | "a2";

export type Course = {
  id: CourseId;
  /** The CEFR level, as the course tabs and the lesson header show it. */
  level: string;
  /** The course's learning path. */
  path: string;
  /** What its unit and lesson ids start with: "" for A1, "a2-" for A2. */
  prefix: string;
  /** Units 1 to `freeUnits` are free; the rest need Premium. */
  freeUnits: number;
  /**
   * The path's word review stops start with this unit. The review card on /learn opens
   * once the lessons before it are done in some course (its first lesson, for a course
   * whose stops start with unit 1): A1's unit 1 words are all minutes old, with
   * nothing to forget yet, but a learner reaching A2 has A1's to review.
   */
  reviewFromUnit: number;
  /**
   * Open to everyone. Until then the course's tab says "coming soon", and only
   * dev-mode accounts (`app_metadata.dev`) see its path and play its lessons.
   * Launching a course is setting this to true.
   */
  launched: boolean;
  /** The "coming soon" page shown while it isn't launched. */
  soon?: { title: MessageKey; body: MessageKey };
};

export const courses: Course[] = [
  { id: "a1", level: "A1", path: "/learn", prefix: "", freeUnits: 2, reviewFromUnit: 2, launched: true },
  {
    id: "a2",
    level: "A2",
    path: "/learn/a2",
    prefix: "a2-",
    freeUnits: 1,
    reviewFromUnit: 1,
    launched: true,
    soon: { title: "courses.a2.title", body: "courses.a2.body" },
  },
];

export const courseIds = courses.map((c) => c.id);

export function isCourseId(value: string): value is CourseId {
  return (courseIds as string[]).includes(value);
}

export function courseById(id: CourseId): Course {
  return courses.find((c) => c.id === id)!;
}

/** The course a unit or lesson id belongs to. */
export function courseOf(id: string): Course {
  return courses.find((c) => c.prefix && id.startsWith(c.prefix)) ?? courses[0];
}

/** Whether a viewer sees a course and plays its lessons: once launched, or in dev mode. */
export function courseOpen(course: Course, dev: boolean): boolean {
  return course.launched || dev;
}
