// Places the spelling cards (see src/lib/course/spelling.ts) and writes
// src/lib/course/spelling.json. Rerun after changing lesson content; the same
// course always gets the same plan.
//
//   npm run plan:spelling
//
// Every word a typed sentence in a standard lesson needs gets one card (a writing
// lesson's sentences lean on its memorize rounds instead):
// - 2–5 cards after the word first appears in writing (a fixed pick per word),
//   and at least 2 cards before the first sentence that needs it;
// - a word never shown before its sentence gets a card a few cards before that
//   sentence, within the sentence's lesson;
// - cards spread out rather than stack, and don't split a run of grammar cards;
// - a lesson gets at most 5; more move on to the next free spot before the sentence.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { toTiles } from "../src/lib/answers";
import { course } from "../src/lib/course";
import { fillSentence, stripMarkup } from "../src/lib/course/helpers";
import {
  needsSpelling,
  sentenceWords,
  spellingForm,
  type SpellCard,
} from "../src/lib/course/spelling";
import type { Exercise } from "../src/lib/course/types";

/** Slovak a learner reads on an exercise before answering it. */
function shownText(ex: Exercise): string[] {
  switch (ex.type) {
    case "intro":
    case "speak":
      return [ex.sk];
    case "choice":
      return [ex.sk ?? "", ...(ex.optionsLang === "sk" ? ex.options : [])];
    case "build":
      return ex.promptLang === "sk" ? [ex.prompt] : [...toTiles(ex.answers[0]), ...ex.distractors];
    case "match":
      return ex.pairs.map((p) => p.sk);
    case "memorize":
      return [];
    case "fill":
      return [fillSentence(ex.before, ex.options[ex.answer], ex.after), ...ex.options];
    case "grammar":
      return [...(ex.examples ?? []).map((e) => e.sk), ...(ex.table?.rows.flat() ?? [])].map(stripMarkup);
    case "listen":
    case "spell":
      return [];
  }
}

/** A fixed number in 0..3 per word (FNV-1a), so the plan never changes between runs. */
function pick(word: string): number {
  let h = 0x811c9dc5;
  for (const ch of word) h = Math.imul(h ^ ch.codePointAt(0)!, 0x01000193);
  return (h >>> 0) % 4;
}

// The course as one sequence of authored exercises.
const slots = course.flatMap((unit) =>
  unit.lessons.flatMap((lesson) =>
    lesson.exercises.map((ex) => ({ lesson: lesson.id, writing: lesson.kind === "writing", ex })),
  ),
);
const lessonStart = new Map<string, number>();
slots.forEach((s, g) => lessonStart.has(s.lesson) || lessonStart.set(s.lesson, g));

// The first intro card teaching each single word, for the card's meaning.
const glossOf = new Map<string, { g: number; ref: string }>();
slots.forEach((s, g) => {
  if (s.ex.type !== "intro") return;
  const words = sentenceWords(s.ex.sk);
  if (words.length === 1 && !glossOf.has(words[0])) glossOf.set(words[0], { g, ref: `${s.lesson}#${s.ex.id}` });
});

const PER_LESSON = 5;

const plan = new Map<string, SpellCard[]>();
const crowd = new Map<string, number>();
const firstShown = new Map<string, number>();
const planned = new Set<string>();
const stats = { cards: 0, shown: 0, neverShown: 0, glossed: 0, gaps: [] as number[] };

slots.forEach((slot, g) => {
  if (slot.ex.type === "listen" && !slot.writing) {
    const start = lessonStart.get(slot.lesson)!;
    for (const word of sentenceWords(slot.ex.sk)) {
      if (!needsSpelling(word) || planned.has(word)) continue;
      planned.add(word);
      const lag = 2 + pick(word);
      const first = firstShown.get(word);
      // Positions are slots the card goes after; start - 1 means first in the sentence's lesson.
      const lo = first ?? start - 1;
      const hi = Math.max(lo, g - 2);
      let p = Math.min(Math.max(first === undefined ? g - lag : first + lag - 1, lo), hi);
      // Don't split a run of grammar cards (or open a lesson that starts with one).
      while (p + 1 <= hi && slots[p + 1]?.ex.type === "grammar" && (p < start || slots[p].ex.type === "grammar")) p++;
      // Spread out: the nearest free spot within range, else the least crowded.
      const spots = [0, 1, -1, 2, -2, 3, -3].map((d) => p + d).filter((q) => q >= lo && q <= hi);
      const where = (q: number) =>
        first === undefined && q < start
          ? { lesson: slot.lesson, after: undefined }
          : { lesson: slots[q].lesson, after: slots[q].ex.id };
      const key = (q: number) => `${where(q).lesson}#${where(q).after ?? ""}`;
      p = spots.find((q) => !crowd.get(key(q))) ?? spots.reduce((a, b) => ((crowd.get(key(b)) ?? 0) < (crowd.get(key(a)) ?? 0) ? b : a));
      const full = (q: number) => (plan.get(where(q).lesson)?.length ?? 0) >= PER_LESSON;
      if (full(p)) {
        for (let q = p + 1; q <= hi; q++) {
          if (!full(q) && !crowd.get(key(q))) {
            p = q;
            break;
          }
        }
      }
      crowd.set(key(p), (crowd.get(key(p)) ?? 0) + 1);

      const gloss = glossOf.get(word);
      const after = where(p).after;
      const card: SpellCard = {
        ...(after !== undefined ? { after } : {}),
        sk: spellingForm(word),
        ...(gloss && gloss.g < g ? { gloss: gloss.ref } : {}),
      };
      const cards = plan.get(where(p).lesson) ?? [];
      cards.push(card);
      plan.set(where(p).lesson, cards);

      stats.cards++;
      if (first === undefined) stats.neverShown++;
      else stats.shown++;
      if (card.gloss) stats.glossed++;
      stats.gaps.push(g - p - 1);
    }
  }
  for (const word of shownText(slot.ex).flatMap(sentenceWords)) {
    if (!firstShown.has(word)) firstShown.set(word, g);
  }
});

// One card per line, lessons in course order, cards in lesson order.
const lines = course
  .flatMap((u) => u.lessons)
  .filter((l) => plan.has(l.id))
  .map((l) => {
    const at = (c: SpellCard) => l.exercises.findIndex((ex) => ex.id === c.after);
    const cards = plan.get(l.id)!.sort((a, b) => at(a) - at(b));
    return `  ${JSON.stringify(l.id)}: [\n${cards.map((c) => `    ${JSON.stringify(c)}`).join(",\n")}\n  ]`;
  });
const file = join(process.cwd(), "src/lib/course/spelling.json");
writeFileSync(file, `{\n${lines.join(",\n")}\n}\n`);

const gaps = stats.gaps.sort((a, b) => a - b);
console.log(`${stats.cards} spelling cards in ${plan.size} lessons → src/lib/course/spelling.json`);
console.log(`  ${stats.shown} after the word first appears, ${stats.neverShown} for words never shown before their sentence`);
console.log(`  ${stats.glossed} show a meaning from an intro card`);
console.log(`  cards between a card and its sentence: min ${gaps[0]}, median ${gaps[gaps.length >> 1]}, max ${gaps.at(-1)}`);
