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
- `kind: "writing"` (experimental): **just before the review lesson**, id
  `uN-pisanie`, title "Píšeme". Most of the unit's writing happens here: up to five
  `memorize` rounds, then the unit's dictations (`listen`), one of them early. The
  standard lessons keep very few dictations (two in unit 1, one in every later
  unit), so learners see from the start that the course asks them to write.
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
- Lesson ids are names, like exercise ids: learners' progress (on the device
  and in Supabase), translation keys, `ref`s, pictures and spelling cards point
  at them, so a lesson never changes its id. The first lessons were numbered
  `uN-l1`, `uN-l2`, … and keep those numbers; a lesson added later, wherever it
  goes in the unit, takes the unit and a name: `u4-rodina`. The path shows
  lessons in file order, so a lesson inserted before a learner's place becomes
  their next one. `title` is Slovak, `titleEn` English.

## Exercise types

| Type | Use it for | Rules |
| --- | --- | --- |
| `intro` | A new word or phrase | `sk`, `en`, optional short `note` (1–2 sentences; may use `**highlight**`). One of up to three words is a review word: tag it in `lexicon.ts` (see CONTENT-PIPELINE.md, stage 2). |
| `grammar` | Explaining a rule | `title`; `body` 1–3 short paragraphs of plain English; optional `table` (≤8 rows, 2–4 columns, `head` optional); 2–4 `examples` (each is voiced). Wrap endings in `**…**`: `študent**ka**`. Markup only here and in intro notes. |
| `choice` | Recognition | English `question`; 3 options (2–4 allowed); `optionsLang` says which language the options are in; optional `sk` shows and plays a Slovak phrase; optional `why` (see "Explanations after a wrong answer"). |
| `fill` | Endings, forms, small words | `before` + gap + `after`; 2–4 options that are real forms (e.g. `študent` / `študentka` / `študenti`); `en` is the translation of the full sentence; optional `why` (see "Explanations after a wrong answer"). |
| `build` | Producing sentences | `answers[0]` is split into word tiles (punctuation dropped), so it must be buildable from its own words. Add alternative correct answers (e.g. with/without the pronoun). `distractors`: 1–3 single words that are **not** in `answers[0]`, plausibly wrong (wrong ending, gender, case). For `promptLang: "sk"`, answers are English. With a Slovak answer, add `traps` for the distractors that compete with one tile (see "Explanations after a wrong answer"). |
| `listen` | Hearing | A short sentence (≤8 words) typed back; checking forgives missing accents. Mostly in the unit's writing lesson. |
| `memorize` | Spelling (writing lessons only) | A bare stub, `{ id: "memorize-1", type: "memorize" }`. When the lesson starts it's dealt four words from the intro cards since the previous writing lesson (those word review takes: up to three words); the learner studies them, then types each from its meaning once the Slovak is hidden and the rows are shuffled. Only letter-perfect words count, accents included: 0/25/50/75/100%. The course keeps as many rounds as the words fill. |
| `speak` | Pronunciation | ≤6 words, a common phrase. |
| `match` | Vocabulary sets | 4–5 pairs; both sides unique. |

## Exercise ids

Every exercise starts with an `id`, its name in the lesson:
`{ id: "dobry-den", type: "intro", … }`. Translations (`u1-l1.dobry-den.note`),
explanations' `ref`s, pictures and spelling cards point at exercises by it
(`u1-l1#dobry-den`), so exercises can be added, removed and reordered like lines
in a document: nothing else shifts.

- Write a new exercise without one and run `npm run course:ids`. It names every
  exercise that has no id and never changes an existing one: an intro card by its
  Slovak (`dobry-den`), a grammar card by its title
  (`grammar-adjective-three-endings`), anything else by its type and a few words
  of its Slovak (`choice-dovidenia`, `fill-dobre-rano-emma`). Or write one
  yourself: lowercase letters, digits and hyphens, unique in the lesson (`spell-`
  is for spelling cards).
- Keep the id when you change the exercise, even its type: it's a name, not a
  description. Changed text shows where it matters: its translations go stale, and
  `render-plan.ts` drops a picture whose exercise text changed.
- Don't give a removed exercise's id to a different exercise: its translations
  and picture would attach to it.
- Moving an exercise to another lesson changes its pointers (`u1-l1#…` becomes
  `u1-l2#…`). The course check names the `ref`s and pictures to update; move its
  entries in `translations/*/unitN.json` to the new key before
  `npm run i18n:sync`, which drops keys that are gone.

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
  id: "grammar-jobs-masculine-feminine",
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

## Explanations after a wrong answer (`why`)

A `choice` or `fill` exercise can carry a `why`: a sentence or two shown under the
correct answer when the learner picks a wrong one.

- **Write one when the answer follows from something the learner can reason
  about**: a grammar rule (an ending, case, gender, person, tense, sa or si, word
  order, agreement), how a set phrase is built (dať **si** kávu, kliknúť **na**), or
  a contrast that's easy to mix up (zamestnanie, the job, and zamestnávateľ, the
  employer).
- **Leave it out when the exercise only checks a word's meaning** ("What does this
  mean? Tomáš otvoril súbor."). The correct answer already says everything.
- Name the rule, then show it in the exercise's own sentence. If a wrong option is
  tempting, say in a few words why it doesn't fit.
- Plain English, about 30 words at most, with the terms the grammar cards use (the
  object form, the past tense, ja, ty, on…). Bold the key form with `**…**`.
- Don't repeat the whole correct answer just to show it: the footer shows it.
- Word-order exercises explain their wrong tiles instead: `traps: [{ wrong, right,
  why }]` pairs a distractor with the answer tile it competes with ("Bratislava" for
  "Bratislave") and says why the right one is right. A learner who uses it sees the
  why, under the accepted order closest to theirs with the misplaced and missing
  words marked. Several whys follow the answer's word order, so each must make sense
  on its own. A distractor that competes with no particular tile gets no trap.
- Point it to the grammar card it rests on with `ref: "lessonId#exerciseId"`
  (`ref: "u3-l2#grammar-one-adjective-three"`), a card in the same lesson before
  the exercise or in an earlier one.
  The learner gets "See the rule", which opens that card over the lesson. Leave
  `ref` out when no card states the rule; the course check rejects a later card.
- Each native language gets its own explanation, written for its speakers, not a
  translation: a Ukrainian or Russian reader learns sa from -ся, an Uzbek reader
  the object form from -ni (see TRANSLATING.md). `npm run i18n:sync` adds the
  empty entries.

From unit 9:

| Exercise | `why` |
|---|---|
| Which one means "Tomáš is washing (himself)"? | Washing yourself, with no object, takes **sa**: Tomáš **sa** umýva. **Si** needs something after it: umýva si ruky. |
| Tomáš dostal ___ na konferenciu. (pozvánku) | The invitation is what Tomáš got, the object, so pozvánka changes -a to **-u**: dostal **pozvánku**. |
| Aká je vaša ___? (národnosť) | Nationality is **národnosť**. It's also the only feminine word here, which fits **aká** and **vaša**. |
| What does this mean? Tomáš otvoril súbor. | (none: it only checks the word) |

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
npm run -s course:ids                # names new exercises
npm run -s validate:course -- u3     # must print "✓ no errors"; fix warnings where sensible
npx tsc --noEmit 2>&1 | grep unit3   # must print nothing
```

Then reread every Slovak sentence once more, slowly.
