// Generated lesson pictures in public/illustrations/. illustrations.json (A1) and
// a2/illustrations.json (A2) map "lessonId#exerciseId" to a picture
// (illustrations/tools/render-plan.ts writes them, one file per course). Pictures
// are painted on white paper; the .illustration class blends them into the page.
import a2Pictures from "./a2/illustrations.json";
import a1Pictures from "./illustrations.json";
import type { ExerciseId } from "./types";

export type Illustration = { src: string; width: number; height: number };

const all: Record<string, Illustration> = { ...a1Pictures, ...(a2Pictures as Record<string, Illustration>) };

/** One lesson's pictures by exercise id. Called on the server, so only this lesson's go to the browser. */
export function lessonIllustrations(lessonId: string): Record<ExerciseId, Illustration> {
  const out: Record<ExerciseId, Illustration> = {};
  for (const [key, picture] of Object.entries(all)) {
    const [lesson, id] = key.split("#");
    if (lesson === lessonId) out[id] = picture;
  }
  return out;
}
