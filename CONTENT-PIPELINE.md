# Content pipeline

How a unit of the course goes from the textbook to the live app, in order. Each
stage says what goes in, what to run, and what comes out. The detailed rules live
in the guides linked from each stage; this page is the map.

Everything here runs from the repo root. Paid steps are marked **$**.

| # | Stage | Run | Writes | |
| --- | --- | --- | --- | --- |
| 1 | [Read the textbook](#1-read-the-textbook) | (the PDF scan) | notes | |
| 2 | [Write the unit](#2-write-the-unit) | | `src/lib/course/units/unitN.ts`, `lexicon.ts` | |
| 3 | [Check it](#3-check-it) | `npm run -s validate:course -- uN` | | |
| 4 | [Editorial pass](#4-editorial-pass) | a review session | a findings list, then fixes | |
| 5 | [Translate](#5-translate) | `npm run i18n:sync` | `translations/{uk,ru}/unitN.json` | |
| 6 | [Spelling cards](#6-spelling-cards) | `npm run plan:spelling` | `src/lib/course/spelling.json` | |
| 7 | [Illustration plan](#7-illustration-plan) | `illustrations/tools/*` | `illustrations/plan/unitN.json` | |
| 8 | [Render pictures](#8-render-pictures) | `render-plan.ts` | `public/illustrations/`, `illustrations.json` | **$** |
| 9 | [Record audio](#9-record-audio) | `npm run generate:audio` | clips in Supabase Storage | **$** |
| 10 | [Final checks and ship](#10-final-checks-and-ship) | checks, then push to `main` | the live site | |

The dictionary on /learn needs no step: it's [built from the content](#automatic).

## 1. Read the textbook

The course follows *Krížom-krážom Slovenčina A1* (Kamenárová, 2007): one unit
per Lekcia, same topics, same grammar order, vocabulary from the lesson's
glossary. The scan is `renata-kamenarova-krizom-krazom-slovencina-a1-2007.pdf`
in the repo root: **local only** (`*.pdf` is git-ignored; the book is
copyrighted and the repo is public).

- The PDF has no text layer; pages are images. PDF page numbers differ from the
  printed ones by 3 (Lekcia 1–5), 5 (6–8) and 7 (9–10). The table is in
  [illustrations/README.md](illustrations/README.md#book-crops).
- Take **what** to teach from the book, never its dialogues, texts, exercise
  items or characters. Slovko has its own cast (Emma, Lucia, Tomáš, Marek, pani
  Horváthová, pán Kováč). See [AUTHORING.md](src/lib/course/AUTHORING.md#using-the-textbook-and-what-not-to-copy).

## 2. Write the unit

One file per unit, `src/lib/course/units/unitN.ts`, in English and Slovak only.
[AUTHORING.md](src/lib/course/AUTHORING.md) has the rules: 5–7 lessons, a review
lesson last, 10–18 exercises a lesson, introduce before testing, the exercise
types and how grammar cards are written. The types are in
[types.ts](src/lib/course/types.ts).

Don't write spelling cards (stage 6 places them) or dictionary entries (built
automatically).

**Name each new exercise**: every exercise has an `id`, unique in its lesson
(`dobry-den`, `choice-dovidenia`), which translation keys, `ref`s, pictures and
spelling cards point at, so exercises can be added, removed and reordered without
shifting anything. Write exercises without one and run `npm run course:ids`, which
fills in ids and never changes existing ones (AUTHORING.md, "Exercise ids").

**Tag each new review word** in [lexicon.ts](src/lib/course/lexicon.ts): every
intro card of up to three words (not a list) is a review word, keyed by its Slovak
in lowercase without final punctuation. Give its part of speech (a noun phrase is a
noun; a greeting, question or sentence is an `expression`), a noun's gender (and
`plural` for words like "noviny"), a topic from the list there, and the register
where Slovak marks it (ty forms and "Ahoj" informal, vy forms and "Dobrý deň"
polite). Word review picks wrong options by these tags, and they're the course's
record of what each word is, for anything built on it later. Stage 3 fails on a
review word without tags and warns when tags disagree with the card ("to …" for a
verb, end punctuation for an expression). A new topic goes into the `Topic` list.

**Explain the multiple-choice answers**: give each `choice` and `fill` whose
answer can be reasoned out (not a pure vocabulary check) a `why`, and a `ref` to
the grammar card it rests on; give each word-order exercise with a Slovak answer
`traps` for its wrong tiles. All as in AUTHORING.md, "Explanations after a wrong
answer".

## 3. Check it

```bash
npm run -s validate:course -- u3
```

```bash
npx tsc --noEmit
```

`validate:course` catches structure the type checker can't: lesson and exercise
ids, every pointer to an exercise (`ref`s, spelling cards, pictures), answer
indices, tiles, Slovak-only fields, sentence lengths. It must print "✓ no
errors". A capitalised word in the middle of a `listen` sentence must be listed
in [names.ts](src/lib/course/names.ts): names are graded leniently (a misspelt name
is marked yellow, never wrong), so the grader has to know every one.

## 4. Editorial pass

Units written in parallel don't know about each other: the same word taught twice
as new, a later lesson contradicting an earlier one. One reader goes through the
whole course in order and lists findings without changing anything; the owner
picks which to fix. The brief is
[EDITORIAL-REVIEW.md](src/lib/course/EDITORIAL-REVIEW.md). Worth repeating after
any large batch of new or rewritten lessons.

## 5. Translate

Learners pick English, Ukrainian, Russian, Uzbek or Georgian. English lives in the
unit files; the others live in catalogs, one per unit and language.

```bash
npm run i18n:sync
```

This adds keys for new English text and marks changed English as stale. Fill in
`t` for every new or stale entry, following
[TRANSLATING.md](src/lib/course/TRANSLATING.md) (adapt rather than calque; fixed
spellings for names). Slovak text is never translated. Explanations (`why`) aren't
translated either but written afresh for each language's speakers, with the
English only as a pointer to the point being made.

## 6. Spelling cards

Before a word turns up in a typed sentence ("Type what you hear"), the learner
types it once on its own, on a spelling card. A script places the cards:

```bash
npm run plan:spelling
```

- One card per word form that typed sentences use, except names and Slovak's
  little words (pronouns, forms of byť, prepositions, conjunctions, question
  words, possessives; [little-words.ts](src/lib/course/little-words.ts)).
- Each card goes 2–5 cards after the word first appears in writing, at least 2
  before the first sentence that needs it, at most 5 cards per lesson. The
  2–5 is a fixed pick per word, so the same course always gets the same plan.
- The plan is [spelling.json](src/lib/course/spelling.json), committed: per lesson,
  each card's word, the exercise it goes `after` (an id; none for the start of the
  lesson) and, for the meaning, the intro card it `gloss`es (`u1-l2#dakujem`).
  Lessons get the cards when the course loads, after translation; a card's id is
  `spell-` and its word.

`validate:course` fails if a typed sentence needs a word that hasn't been spelled
yet: rerun the planner whenever lessons change. New spelling words need audio
(stage 9).

## 7. Illustration plan

Decide which exercises get a picture and what it shows, checked against what the
textbook illustrated. Full rules, the cast's looks and the recurring places are in
[illustrations/README.md](illustrations/README.md).

An intro card's picture also illustrates its word in word review (see
[Automatic](#automatic)), so give short words and phrases a picture where one
fits, and make it show the meaning plainly.

1. List the unit's exercises with their ids:
   ```bash
   npx tsx illustrations/tools/list-exercises.ts . 3
   ```
2. Read the book lesson and note the pictures that show the same situations as
   ours. Write their boxes to `illustrations/plan/book-panels-u3.txt` (committed),
   then cut the crops (git-ignored, `illustrations/book-refs/`):
   ```bash
   sh illustrations/tools/cut-panels.sh 3
   ```
3. Write `illustrations/plan/map-u3.json`: for each exercise that gets a picture
   (keyed `"u3-l1#izba"`, lesson and exercise id), a `picture` description (who, where, doing what; never style) or a `reuse` of
   an earlier picture, and the matching crop if there is one. A crop and its
   picture must show the same situation; describe the scene, never the book's
   drawing.
4. Build the plan, giving the unit's printed-minus-PDF page offset:
   ```bash
   npx tsx illustrations/tools/build-plan.ts . 3 3
   ```
   It writes `illustrations/plan/unit3.json` and checks every crop and reuse.

Which exercises get one: intro cards that can be shown, choice exercises that
describe a situation, and grammar cards only where a scene carries the point.

## 8. Render pictures

**$** About $0.05 a picture (Nano Banana 2.1 at 1K, October 2026). Needs
`GEMINI_API_KEY` in `.env.local`.

```bash
npx tsx illustrations/tools/render-plan.ts --unit 3
```

- The prompt ([gemini.ts](illustrations/tools/gemini.ts)) sends three style
  reference images, the scene, and the looks of every cast member it names. It
  asks for no text in the picture and a vignette on white paper: soft brushy
  edges, nothing touching the border, so pictures blend into the page.
- **The textbook crops never go to the model.** They are only for checking
  coverage in stage 7.
- Renders land in `illustrations/renders/` (git-ignored); the script resumes
  where it stopped. It converts each one to
  `public/illustrations/<lesson>-<exercise id>-<hash>.webp` (the hash changes when
  the picture does, so caches never show an old one) and writes
  [illustrations.json](src/lib/course/illustrations.json) (`"u3-l1#izba"` → picture),
  which the lesson page reads.
- To redo a picture, delete its file in `renders/` and run again. To try prompt
  changes on a few pictures first, use `render-test.ts`; to find pictures whose
  paint runs into the border, `check-edges.ts`.
- Entries whose exercise text changed since the plan are left out until the
  plan is updated (stage 7).

## 9. Record audio

**$** ElevenLabs, charged per character; a unit's new clips are usually a few
thousand characters. Needs `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` and the
Supabase keys in `.env.local`.

```bash
npm run generate:audio -- --dry-run
```

```bash
npm run generate:audio
```

Every Slovak text the app can play (intro cards, sentences, word tiles, options,
spelling words) is pre-generated into Supabase Storage. Production never
generates audio (`TTS_LIVE_GENERATION=false`), so a text without a clip falls
back to the browser's own voice. Run this after any change to Slovak text,
including new spelling cards. `--prune` also deletes clips no longer used.

### Word tiles: cut from the sentence (decided, not built yet)

Today a word tile is voiced on its own and keyed by its text, so one clip of
"je" serves all 48 tiles that say it. Short words (je, to, sa, a) come out wrong
without a sentence around them. The fix: every tile is cut from a take of its
own exercise's sentence.

1. **Voice the answer with timings.** `answers[0]` goes to ElevenLabs'
   `text-to-speech/{voice}/with-timestamps`, which returns the audio plus each
   character's start and end time. Words are the runs between spaces, punctuation
   dropped: the same split `toTiles` makes, so word *k* is tile *k*. The script
   fails if the counts differ. The same take can be the sentence played after
   Check.
2. **Cut each word with ffmpeg.** Cut at the middle of the pause between words,
   or at the alignment's boundary where there's no pause, with a few milliseconds
   of fade so nothing clicks.
3. **Wrong tiles come from the same frame.** Voice the sentence again with each
   distractor in place of the tile it competes with (its trap's `right`; a
   distractor without a trap takes the closest tile by form), and cut it out. One
   take can carry several distractors when they replace different tiles. The
   carrier sentence may be ungrammatical, since only the word is kept. A wrong
   tile must sound like a right one, or the sound gives the answer away.
4. **One-letter prepositions get no clip.** Slovak says v, z, s and k as part of
   the next word, so on their own they'd be a click. Tapping them plays nothing.
5. **Tile clips belong to their exercise,** keyed by exercise id, tile and the
   sentence text, not to the word. Everything else keeps its text-keyed clip.
6. **Checks:** word and tile counts match, every clip is long enough and not
   silent, and a sample is listened to before shipping.

Size, for the course as of October 2026: 136 exercises, 552 tiles and 280 wrong
tiles. That's about 9,300 characters with one take per distractor, less when
takes are shared.

Considered and set aside:
- **Each word alone, with the sentence as `previous_text`/`next_text`:** cheaper
  and no cutting, but still a separate take per word, with no guarantee that a
  short word comes out right.
- **ElevenLabs' forced alignment of the existing sentence clips:** fine for the
  right tiles without re-voicing, but the wrong tiles need new takes anyway.

## 10. Final checks and ship

```bash
npm run -s validate:course
```

```bash
npm run i18n:sync -- --check
```

```bash
npx tsc --noEmit && npx eslint src
```

Then commit and push to `main`: Vercel deploys it. Commits are authored as
`nmycd` (see the repo history).

## Automatic

These follow from the content; there's nothing to run.

- **Dictionary.** Every intro card, grammar-card example, matching pair and
  grammar card is indexed at build time and served as `/api/dictionary`, which
  the search on /learn fetches when first used. New content is searchable after
  the next deploy.
- **Word review deck.** Every intro card of up to three words (not a list)
  becomes a review item, reviewed both ways (recognition and recall) with FSRS
  once a learner meets it; served as `/api/review-deck`. A longer intro card
  (a sentence) simply stays out of review. An item takes its intro card's picture
  (the first lesson's with one): review shows it with the question when asking
  for the Slovak; when asking for the meaning, which the picture would give away,
  only after the answer (and not at all on phones).
- **Wrong options in review** are other review items shaped like the answer, so
  none gives itself away, and from its topic where possible, so the choice is a
  real one: rooms among rooms, a question among questions, an adjective among
  adjectives, about as long (`distractors` in
  [session.ts](src/lib/review/session.ts)). Part of speech and topic come from
  the word's tags (stage 2); the form from the card itself, so end a question
  with "?" and a sentence or greeting with "." or "!", and leave a bare word or
  phrase unpunctuated ("byt", "jedálny lístok").
- **Spelling cards in lessons** and **picture positions**: inserted and shifted
  as the course loads, from `spelling.json` and `illustrations.json`.
- **Word-order tiles** show in lowercase, so the capital doesn't give the first
  word away; names keep theirs ([tile-case.ts](src/lib/course/tile-case.ts)). A
  name the course only ever writes at the start of a sentence needs adding to
  `properNames` in `names.ts` (as "Martin" was).
- **Loading**: each lesson fetches its pictures and audio in the background as it
  starts.

## When you change existing content

| You change | Then |
| --- | --- |
| English text | `npm run i18n:sync`, retranslate the stale entries |
| Slovak text | `npm run generate:audio`; `npm run plan:spelling` if it's in or before a typed sentence; the picture plan if the exercise has a picture (its text snapshot no longer matches) |
| A typed sentence | `npm run plan:spelling`; add any new name to `names.ts` |
| The exercises in a lesson (add, remove, reorder) | `npm run course:ids` for new ones; `npm run plan:spelling`. Nothing else shifts: translations, `ref`s and pictures follow exercise ids. A removed exercise's picture fails `validate:course` until its entry leaves `map-uN.json` and `illustrations.json` |
| An exercise's lesson (moving it) | Its pointers change lesson (`u1-l1#…` → `u1-l2#…`): update `ref`s and picture entries as `validate:course` says, and move its translation entries before `npm run i18n:sync` |
| A lesson's pictures | Edit `map-uN.json`, `build-plan.ts`, then `render-plan.ts` |

## Never in git, never to the model

- The textbook PDF and its crops (`illustrations/book-refs/`).
- The style references (`illustrations/style-refs/`): pages from Beatrice
  Alemagna's *On a Magical Do-Nothing Day*. Fine for finding a look; before
  commercial use, replace them with a style sheet made from our own renders
  (see [DEBT.md](DEBT.md)).
- API keys (`.env.local` only).

## Not covered yet

Gaps in the pipeline, most also tracked in [DEBT.md](DEBT.md):

- **Native-speaker review.** The Slovak and the four translations were written
  and checked by AI. As of October 2026 the English has been read and is fine,
  Ukrainian and Russian readers are reviewing, and Uzbek and Georgian are
  planned. A Slovak teacher should still review the Slovak before launch.
- **Automation.** No CI runs the stage 10 checks; they're run by hand.
- **Word-tile audio** is still voiced word by word. Cutting tiles from the
  sentence is decided but not built: see stage 9, "Word tiles".
- **More than one course.** Lesson ids (`u1-l1`), progress and the dictionary
  assume A1 is the only course. A2, B1 and the driving exam need a multi-course
  data model first.
- **Grammar cards are mostly unillustrated**, and about 40 exercises reuse an
  earlier picture.
- **Spelling cards show a meaning** only for words taught on their own intro card;
  the rest are audio only.
- **The dictionary knows no synonyms**: "праворуч" doesn't find "направо".
- **Word tags cover review words only** (intro cards of up to three words), not
  the longer sentences or the words inside them, and record no aspect, case or
  declension pattern yet.
