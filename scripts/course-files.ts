// Where each course's files are, for the scripts. Every course script takes
// `--course a2` (or `--course=a2`) and works on A1 without it.
//
//                  A1                          A2
//   units          src/lib/course/units/       src/lib/course/a2/units/
//   translations   src/lib/course/translations src/lib/course/a2/translations
//   spelling plan  src/lib/course/spelling.json      src/lib/course/a2/spelling.json
//   pictures       src/lib/course/illustrations.json src/lib/course/a2/illustrations.json
//   picture plan   illustrations/plan/         illustrations/plan/a2/
//   book crops     illustrations/book-refs/    illustrations/book-refs/a2/
//
// Media files (public/illustrations/, illustrations/renders/, the audio cache) are
// shared: they're named by lesson and exercise ids, which are unique across courses.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { courseById, courses, isCourseId, type Course, type CourseId } from "../src/lib/course/courses";
import type { Unit } from "../src/lib/course/types";

const ROOT = join(__dirname, "..");

export type CourseFiles = {
  course: Course;
  /** The course's content folder: src/lib/course, or src/lib/course/a2. */
  dir: string;
  units: string;
  translations: string;
  spelling: string;
  illustrations: string;
  /** The picture plan's folder (unitN.json, map-uN.json, book-panels-uN.txt). */
  plan: string;
  /** The textbook crops' folder (git-ignored). */
  bookRefs: string;
  /** A unit's id: "u3", "a2-u3". */
  unitId: (n: number) => string;
  /** A unit's file. */
  unitFile: (n: number) => string;
};

export function courseFiles(id: CourseId): CourseFiles {
  const course = courseById(id);
  const sub = id === "a1" ? "" : id;
  const dir = join(ROOT, "src/lib/course", sub);
  return {
    course,
    dir,
    units: join(dir, "units"),
    translations: join(dir, "translations"),
    spelling: join(dir, "spelling.json"),
    illustrations: join(dir, "illustrations.json"),
    plan: join(ROOT, "illustrations/plan", sub),
    bookRefs: join(ROOT, "illustrations/book-refs", sub),
    unitId: (n) => `${course.prefix}u${n}`,
    unitFile: (n) => join(dir, "units", `unit${n}.ts`),
  };
}

/**
 * The course a script is asked for, and its other arguments without `--course`. Exits
 * on an unknown course.
 */
export function courseArg(argv = process.argv.slice(2)): { files: CourseFiles; rest: string[] } {
  const rest: string[] = [];
  let id: string = "a1";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--course") id = argv[++i] ?? "";
    else if (argv[i].startsWith("--course=")) id = argv[i].slice("--course=".length);
    else rest.push(argv[i]);
  }
  if (!isCourseId(id)) {
    console.error(`No course "${id}". Courses: ${courses.map((c) => c.id).join(", ")}.`);
    process.exit(2);
  }
  return { files: courseFiles(id), rest };
}

/** The courses before this one, in order (A1 comes before all of A2). */
export function earlierCourses(id: CourseId): Course[] {
  return courses.slice(0, courses.findIndex((c) => c.id === id));
}

/** A unit's number from "u3" or, in its course, "a2-u3"; NaN if it's neither. */
export function unitNumber(files: CourseFiles, name: string): number {
  const match = new RegExp(`^(?:${files.course.prefix})?u(\\d+)$`, "i").exec(name);
  return match ? Number(match[1]) : NaN;
}

/** The numbers of the units whose files exist, in order. */
export function unitNumbers(files: CourseFiles): number[] {
  const out: number[] = [];
  for (let n = 1; existsSync(files.unitFile(n)); n++) out.push(n);
  return out;
}

/** One unit, loaded from its own file (so other half-written units can't break a run). */
export async function loadUnitFile(files: CourseFiles, n: number): Promise<Unit> {
  if (!existsSync(files.unitFile(n))) throw new Error(`No ${files.unitId(n)}: ${files.unitFile(n)} doesn't exist`);
  const unit = ((await import(files.unitFile(n))) as Record<string, Unit>)[`unit${n}`];
  if (!unit) throw new Error(`${files.unitFile(n)} has no export unit${n}`);
  return unit;
}
