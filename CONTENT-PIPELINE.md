# Content pipeline

How a unit of the course goes from the textbook to the live app, in order. Each
stage says what goes in, what to run, and what comes out. The detailed rules live
in the guides linked from each stage; this page is the map.

Stage 1 is done once per level, for every textbook lesson, before any unit is
written; stages 2–4 then run for each unit. Together they make a level complete
in one pass: A1 needed a whole second course, written afterwards from the
textbook's other edition, to show what its units had left out (see stage 3).

Everything here runs from the repo root. Paid steps are marked **$**.

| # | Stage | Run | Writes | |
| --- | --- | --- | --- | --- |
| 1 | [Inventory the textbook](#1-inventory-the-textbook) | a reader per lesson (the PDF scan) | `research/inventory/<level>/` (local), `levels/<level>.ts` | |
| 2 | [Write the unit](#2-write-the-unit) | | `src/lib/course/units/unitN.ts`, `lexicon.ts` | |
| 3 | [Check it](#3-check-it) | `npm run -s validate:course -- uN`, `npm run -s course:coverage -- uN` | | |
| 4 | [Review](#4-review) | a coverage review per unit, then an editorial pass | findings, decisions, then fixes | |
| 5 | [Translate](#5-translate) | `npm run i18n:sync` | `translations/{uk,ru,uz,ka}/unitN.json` | |
| 6 | [Spelling cards](#6-spelling-cards) | `npm run plan:spelling` | `src/lib/course/spelling.json` | |
| 7 | [Illustration plan](#7-illustration-plan) | `illustrations/tools/*` | `illustrations/plan/unitN.json` | |
| 8 | [Render pictures](#8-render-pictures) | `render-plan.ts` | `public/illustrations/`, `illustrations.json` | **$** |
| 9 | [Record audio](#9-record-audio) | `npm run generate:audio` | phrase, tile and word clips in Supabase Storage | **$** |
| 10 | [Final checks and ship](#10-final-checks-and-ship) | checks, then push to `main` | the live site | |

The dictionary on /learn needs no step: it's [built from the content](#automatic).

### More than one course

A1 is live; A2 is being written beside it. Every stage runs the same way for A2,
with `--course a2` on each script (A1 without it) and A2's own files:

| | A1 | A2 |
| --- | --- | --- |
| Units (stage 2) | `src/lib/course/units/unitN.ts` | `src/lib/course/a2/units/unitN.ts`, listed in `a2/index.ts` |
| Ids | `u3`, `u3-l1`, `u3-rodina` | `a2-u3`, `a2-u3-l1`, `a2-u3-vianoce` |
| Checks (3) | `validate:course -- u3`, `course:coverage -- u3` | `validate:course -- --course a2 a2-u3`, `course:coverage -- a2 a2-u3` |
| Translations (5) | `translations/<locale>/unitN.json` | `a2/translations/<locale>/unitN.json` |
| Spelling cards (6) | `spelling.json` | `a2/spelling.json` |
| Picture plan (7) | `illustrations/plan/`, crops in `illustrations/book-refs/` | `illustrations/plan/a2/`, crops in `illustrations/book-refs/a2/` |
| Pictures (8) | `illustrations.json` | `a2/illustrations.json` |
| Premium | units 1–2 free | every unit |

Ids are unique across courses, so progress, translations, pictures, spelling
cards and audio clips are keyed by them, and picture and audio files share one
folder or cache. A1 comes before all of A2: an A2 explanation may `ref` an A1
grammar card, and A1's words count as taught. Word review is one deck for both
courses; word tags (`lexicon.ts`) and names (`names.ts`) are shared too. A
writing lesson's word pool is its own course's. The details for writers:
[AUTHORING.md](src/lib/course/AUTHORING.md), "More than one course".

**A course is hidden until it's launched.** Its tab says "coming soon" and its
lessons don't open, except for dev-mode accounts (`app_metadata.dev`), who see
its path and play it. The switch is one line: `launched: true` on the course's
entry in [courses.ts](src/lib/course/courses.ts). The pricing page then lists it
among Premium's perks.

## 1. Inventory the textbook

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

Before any unit of a level is written, three things, in this order:

1. **An inventory per textbook lesson.** One reader per lesson, who opens the
   book and nothing else, writes down what it teaches: its grammar, situations
   and functions with page numbers, and its glossary entry by entry. Three
   files per lesson in `research/inventory/<level>/`: the inventory for people
   (`unitN-inventory.md`), the glossary (`glossary-LN.tsv`) and the points with
   the markers the gate searches for (`points-LN.tsv`). The brief, with the
   formats, is [INVENTORY.md](src/lib/course/INVENTORY.md). They stay in
   `research/`, which is git-ignored: they transcribe the book. A1's are in
   `research/comparison/kk1/`.
2. **The level's checklist**, from outside the book: what CEFR's
   self-assessment grid and the Slovak minimum (Kvapil et al. 2018) require at
   this level, item by item, in `src/lib/course/levels/<level>.ts`
   ([A1's](src/lib/course/levels/a1.ts); committed, since it's our summary of
   public standards). Both editions of the A1
   book leave out the compound future and barely touch health; only an outside
   list shows that. The same file lists the level's everyday **word fields**
   (core words only) and maps textbook lessons to units.
3. **A unit for everything**: each checklist item and field gets the unit that
   will teach it (`in: ["u4"]`), so no item is left for "some unit" to pick up.

Each unit writer then gets the lesson's inventory and the checklist items
placed in the unit.

## 2. Write the unit

One file per unit, `src/lib/course/units/unitN.ts`, in English and Slovak only.
[AUTHORING.md](src/lib/course/AUTHORING.md) has the rules: lessons in the book's
order, a review lesson last, 10–18 exercises a lesson, introduce before testing, the exercise
types and how grammar cards are written. The types are in
[types.ts](src/lib/course/types.ts).

Write from the lesson's inventory (stage 1): its functions and situations, its
everyday words as well as its topic, and the checklist items placed in this
unit. Stage 3 measures all three.

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

### The coverage gate

```bash
npm run -s course:coverage -- u3
```

Does the unit teach what its textbook lesson and the level's standards say it
must? [course-coverage.ts](scripts/course-coverage.ts) answers in four parts:

1. **Glossary.** The lesson's glossary (`glossary-LN.tsv`) against every word
   the course uses, overall and by everyday field: family, food, shops and
   paying, people, free time, phone and contact, time, health… An entry counts
   when all its words are used somewhere in the course's Slovak, matched by
   stem (prídem counts for prísť). A word that appears only in an English note
   is *mentioned*, not taught, and the output says where.
2. **Core words.** The level's fields (in `levels/<level>.ts`) against the
   whole course, with its four topic fields as controls.
3. **Points.** Each grammar point, situation and function of the lesson
   (`points-LN.tsv`), found when all its markers match. Every miss must be
   decided in stage 4.
4. **Checklist.** Each outside-standard item is placed (`in`), the lessons named
   exist, and its probe matches in them, so the record can't go stale; `open`
   items stay flagged.

It exits with code 1 when anything is flagged. Without the local inventory
(`research/` isn't in git) parts 1 and 3 are skipped with a note and the rest
still runs. `-- a2` picks a level, `--detail` lists every miss and every
decision, `--find 'regex'` shows where the course says something, and
`--planned` checks each checklist item against its whole unit, as placed in
stage 1, before its lessons exist (or to backtest an older course).

**Thresholds**, from what the A1 comparison measured on the course before its
fix:

| Check | Flagged when | Why |
| --- | --- | --- |
| A field of core words, whole course | under 70 % | The fields the course had dropped were at 10–59 % (family 2/20, free time 4/15), the fields of its own topics at 80–92 %, an independent course written for full coverage at 94–100 %. 70 % sits in the gap with room either way, and still lets a unit leave out three words in ten for good reasons. |
| A field of one lesson's glossary | under 70 %, from 4 entries | The same line; below 4 entries a single word moves the share by a quarter or more. |
| A textbook point | not found and not decided | One point is one rule or one can-do. A share can't tell a course with A1's gaps from one without: the A1 course found 65 % of its book's points before its fix and 69 % after. The 35 points the fix closed (paying by card, answering the phone, the plural cases…) are what tell them apart. |
| A checklist item | unplaced, unverified or `open` | Every requirement has a lesson, or a reason it hasn't. |
| The glossary overall | never (reported only) | It measures the glossary's size more than the course's choices: the A1 book's lesson 4 has 297 entries, most of them nationalities and jobs. The fields measure the choices. |

What it can't see: whether a matched point is practised or only shown, how much
practice each point gets, and words that no field lists. That's the review's
job (stage 4).

**On A1.** Run on the course as it was before the A1 comparison found its gaps
(git tag `a1-before-additions`, 67 lessons, with `--planned`) and on the course
after the eleven lessons that closed them (88 lessons):

| | Before | After |
| --- | --- | --- |
| Glossary words taught (not gated) | 34 % | 39 % |
| Core-word fields under 70 % | 11 of 11 everyday fields; controls pass | 5: people around you 1/7, food 15/24, shops and paying 10/16, clothes 5/14, countries 9/15 |
| Lesson glossary fields under 70 % | 13 | 6 |
| Checklist | 30 of 48 covered, 12 failing: family, shopping, free time, telephoning, the three plural cases, the compound future, health… | 41 covered, 0 failing, 7 open (all listed as open in the comparison) |
| Textbook points found | 507 of 780 (65 %) | 542 (69 %), none lost |

It reproduces the comparison's numbers exactly (34 % of the glossaries, family
2/20, food 8/24, shops 6/16) and flags every gap the comparison ranked. On the
current course what's left is what the comparison still lists as open (clothes,
the neighbouring countries, letter formulas, the adverbs určite/možno/asi, the
instrumental of tools) and words the eleven lessons put only in an English note
(pokladňa, potraviny, drogéria, pomaranč). The coverage review (stage 4a) of the
238 points still unfound: 40 taught in other words, 49 book scenes proposed as
skips, and 149 real gaps, 6 of them high and 43 medium. Most of those the
comparison never saw: "Čo je to?", "Ja tiež", prečo and pretože, "Môžete mi
pomôcť?", "Dobre." as a reply, mať + infinitive (the six high ones were added
to u2-l3, u2-l4, u2-l5, u6-l6 and u7-l4 the same day). Its spot checks of found points
turned up 35 more that the markers matched but the course doesn't teach (a word
in a note, half a function), so "found" is optimistic: the review is not
optional.

## 4. Review

### 4a. Coverage review, each unit

One skeptical reader per draft unit, who didn't write it, reads it against its
inventory, the gate's run on it and the checklist items placed in it. Every
flag is classified (a real gap, taught under another form, not for this
level, a false find), and the reader looks for what the gate can't see: a
function only mentioned in a note, half a function (answering the phone but not
ending the call), everyday words no field lists, a grammar point with two
drills where the others get eight. One pass, not a second course: the output
is a ranked findings list with the smallest fix for each, and proposed
decisions. The owner picks; fixes are written; decisions go into
`decisions.tsv` next to the inventory; the gate runs again. The brief is
[COVERAGE-REVIEW.md](src/lib/course/COVERAGE-REVIEW.md).

### 4b. Editorial pass, whole course

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
thousand characters. Needs `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, the
Supabase keys in `.env.local`, and ffmpeg installed.

```bash
npm run generate:audio -- --dry-run
```

```bash
npm run generate:audio -- --budget 5000
```

Every Slovak text the app can play is pre-generated into Supabase Storage.
Production never generates audio (`TTS_LIVE_GENERATION=false`), so a text without
a clip falls back to the browser's own voice. Run this after any change to Slovak
text, including new spelling cards; it makes only what's missing, so new lessons
get all their clips, word tiles and single words included. Keep a `--budget` on
it (characters, all steps).

### Short words are never voiced on their own

A word voiced alone comes out wrong: je, to, sa, ma, ťa lose a sound, take an odd
tone, or don't even sound Slovak. Cut out of a fluent sentence it's no better: its
first or last sound blends into its neighbour, and the clip loses it. So **every
word the app plays by itself is voiced in a take of several words said one at a
time**, "To… je… naša… kuchyňa…", and cut out at the pauses:

| What plays | Its clip | Made by |
| --- | --- | --- |
| A sentence or phrase (intro card, listen, speak, fill, grammar example, "Prosím?") | voiced as written, one clip per text | the phrases step |
| A word tile, right or wrong, in a word-order exercise with a Slovak answer | from one take of that exercise's tiles: "To… je… naša… kuchyňa… náš… naše…" | [tile-audio.ts](scripts/tile-audio.ts) |
| A single word anywhere else: matching pair, intro card, spelling card, Slovak option, word review | from a take of eight of the course's single words, long and short mixed | [word-audio.ts](scripts/word-audio.ts) |
| v, z, s, k as a tile | nothing: Slovak says them as part of the next word | (`isSilentTile`) |

A "single word" is one word without a "?", "!" or "." after it (`isBareWord`):
"Prosím?" and "Ďakujem." are utterances with a tone of their own and keep their
phrase clips.

**What an author does:** nothing special. Run `generate:audio`; it reports every
word whose clip failed, and those keep playing their phrase clip (the old
problem) until fixed. Listen to a new lesson's tiles and words; in dev mode (an
account with `app_metadata.dev`) each word-order exercise also shows its tiles in
every style compared below.

**When a word sounds wrong** (as "kytica" once came out "kutikva"):
- a single word: `npm run generate:audio -- --words-only --redo kytica` voices it
  in a new take among long words (said, not kept) and replaces its clip if the new
  one passes the checks; then bump `WORD_CLIPS_VERSION`;
- a tile that ran into its neighbour: run with `--revoice` (a new take, paid);
- a tile that passed the checks but sounds wrong: delete its clip in
  `tile-styles/e2/` and its take in `takes/` (paths from `tileCachePath` and
  `takeCachePath` in [tts-cache.ts](src/lib/tts-cache.ts)), run with
  `--only <exercise> --seed 2` (the same words and seed may come out the same),
  and bump `TILE_CLIPS_VERSION`.

A new take can come out wrong too: listen to it before shipping.

### How the takes are cut

1. **The take.** The words go to ElevenLabs'
   `text-to-speech/{voice}/with-timestamps` joined with "… ", which returns the
   audio and each character's start and end. Words are the runs between spaces,
   punctuation dropped (the split `toTiles` makes); a take whose words don't match
   fails. In one Slovak take the voice keeps to Slovak and says short words at
   full length (je, ma, ťa 0.2–0.4 s). A tile take holds the exercise's right and
   wrong tiles alike, so the sound gives no answer away.
2. **The cut.** Between two words the cut goes in the middle of the longest pause
   (50 ms or more below −40 dBFS) between the words' middles. A word with no pause
   on one side ran into its neighbour: it fails and isn't stored. Words that ran
   together get one more take with another seed (tiles: the same words; single
   words: in new takes with each other), and the better result is kept.
3. **The finish.** The silence at a clip's ends is trimmed to a little, 60 ms of
   silence goes first (so the word isn't lost while the audio output wakes up),
   and the ends fade so nothing clicks; 128 kbps MP3.
4. **The checks.** Each clip has a pause on both sides, lasts at least 0.08 s and
   at most 0.6 s longer than its word's timing, and isn't silent (peak above
   −30 dBFS). A clip that fails isn't stored (an older one is removed), and the
   run exits with an error.
5. **Storage.** Tile clips in `tile-styles/e2/`, keyed by exercise
   ("u3-l1#build-kde-je-kupelna"), sentence and tile, so a changed sentence gets
   new clips; their takes in `takes/`. Single-word clips in `words/`, keyed by the
   text; their takes in `word-takes/`, whose timings give their words back. Takes
   are kept, so clips can be cut again without paying twice.
6. **Playing.** A tile asks for `/api/tts?text=je&in=u3-l1%23build-kde-je-kupelna&v=3`,
   a single word for `/api/tts?text=ma&v=1`. The route serves only a tile of that
   exercise, or a word of the course, and falls back to the phrase clip while
   there's none; it never voices or cuts anything itself. The `v` keeps browsers
   from holding old clips: bump `TILE_CLIPS_VERSION` or `WORD_CLIPS_VERSION` in
   [helpers.ts](src/lib/course/helpers.ts) after making clips again. There too,
   `LESSON_TILE_STYLE` (`"e2"`, or null) and `WORD_CLIPS` switch back to the phrase
   clips; those were never overwritten.

Flags:

```bash
npm run generate:audio -- --tiles-only --only u3-,u1-l3#build-volam-sa-tomas --dry-run
```

- `--tiles-only` or `--words-only` runs one step; `--only` takes exercise key
  prefixes (tiles).
- `--budget <characters>` voices nothing more once that many are spent, second
  takes included.
- `--revoice` gives stored tile takes whose words ran together one more take (paid).
- `--seed <n>` voices new takes with another seed (default 1), to redo one.
- `--redo <words>` voices these single words again in new takes (with
  `--words-only`).
- `--recut` cuts every clip again from its stored take, for free, after a change
  to the cutting; then bump the version.
- `--styles` also makes the comparison styles below for dev mode (A to D, free);
  `--styles e1` makes the named ones.
- `--save <dir>` also writes takes and clips there to listen to (keep it outside
  the repo).
- `--prune` also deletes clips and takes nothing uses any more, and the old
  `tiles/`.

Size, for the course as of October 2026:
- **Word tiles:** 151 exercises, 899 tiles, a take each, 6,303 characters with
  second takes. 16 takes ran words together; 15 came out clean the second time.
  "Dám… si…" (u6-l7) is said as the phrase "Dám si" both times, so those two tiles
  play the words' phrase clips, and every run reports them as failed: expected.
- **Single words:** 246, 31 takes, 1,982 characters; 4 words needed a second take.
  Redone by ear: kytica.

### How we got here: the styles compared

| | What | Made with |
| --- | --- | --- |
| A | Cut from a take of the answer sentence, as said | `--styles` (free) |
| B | A, with 60 ms of silence first | `--styles` (free) |
| C | B, words under 0.16 s slowed to 0.16 s, pitch kept | `--styles` (free) |
| D | B, slowed to 0.20 s | `--styles` (free) |
| E1 | Word by word, "To. Je. Naša." | `--styles e1` **$** |
| **E2** | **Word by word, "To… je… naša…" (lessons)** | default **$** |

At first a tile was voiced alone, keyed by its text, and short words sounded off.
Then A to D cut each tile out of a take of the answer sentence (wrong tiles from
the same sentence with the wrong word swapped in). In fluent speech je, a, sa took
as little as 0.08 s, and a tester found every cut lost the first or last sound of
je, to, sú, kde; slowing (C, D) only stretched what was left. Word by word fixed
it: tried on 6 exercises, the voice paused at 24 of 28 word boundaries with
periods (E1) and at 27 of 28 with "…" (E2). Single words played elsewhere had the
same problem as the first tiles, and got the same fix. The sentence takes (326,
7,233 characters) and the A to D clips are kept for comparison in dev mode.

Not done: the sentence played after Check is its own phrase clip, not from these
takes.

Considered and set aside:
- **Each word alone, with the sentence as `previous_text`/`next_text`:** a take
  per word, with no guarantee that a short word comes out right or in Slovak.
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

For A2, the first two with `--course a2` as well.

Then commit and push to `main`: Vercel deploys it. Commits are authored as
`nmycd` (see the repo history).

## Automatic

These follow from the content; there's nothing to run.

- **Dictionary.** Every intro card, grammar-card example, matching pair and
  grammar card is indexed at build time and served as `/api/dictionary`, which
  the search on /learn fetches when first used. New content is searchable after
  the next deploy. It holds every course; the search shows the courses a learner
  can see (A2 for dev mode only, until launch), and names each result's course
  once there's more than one.
- **Word review deck.** Every intro card of up to three words (not a list)
  becomes a review item, reviewed both ways (recognition and recall) with FSRS
  once a learner meets it; served as `/api/review-deck`. A longer intro card
  (a sentence) simply stays out of review. An item takes its intro card's picture
  (the first lesson's with one): review shows it with the question when asking
  for the Slovak; when asking for the meaning, which the picture would give away,
  only after the answer (and not at all on phones). One deck for every course: a
  word taught in A1 and in A2 is one item; a session draws on the courses the
  learner can see.
- **Wrong options in review** are other review items shaped like the answer, so
  none gives itself away, and from its topic where possible, so the choice is a
  real one: rooms among rooms, a question among questions, an adjective among
  adjectives, about as long (`distractors` in
  [session.ts](src/lib/review/session.ts)). Part of speech and topic come from
  the word's tags (stage 2); the form from the card itself, so end a question
  with "?" and a sentence or greeting with "." or "!", and leave a bare word or
  phrase unpunctuated ("byt", "jedálny lístok").
- **Spelling cards in lessons** and **picture positions**: inserted and shifted
  as the course loads, from each course's `spelling.json` and `illustrations.json`.
- **Noun gender on cards**: a single noun's intro card shows its gender (or plural
  only), added as the course loads from its tags in `lexicon.ts`.
- **Memorize words** (writing lessons, tentative): each lesson's pool is the intro cards of up
  to three words since the previous writing lesson, in its own course. The rounds
  are dealt from it afresh each time the lesson starts, about 36 letters each (2–5 words); rounds the
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
| Lessons named in a level's checklist (renamed, moved, rewritten) | `npm run -s course:coverage`: it names each item whose lessons or probe no longer hold; update `in` in `levels/<level>.ts` |

## Never in git, never to the model

- The textbook PDF and its crops (`illustrations/book-refs/`).
- The textbook inventories, points and coverage decisions (`research/`, stage 1),
  and anything quoted from them.
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
- **Free production.** No exercise asks the learner to type a Slovak sentence
  from scratch, so the gate's "taught" means seen and assembled from tiles, not
  produced.
- **Grammar cards are mostly unillustrated**, and about 40 exercises reuse an
  earlier picture.
- **Spelling cards show a meaning** only for words taught on their own intro card;
  the rest are audio only.
- **The dictionary knows no synonyms**: "праворуч" doesn't find "направо".
- **Word tags cover review words only** (intro cards of up to three words), not
  the longer sentences or the words inside them, and record no aspect, case or
  declension pattern yet.
