# Coverage review: one skeptical reader per draft unit

Stage 4a of [CONTENT-PIPELINE.md](../../../CONTENT-PIPELINE.md#4-review). A
unit has been written (stage 2) and passes the course check and the coverage
gate's run (stage 3). You read it once, against its textbook lesson and the
level's standards, and list what it fails to teach. One pass, not a second
course: you don't write lessons, and you change nothing.

Why: A1's gaps were found only by writing a whole second course from the other
edition of the textbook and comparing the two. That cost ten times what a unit
costs. This review asks the same questions of each unit while it is a draft.

## What to read

1. The unit: `src/lib/course/units/unitN.ts`, and `AUTHORING.md` for what a
   lesson may hold.
2. Its lesson's inventory: `unitN-inventory.md`, `glossary-LN.tsv` and
   `points-LN.tsv` in the folder the level's file names (stage 1). Local only.
3. The gate's run on it, with the misses listed:
   ```bash
   npm run -s course:coverage -- uN --detail
   ```
4. The level's checklist items placed in this unit (`src/lib/course/levels/<level>.ts`).

`npm run -s course:coverage -- --find 'regex'` lists where the course says
something, by lesson and exercise type.

## What to ask

**Every flag, one by one.** Look it up in the inventory and in the unit, then
classify it, as the A1 comparison did:

- **(b) a real gap**: the book teaches it, the unit doesn't. A finding.
- **(d) taught under another form**: the markers missed it (another phrasing, a
  lesson the markers don't reach). A decision `taught`, saying where.
- **(a) not for this course**: beyond the level, or something this book edition
  adds and the standards don't require. A decision `skip`, saying why.
- **A false find**: the markers matched, but something else (a word in another
  sense, a note that only mentions it). A decision `missing`, and a finding.

**What the gate can't see.** It knows a word or phrase is *there*, not that it
is *taught*. Check:

- **Mentioned, not practised.** A function found only in an intro note or one
  card, with no exercise that makes the learner use it. A word that appears
  only as a distractor.
- **Half a function.** Answering the phone but not ending the call; asking the
  price but not paying.
- **Everyday words no field lists.** Read the lesson's glossary misses
  (`--detail`) for words a learner needs in the first weeks, whatever their
  field.
- **Practice per point.** A grammar point with a card and two drills, where the
  unit's other points get eight.
- **The checklist items placed here.** Taught for real, or only matched by the
  probe?

## What isn't a finding

- Size. A unit doesn't need every glossary word (A1 glossaries run to 300
  entries for a 10-lesson unit); it needs the everyday ones and the functions.
- A point taught in another unit of the level, earlier or later: record it as
  `taught` with the lesson.
- Style, wording, more examples. That's the editorial pass (stage 4b).

## Output

A findings list for the owner, most important first, written to your
scratchpad or the session's notes folder, not the repo. For each:

```md
### 3 · L5.f5 Pay: choose cash or card · (b) · high
**Book:** PDF 68; also the checklist item "shopping".
**Unit:** u5-obchod has "Platím kartou." on one card; no exercise asks for it.
**Smallest fix:** in u5-obchod, a choice and a build on kartou / v hotovosti (2 exercises).
```

Rank by importance at the level: **high** = needed in the first weeks,
**medium** = expected at the level, **low** = breadth. Give the smallest fix:
which lesson, roughly how many exercises, or a new lesson only when no existing
one fits.

Then the decisions you propose, as rows for `decisions.tsv` in the inventory
folder (tab-separated, header `id	verdict	note`):

```
id	verdict	note
L5.g5	skip	Rhythmic law: spelling detail, not required at A1
L3.f2	taught	u3-aky-je: Aký je…? with veselý, smutný
field:clothes	open	A clothes lesson planned in u5, after u5-l3
```

- `id`: a point (`L5.f5`), a level-wide field (`field:clothes`) or a lesson's
  glossary field (`L5:clothes`).
- `verdict`: `taught` and `skip` clear the flag; `open` (a known gap, fix
  planned) and `missing` keep it.

The owner picks the fixes and confirms the decisions; then the fixes are
written, the decisions recorded, and the gate run again. A unit is done when
the gate prints "✓ nothing flagged" for it, or what's left is `open` with a
plan.
