# Inventory a textbook lesson

Stage 1 of [CONTENT-PIPELINE.md](../../../CONTENT-PIPELINE.md#1-inventory-the-textbook).
Before any unit of a level is written, one reader per textbook lesson records
what that lesson teaches: its grammar, situations and functions with page
numbers, and its glossary word for word. The unit writer works from this
inventory, and the coverage gate (stage 3) checks the unit against it.

Why: A1's units were written from the PDF alone, with nothing to measure them
against. Each writer kept the unit's topic words (the dorm, the town, the
office) and dropped the book's everyday core: family 2 of 20 core words,
shopping and paying 6 of 16, free time 4 of 15, the phone, words for people,
the plural cases. It took a second, independent course to see it.

## Where it lives

`research/inventory/<level>/` (A1's is `research/comparison/kk1/`, made before
this convention). **`research/` is git-ignored and stays local**: the
inventory transcribes a copyrighted book. Never commit it or paste it into a
committed file; the repo is public.

| File | What |
| --- | --- |
| `unitN-inventory.md` | The inventory of lesson N, for people (below) |
| `glossary-LN.tsv` | Its glossary, for the gate |
| `points-LN.tsv` | Its grammar, situations and functions, with markers the gate searches for |
| `decisions.tsv` | Written later, by the coverage review (stage 4) |

The level's file in [levels/](levels/) names the folder and which unit
teaches which lesson.

## Independence

The reader opens the book and nothing else: not `src/`, not an earlier course,
not git history. The inventory records what the book teaches, so that the
course can be measured against it; a reader who has seen the course starts
writing down what the course already has.

## Reading the book

Render the lesson's pages and its glossary pages to images (the scans have no
text layer) and read every page, zooming into dense boxes. Note the offset
between PDF and printed page numbers; quote PDF pages. Read the glossary in the
book's back matter column by column: it is the best word list, and the one the
gate counts against.

## `unitN-inventory.md`

Model: `research/kk2/notes/unit5-inventory.md` and
`research/comparison/kk1/unit5-inventory.md`. Sections:

1. **Page map.** One line per page: what it does (dialogue, picture page,
   grammar page, drills), its situation, and any rule box on it.
2. **Grammar, in book order.** Each point with its pages and how the book
   presents it: a table, a rule box, a drill, or only used. Give the forms.
   Then a separate list of forms the lesson **uses before teaching** them
   (they are not points).
3. **Glossary transcription.** Every entry as printed, numbered, with its
   grammatical information and English, sub-entries marked, and the phrase
   list (FRÁZY) at the end. Keep printed oddities. Give the counts.
4. **Vocabulary taught outside the glossary.** Picture labels, LEXIKA boxes,
   word banks.
5. **Situations.** Where the lesson's dialogues and picture pages are set: in
   the shop, on the phone, at the doctor's.
6. **Functions.** "After this lesson a learner can…", one can-do per line, with
   pages and the Slovak the book uses for it.
7. **Pronunciation and spelling**, where the lesson has any.
8. **Hard to practise in an app**, and **the book's cast** (never reused).

## `glossary-LN.tsv`

Tab-separated, UTF-8, with a header line:

```
sk	info	en	section
obchod	(Mn), -u, -y	shop	word
obchodný dom	–	department store	sub
Ešte niečo?	–	Anything else?	phrase
```

`section` is `word`, `sub` (a dash sub-entry) or `phrase`. One row per entry,
in the book's order. An optional fifth column, `field`, puts an entry in one of
the level's word fields when its words alone wouldn't (`ísť nakupovať` →
`shops and paying`).

## `points-LN.tsv`

Everything the lesson **teaches** that isn't a single glossary word, in a form
the gate can search for:

```
id	kind	point	pages	markers
L5.g1	grammar	ísť / prísť / odísť, full present tense	PDF 68, 76	\bidem\b|\bideš\b|\bidú\b ; \bprídem\b|\bpríde\b|\bprídu\b
L5.s3	situation	Buying in a shop and paying at the till	PDF 68	\bobchod|\bpokladň ; \bplat(iť|ím|íte)\b|\bzaplat
L5.f5	function	Pay: choose cash or card	PDF 68	\bkartou\b|\bv hotovosti\b
```

- **id**: `L<lesson>.<letter><n>`, with `g` grammar, `p` pronunciation, `s`
  situation, `f` function, numbered in book order. Decisions point at it, so it
  never changes.
- **kind**: `grammar`, `pronunciation`, `situation` or `function`.
- **point**: in your own words, at most about 110 characters. Never a sentence
  from the book or a name of its cast.
- **pages**: PDF pages.
- **markers**: regex groups separated by ` ; `. The point is found when
  **every** group matches somewhere in the course; `|` gives alternatives inside
  a group. Case-insensitive, accents as written; `\b` is a word boundary that
  knows Slovak letters.

What makes a point: a table, a rule box, a drill, a picture page built around
something, a situation, or a can-do. One row per thing a course could teach on
its own: the six forms of a verb are one point, the singular and the plural of
a case are two. Forms used before they're taught are not points. Aim for
completeness: the review decides what matters.

Markers are the hard part. They must be **sensitive** (a course that teaches
the point in its own sentences, with its own names, matches) and **specific**
(a course that doesn't, doesn't):

- Match what a learner would have to see to learn the point: its forms, set
  phrases and key words, never the book's sentences, which the course may not
  copy. Give alternatives for inflected forms and for synonyms a course might
  pick instead.
- For grammar, match forms in context, not bare endings: `\w+ov\b` also
  matches domov and rokov, so list typical forms (`\b(študentov|kamarátov|bratov)\b`)
  or put the ending after the word that governs it. Ask: would this match a
  course that only teaches the singular?
- Use two groups when a point needs two things: a contrast (`viem ; poznám`),
  a call that both opens and closes (`haló|tu je ; dopočutia`).
- Never a word that matches anything (je, to, sa); "prosím" alone is also
  "please" and "pardon".
- What can't be searched for (stress on the first syllable) gets its best key
  word, English included: grammar cards are written in English.

Test each regex on two sentences that teach the point and two that don't, and
check the file parses: five tab-separated fields per row, unique ids.

## After the inventories: the level

Once every lesson is inventoried, fill the level's file in [levels/](levels/)
(A1's is the model; A2's slot says what's missing):

- **The checklist**: what the outside standards require at this level, item by
  item (CEFR's self-assessment grid and the Slovak minimum in Kvapil et al.
  2018, for A1 and A2). These catch what the book itself leaves out: both A1
  editions skip the compound future and barely touch health.
- **Fields**: the level's everyday word fields, core words only, plus three or
  four of the units' own topics as controls.
- **A unit for every item and field**, before writing starts (`in: ["u4"]`).
  The unit writers get their lesson's inventory and the items placed in their
  unit.
