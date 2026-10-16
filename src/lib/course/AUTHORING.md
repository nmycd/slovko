# Writing Slovko lessons

Slovko teaches Slovak to English speakers at CEFR level A1. The course has
10 units that follow the syllabus of the textbook *Krížom-krážom Slovenčina
A1* (Lekcia 1–10): same topics, same grammar order, vocabulary drawn from
each lesson. **The lessons themselves are original.**

Each unit lives in `src/lib/course/units/unitN.ts` and exports `unitN: Unit`.
Types are in `types.ts`; read them first.

## Using the textbook (and what not to copy)

Use the book for **what** to teach: the unit's topics and situations, its
vocabulary (the unit's glossary section is the best word list), its grammar
points, their order, and the grammar tables.

Do **not** reproduce the book's dialogues, reading texts, exercise items,
characters (Johanna, Zuzana, Róbert, Carlo, …) or their stories. Short
formulaic phrases every textbook shares are fine ("Ako sa máš?", "Teší ma.").
Write your own sentences with Slovko's own cast:

| Name | Who |
| --- | --- |
| **Emma** | Exchange student from Ireland, learning Slovak in Bratislava (the learner's stand-in) |
| **Lucia** | Slovak student, Emma's roommate in the dormitory (internát) |
| **Tomáš** | Lucia's friend, a programmer from Košice |
| **Marek** | Lucia's brother, a cook in a restaurant |
| **pani Horváthová** | Slovak teacher at the university |
| **pán Kováč** | Porter (vrátnik) at the dormitory |

Other everyday names are fine (Peter, Jana, Martin, Zuzka is fine as a common
nickname, but not the book's Zuzana Šoltýsová).

## Unit structure

- **5–7 lessons per unit.** Order them like the book: situation and
  vocabulary first, grammar where the book introduces it.
- `kind: "vocab"` (default): new words and phrases for a topic, then practice.
- `kind: "grammar"`: teaches **one** grammar point. Starts with 1–2 grammar
  cards (exercise 1–3), may add one more card mid-lesson, then 8–12 drills
  that use the point (fill and build are the workhorses).
- `kind: "review"`: **the last lesson of every unit.** Mixed practice of the
  whole unit: no intro or grammar cards, 12–16 exercises.
- Every unit whose book lesson has grammar gets at least 2 grammar lessons.

## Lesson rules

- 10–18 exercises. Teaching cards (intro + grammar) at most ~40%.
- Introduce before you test: every Slovak word a learner must produce or
  recognise was taught in this lesson or earlier in the course. Distractors
  may use known words.
- Start with 2–3 intro cards, then interleave practice; don't stack 8 intros.
- Use at least 4 exercise types per lesson. Aim for ≥1 `listen` and ≥1
  `speak` per lesson, and at most 2 `match`.
- Never end a lesson on a teaching card.
- Lesson ids: `uN-l1`, `uN-l2`, … in order. `title` is Slovak, `titleEn`
  English.

## Exercise types

| Type | Use it for | Rules |
| --- | --- | --- |
| `intro` | A new word or phrase | `sk`, `en`, optional short `note` (1–2 sentences; may use `**highlight**`). One of up to three words is a review word: tag it in `lexicon.ts` (see CONTENT-PIPELINE.md, stage 2). |
| `grammar` | Explaining a rule | `title`; `body` 1–3 short paragraphs of plain English; optional `table` (≤8 rows, 2–4 columns, `head` optional); 2–4 `examples` (each is voiced). Wrap endings in `**…**`: `študent**ka**`. Markup only here and in intro notes. |
| `choice` | Recognition | English `question`; 3 options (2–4 allowed); `optionsLang` says which language the options are in; optional `sk` shows and plays a Slovak phrase. |
| `fill` | Endings, forms, small words | `before` + gap + `after`; 2–4 options that are real forms (e.g. `študent` / `študentka` / `študenti`); `en` is the translation of the full sentence. |
| `build` | Producing sentences | `answers[0]` is split into word tiles (punctuation dropped), so it must be buildable from its own words. Add alternative correct answers (e.g. with/without the pronoun). `distractors`: 1–3 single words that are **not** in `answers[0]`, plausibly wrong (wrong ending, gender, case). For `promptLang: "sk"`, answers are English. |
| `listen` | Hearing | A short sentence (≤8 words) typed back; checking forgives missing accents. |
| `speak` | Pronunciation | ≤6 words, a common phrase. |
| `match` | Vocabulary sets | 4–5 pairs; both sides unique. |

## Grammar cards: style

- One idea per card. A1 learners: plain words, short sentences.
- Name the concept simply, then the Slovak term if useful: "the accusative
  (the object case)".
- Show the pattern with a small table, highlight what changes with `**`.
- Contrast is the fastest teacher: masculine vs feminine, ja vs ty, present
  vs past.
- Examples are short, natural, and use the unit's vocabulary.

Example:

```ts
{
  type: "grammar",
  title: "Jobs: masculine and feminine",
  body: [
    "Most jobs have a masculine and a feminine form. The feminine one usually adds **-ka**.",
    "Slovak has no word for “a” or “the”: Som učiteľ = I am a teacher.",
  ],
  table: {
    head: ["he", "she"],
    rows: [
      ["študent", "študent**ka**"],
      ["učiteľ", "učiteľ**ka**"],
      ["lekár", "lekár**ka**"],
    ],
  },
  examples: [
    { sk: "Lucia je študent**ka**.", en: "Lucia is a student." },
    { sk: "Tomáš je programátor.", en: "Tomáš is a programmer." },
  ],
}
```

## Language quality

- Standard Slovak (spisovná slovenčina). Check every diacritic, gender
  agreement and case ending. No Czech forms (ě, ř, ů are never Slovak).
- Clitics (`sa`, `si`, `som`, `si`, `sme`, `ste`) go in second position:
  "Volám sa Emma.", "Včera som bola doma."
- Use natural English for translations; don't translate word for word.
- Formal `vy` with strangers/teachers, `ty` with friends; be consistent
  within a scene.

## Translations

Every English string you write is also shown in Ukrainian and Russian. After
adding or changing lessons, run `npm run i18n:sync`: new or changed strings
show up as missing/stale in `translations/uk` and `translations/ru` and need
translating (see `TRANSLATING.md`). Keep English notes free of jokes or
references that only work in English; they get translated.

## Spelling cards

Before a word turns up in a `listen` sentence, the learner types it once on its
own, on a "spell" card. Don't write these: `npm run plan:spelling` places them
(in `spelling.json`, see `spelling.ts`), skipping names and little words. Rerun
it after adding or changing lessons; `npm run validate:course` (whole course)
fails until you do. New spelling words need audio: `npm run generate:audio`.
A new name in a `listen` sentence goes in `names.ts`.

## Checking your work

```bash
npm run -s validate:course -- u3     # must print "✓ no errors"; fix warnings where sensible
npx tsc --noEmit 2>&1 | grep unit3   # must print nothing
```

Then reread every Slovak sentence once more, slowly.
