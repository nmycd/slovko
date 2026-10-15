// Generated lesson pictures in public/illustrations/. illustrations.json maps
// "lessonId#exerciseIndex" to a picture (illustrations/tools/render-plan.ts writes
// it). Pictures are painted on white paper; the .illustration class blends them
// into the page.
import pictures from "./illustrations.json";
import { playedIndex } from "./spelling";

export type Illustration = { src: string; width: number; height: number };

const all: Record<string, Illustration> = pictures;

/**
 * One lesson's pictures by exercise index as played (spelling cards included).
 * Called on the server, so only this lesson's go to the browser.
 */
export function lessonIllustrations(lessonId: string): Record<number, Illustration> {
  const out: Record<number, Illustration> = {};
  for (const [key, picture] of Object.entries(all)) {
    const [lesson, index] = key.split("#");
    if (lesson === lessonId) out[playedIndex(lessonId, Number(index))] = picture;
  }
  return out;
}
