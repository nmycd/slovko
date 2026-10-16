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
A single noun's card also shows its gender ("feminine", "plural only") from these
tags, so a wrong gender tag is a mistake learners see.

**Give person cards their other gender**: a card about a person whose Slovak form
depends on gender gets `otherGender: { sk, gender }`, the form for the other gender.
That covers jobs (`čašník` → `čašníčka`) and phrases said by or to a woman or a man
(`Som chorá.` → `Som chorý.`). The card shows it as "For a woman: čašníčka". Skip
cards that already give both forms ("Slovák, Slovenka"), and don't repeat it in the
`note`. It's text only, with no audio. AUTHORING.md has the details (`intro`).

**Explain the multiple-choice answers**: give each `choice` and `fill` whose
answer can be reasoned out (not a pure vocabulary check) a `why`, and a `ref` to
the grammar card it rests on; give each word-order exercise with a Slovak answer
`traps` for its wrong tiles. All as in AUTHORING.md, "Explanations after a wrong
answer".

### Writing practice (tentative)

> **Tentative.** This is an experiment from October 2026 and may be reverted (tag
> `pre-writing-practice`; see [DEBT.md](DEBT.md)). Write new units this way while it
> stands, but expect the rules below to change.

Most of the writing (typing Slovak) happens in one lesson per unit, kept apart
from the lessons that present and drill words and grammar:

- **The writing lesson**: `kind: "writing"`, id `uN-pisanie`, title "Píšeme"
  ("Written practice"), placed **just before the unit's review lesson**. It holds
  only two kinds of exercise:
  - **Memorize rounds**: up to five bare stubs, `{ id: "memorize-1", type: "memorize" }`.
    Each is dealt words when the lesson starts (see [Automatic](#automatic)): about
    the same typing every round, 36 letters or so, so 2–5 words, more short ones
    ("byt") or fewer long ones ("Koľko máš rokov?"). The learner studies them and
    presses "I'm ready"; the rows blur and clear with the meanings in a new order and
    a box for each word, typed from its meaning. Only letter-perfect words count,
    accents included; the score is the share of words right. A missed round comes
    back once at the end.
  - **The unit's dictations** (`listen`): one after the second round, the rest at
    the back, using the words the rounds practised.
- **Standard lessons keep very few dictations**: two in unit 1, so learners see
  early that the course asks them to write, and one in every later unit. A new
  dictation goes into the writing lesson, not a standard one. Only these few
  sentences get spelling cards (stage 6), about two dozen across the course.
- **Optional on the path**: a writing lesson opens once the learner reaches it, and
  never locks what follows. Unit completion, the course percentage and word review's
  unlock after unit 1 all leave it out.
- **Nothing new to write or generate**: the words come from the unit's intro cards
  and the dictations are ordinary `listen` exercises with their usual audio. Only
  the lesson's title is new text for stage 5.

Stage 3 enforces the shape: a writing lesson holds memorize rounds (at least one)
and dictations only, and memorize rounds appear nowhere else.

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

Before a word turns up in a typed sentence ("Type what you hear") in a standard
lesson, the learner types it once on its own, on a spelling card. Sentences in a
writing lesson don't get cards: its memorize rounds practise the unit's spelling
instead, so only the few dictations left in standard lessons do (tentative: see
stage 2, "Writing practice"). A script places
the cards:

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
spelling words) is pre-generated into Supabase Storage, and so is each word
tile's clip, cut from a take of its exercise's words said one at a time (below). Production never
generates audio (`TTS_LIVE_GENERATION=false`), so a text without a clip falls
back to the browser's own voice. Run this after any change to Slovak text,
including new spelling cards. `--prune` also deletes clips no longer used.

### Word tiles: said one at a time

A short word voiced on its own (je, to, sa, a) comes out wrong: alone, the voice
may not even take it for Slovak. So a word tile in an exercise with a Slovak
answer plays its word as said in a take of the exercise's own words, one at a
time. `generate:audio` makes these after the phrases, in
[tile-audio.ts](scripts/tile-audio.ts):

1. **One take per exercise, word by word.** The exercise's tiles, right then
   wrong, each once, go to ElevenLabs' `text-to-speech/{voice}/with-timestamps`
   joined with "…": "To… je… naša… kuchyňa… náš… naše…". It returns the audio and
   each character's start and end. Words are the runs between spaces, punctuation
   dropped, the split `toTiles` makes; a take whose words don't match fails. In
   one Slovak take the voice knows the language, says short words at full length
   (je 0.2–0.4 s), and says right and wrong tiles alike, so the sound gives no
   answer away.
2. **Cut at the pauses.** Between two words the cut goes in the middle of the
   longest pause (50 ms or more of quiet below −40 dBFS) between the words'
   middles. A word with no pause on one side ran into its neighbour: it fails and
   isn't stored. A take whose words ran together is voiced once more with another
   seed, and the better take is kept. The silence at a clip's ends is trimmed to a
   little, 60 ms of silence goes first (so the word isn't lost while the audio
   output wakes up), and the ends fade so nothing clicks. ffmpeg decodes and
   encodes (128 kbps MP3); it must be installed.
3. **One-letter prepositions get no clip.** Slovak says v, z, s and k as part of
   the next word, so on their own they'd be a click. They're left out of the take,
   and tapping them plays nothing (`isSilentTile` in
   [helpers.ts](src/lib/course/helpers.ts)).
4. **Clips belong to their exercise:** `tile-styles/e2/` in the bucket, keyed by
   exercise ("u3-l1#build-kde-je-kupelna"), sentence and tile, so a changed
   sentence gets new clips. The takes stay in `takes/` (audio and timings), so
   clips can be cut again without paying twice. The app asks for
   `/api/tts?text=je&in=u3-l1%23build-kde-je-kupelna&v=3`; the route serves only a
   tile of that exercise, in `LESSON_TILE_STYLE`, and the word's own clip until
   that exists. It never voices or cuts tiles itself.
5. **Checks:** each take's words match its tiles; each clip has a pause on both
   sides, is at least 0.08 s, at most 0.6 s longer than its word's timing, and not
   silent (peak above −30 dBFS). A clip that fails isn't stored (an older one is
   removed), and the run exits with an error.

