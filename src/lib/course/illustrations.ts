// Generated lesson pictures in public/illustrations/. illustrations.json maps
// "lessonId#exerciseId" to a picture (illustrations/tools/render-plan.ts writes
// it). Pictures are painted on white paper; the .illustration class blends them
// into the page.
import pictures from "./illustrations.json";
import type { ExerciseId } from "./types";

export type Illustration = { src: string; width: number; height: number };

const all: Record<string, Illustration> = pictures;

/** One lesson's pictures by exercise id. Called on the server, so only this lesson's go to the browser. */
export function lessonIllustrations(lessonId: string): Record<ExerciseId, Illustration> {
  const out: Record<ExerciseId, Illustration> = {};
  for (const [key, picture] of Object.entries(all)) {
    const [lesson, id] = key.split("#");
    if (lesson === lessonId) out[id] = picture;
  }
  return out;
}
