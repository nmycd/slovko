// Content-free helpers, safe to import from client components (unlike
// ./index, which pulls in every unit's lessons).
import { toTiles } from "@/lib/answers";
import type { Exercise } from "./types";

/** Removes **highlight** markup, e.g. for audio. */
export function stripMarkup(text: string): string {
  return text.replace(/\*\*/g, "");
}

export function fillSentence(before: string, word: string, after: string): string {
  return `${before} ${word}${/^[.,!?…]/.test(after) ? "" : " "}${after}`.trim();
}

/** Slovak strings an exercise may play as audio. */
export function speakableTexts(ex: Exercise): string[] {
  const texts = ((): (string | undefined)[] => {
    switch (ex.type) {
      case "intro":
      case "listen":
      case "speak":
        return [ex.sk];
      case "choice":
        return [ex.sk, ex.optionsLang === "sk" ? ex.options[ex.answer] : undefined];
      case "build":
        // Building Slovak: tapping a word tile speaks that word, so each tile needs a clip too.
        return ex.promptLang === "sk"
          ? [ex.prompt]
          : [ex.answers[0], ...toTiles(ex.answers[0]), ...ex.distractors];
      case "match":
        return ex.pairs.map((p) => p.sk);
      case "fill":
        return [fillSentence(ex.before, ex.options[ex.answer], ex.after)];
      case "grammar":
        return (ex.examples ?? []).map((e) => e.sk);
    }
  })();
  return texts.filter((t): t is string => Boolean(t)).map(stripMarkup);
}