Flags for the tiles:

```bash
npm run generate:audio -- --tiles-only --only u3-,u1-l3#build-volam-sa-tomas --dry-run
```

- `--tiles-only` skips the phrases; `--only` takes exercise key prefixes.
- `--budget <characters>` voices nothing more once that many are spent, re-voices
  included. Use it on any large run.
- `--revoice` voices again, once, stored takes whose words ran together (paid).
- `--recut` cuts every clip again from its stored take, for free, after a change
  to the cutting. Then bump `TILE_CLIPS_VERSION` in
  [helpers.ts](src/lib/course/helpers.ts), or browsers keep the old clips for up
  to a week.
- `--styles` also makes the comparison styles below for dev mode (A to D, free);
  `--styles e1` makes the named ones.
- `--save <dir>` also writes the takes and clips there, with an `index.html` to
  listen to them on (keep it outside the repo).
- `--prune` also deletes tile clips and takes no exercise uses any more, and the
  old `tiles/`.

Size, for the course as of October 2026: 151 exercises, 899 tiles, one take each,
5,934 characters (6,303 spent in the run that made 145 of them, re-voices
included). 16 takes ran words together; voiced again, 15 came out clean. "Dám…
si…" (u6-l7) is said as the phrase "Dám si" both times, so those two tiles play the
words' own clips, and every run reports them as failed: expected, not a new
problem.

#### How we got here: the styles compared

Dev mode (an account with `app_metadata.dev`) shows, under each word-order
exercise with a Slovak answer, a row of its tiles in each style of `tileStyles`,
to compare by ear in the lesson itself. Lessons play `LESSON_TILE_STYLE`.

| | What | Made with |
| --- | --- | --- |
| A | Cut from a take of the answer sentence, as said | `--styles` (free) |
| B | A, with 60 ms of silence first | `--styles` (free) |
| C | B, words under 0.16 s slowed to 0.16 s, pitch kept | `--styles` (free) |
| D | B, slowed to 0.20 s | `--styles` (free) |
| E1 | Word by word, "To. Je. Naša." | `--styles e1` **$** |
| **E2** | **Word by word, "To… je… naša…" (lessons)** | default **$** |

A to D cut each tile out of a take of the answer (wrong tiles from the same
sentence with the wrong word swapped in), at the pauses or at the timings'
boundary. In fluent speech a short word's edge blends into its neighbour: in a
sentence je, a, sa took as little as 0.08 s, and a tester found every cut lost
the first or last sound of je, to, sú, kde. Slowing (C, D) only stretched what
was left. The sentence takes (326, 7,233 characters) and the A to D clips are
kept for comparison, made for the course as of October 2026.

Tried on 6 exercises first: with periods (E1) the voice paused at 24 of 28 word
boundaries and ran "Kuchyňa. Náš. Naše." together; with "…" (E2), at 27 of 28.

Not done: the sentence played after Check is its own clip, not from these takes.

Considered and set aside:
- **Each word alone, with the sentence as `previous_text`/`next_text`:** no
  cutting, but a separate take per word, with no guarantee that a short word
  comes out right or in Slovak.
- **ElevenLabs' forced alignment of the existing sentence clips:** cheaper, but
  cutting from fluent speech is what failed.

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
- **Noun gender on cards**: a single noun's intro card shows its gender (or plural
  only), added as the course loads from its tags in `lexicon.ts`.
- **Memorize words** (writing lessons, tentative): each lesson's pool is the intro cards of up
  to three words since the previous writing lesson. The rounds are dealt from it
  afresh each time the lesson starts, about 36 letters each (2–5 words); rounds the
  pool can't fill are left out.
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
