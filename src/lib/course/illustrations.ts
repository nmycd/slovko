// Generated lesson pictures in public/illustrations/, keyed "lessonId#exerciseIndex"
// (the same keys as illustrations/plan/unitN.json). Pictures are painted on white
// paper; the .illustration class blends them into the page.

export type Illustration = { src: string; width: number; height: number };

export const illustrations: Record<string, Illustration> = {
  "u1-l1#3": { src: "/illustrations/u1-l1-3.webp", width: 960, height: 717 },
};

export function illustrationFor(lessonId: string, exercise: number): Illustration | undefined {
  return illustrations[`${lessonId}#${exercise}`];
}
