# How the pictures were made

The lesson pictures came out better than expected, so this records the path that
led to them: the owner's direction, the brief the descriptions were written to,
and what was tried and chosen. The rules themselves live in
[README.md](README.md); the render prompt in [tools/gemini.ts](tools/gemini.ts).
Everything here happened on 14 and 15 October 2026, in Claude Code sessions whose
transcripts stay on the owner's machine (Claude Code deletes old transcripts after
30 days unless told otherwise), so the parts that mattered are copied here.

## The path, in order

1. **The idea.** The owner asked to illustrate the course without taking
   anything from the textbook, before choosing an image API:

   > okay i think we are augmenting the course with illustrations
   > but we can't steal anything, so we will want to make our own.
   > I haven't figured out which API we will go with just yet.
   > but what we can do now is to plan illustrations.
   > this will require you to go through the lessons and krizom-a1
   > two-pointer-style and recall correspondences between lessons and the requisite picture.
   > so we will end up with (lesson, lesson-page) -> {image description, krizom page number}
   > or better yet straight up (lesson, lesson-page) -> (image description, image crop)

2. **The unit 1 pilot.** The main session planned unit 1 itself: it read the
   book's Lekcia 1 page by page beside the lessons, cut crops of the matching
   book pictures (`book-panels-u1.txt`, `tools/cut-panels.sh`), and wrote
   `plan/map-u1.json` with a description per exercise. That set the format,
   the cast sheet and the rules in README.md. The owner approved it (34
   entries, 25 new pictures, 30 book matches).

3. **Units 2–10, by one reader.** A separate session ("Illustration plan for
   units 2–10", not a subagent) planned the rest, in course order, to keep
   recurring scenes consistent. Its brief is below, word for word.

4. **First renders.** The owner chose Nano Banana and asked for test renders
   prompted with the crop, the description and a style reference (Beatrice
   Alemagna's *On a Magical Do-Nothing Day*), "and request to create crop-like
   output in this style". Four unit 1 entries were rendered with and without the
   crop. The owner's verdict: "no-crop version works for us". From then on crops
   were never sent to the model; they only check coverage.

5. **A crop and its picture must agree.** A test render of "Prepáčte" (u1-l2#9)
   showed pán Kováč dropping keys in a corridor while its crop showed the book's
   canteen tray collision. The owner: "i wonder where NB's insistence on
   key-dropping … comes from … are you sure it got the right description?" and
   "can we make things match correctly". The pilot had linked crops by phrase
   while describing scenes of its own. Unit 1 was fixed, the rule went into
   README.md, and the planner session got the follow-up below.

6. **Blending and the look of the app.** The owner liked one test render whose
   painting faded out at the edges ("rounded hazy borders") and asked for the
   app's design to follow the style reference: "something light, anthropic-y
   and/or maybe lesswrong-y and/or something henzel-and-gretchen-y european …
   so off-whites and some weird greens". That gave the vignette-on-white-paper
   instruction in the prompt, the `.illustration` multiply blend, and the
   "Ivory & Sage" redesign (the previous look is the git tag `design-classic`).

7. **Layout.** "i initially envisioned a picture to the side of the lesson
   picture-book-style": exercise on the left, picture on the right, both
   centred vertically, with no scrolling for ordinary exercises.

8. **The full run.** 189 pictures for 229 exercises (reuses share a picture),
   about $0.05 each. Two shower scenes were redrawn "more modestly (curtain
   drawn, only heads showing)".

9. **Later uses.** Word review shows the picture of the card that taught each
   word (see CONTENT-PIPELINE.md, "Automatic").

## The brief for units 2–10

Sent as the opening message of the planning session. Paths are relative to the
repo; a line about a local notes folder is left out.

> **Background (from the session that started this one):**
> Slovko is a Duolingo-style Slovak course app with 10 units and 67 lessons,
> written from the Krížom-krážom A1 textbook. Unit N follows the book's Lekcia
> N. The owner wants original illustrations for the lessons; the image API isn't
> chosen yet. So for now we plan, per (lesson, exercise): a description of our
> own picture plus the book page and a crop of the book picture that shows the
> same thing. The crops are reference only, to check coverage. The repo is
> public and the book is copyrighted, so crops never go into git and are never
> fed to an image model. Unit 1 was piloted and approved by the owner: 34
> entries, 25 new pictures, 30 book matches. The pilot's files, README, tools
> and cast sheet are uncommitted, and the PDF is git-ignored, which is why this
> session shares the main checkout. The owner prefers one reader working in
> order over parallel workers, for consistency.
>
> **Task:**
> Plan the illustrations for units 2–10 of Slovko's Slovak course, the same way
> unit 1 was done. Work in course order, one unit at a time, as a single reader,
> so recurring scenes stay consistent and get reused.
>
> Read these first:
> - illustrations/README.md: the rules, which exercises get a picture, the
>   entry format, the cast sheet and the workflow per unit.
> - illustrations/plan/unit1.json and illustrations/plan/map-u1.json: the
>   finished pilot. Match its level of detail. Descriptions are 1–2 sentences
>   about content (who, where, doing what, mood), with no style and no words in
>   the picture.
>
> For each unit N:
> 1. List its exercises with `npx tsx illustrations/tools/list-exercises.ts . N`.
> 2. Read the matching book lesson (Lekcia N) in
>    renata-kamenarova-krizom-krazom-slovencina-a1-2007.pdf at the repo root.
>    Use the Read tool's `pages` parameter, at most 20 pages per call. The PDF
>    is scanned, with no text layer. Where each lesson starts in the PDF: L2 =
>    18, L3 = 32, L4 = 46, L5 = 64, L6 ≈ 81, L7 = 96, L8 = 114, L9 ≈ 129, L10 =
>    140. Take the printed page number off the page itself, because the offset
>    changes where the scan skips pages.
> 3. Match exercises to book pictures. Write the boxes to
>    plan/book-panels-uN.txt, run `sh illustrations/tools/cut-panels.sh N`, and
>    check the crops on a contact sheet. Fix any box that cuts off its picture.
> 4. Write plan/map-uN.json, then run `npx tsx illustrations/tools/build-plan.ts
>    . N <printed minus PDF page>`. Use the `printedPage` override where the
>    offset changes inside a lesson.
>
> Don't over-illustrate:
> - An intro card gets a picture only if its word or phrase can be shown.
>   Abstract words, question words and pure grammar words get none.
> - When the same situation comes back, reuse the earlier picture rather than
>   describing a new one.
> - Book matches will be sparser after Lekcia 1. An entry with `book: null` is
>   normal.
>
> As you go, add these to illustrations/README.md:
> - a short "Recurring places" table (dorm room, canteen, Marek's restaurant,
>   classroom…) so places look consistent;
> - a row in the cast sheet for any minor character who appears in more than
>   one picture.
>
> Rules:
> - The textbook crops are reference only. They stay in the git-ignored
>   illustrations/book-refs/.
> - Never describe a book picture's composition; describe the scene our lesson
>   needs.
> - Only change files under illustrations/ and the README there. Don't touch
>   course content.
> - Don't commit.
>
> You're done when unit2.json … unit10.json exist and build cleanly. Then reply
> with a table: per unit, the number of entries, new pictures and book matches,
> plus the course total. Also list anything you were unsure about.

## The follow-up: crops and pictures must match

Sent to the same session half an hour later, after the "Prepáčte" render.

> Follow-up on the illustration plan: every picture description must show the
> same situation as its book crop. Please check units 2–10 and fix the entries
> that don't.
>
> Why: the owner noticed that a test render of "Prepáčte" (u1-l2#9) showed pán
> Kováč dropping keys in a corridor, while its crop is the book's canteen tray
> collision. The cause was the unit 1 pilot. It linked crops by phrase, but its
> descriptions set our own scenes, so the two often disagreed. I've fixed unit 1
> and added this rule to illustrations/README.md under "Rules" (please read it):
>
> "A crop and its picture show the same situation. When an entry has a book
> crop, its `picture` shows what happens in that crop (the kind of place, who
> does what) with our cast in the roles. Describe the situation, not the
> drawing: no layout, poses or framing. If the exercise's own text sets a
> different scene, follow the text and set `book` to null. Never link a crop
> only because it has the same phrase."
>
> The owner's words were: "can we make things match correctly".
>
> What to do, for units 2–10 in order:
> 1. For every entry with a `book` crop, look at the crop image itself; don't
>    rely on memory. Check whether the description shows the same situation.
> 2. If it doesn't, rewrite the description so it does, keeping our cast. If the
>    exercise text pins a different scene, keep the description and set the
>    panel to null.
>    - Reuses count too. A reuse inherits the picture it points at, so its crop
>      has to match that picture as well. If it doesn't, give the entry the
>      right crop or none.
>    - If the crop's situation and the exercise's word clearly differ (for
>      example, the crop shows a different object or action), find a better
>      crop in the same lesson or drop it.
> 3. A pure object crop (a book picture of a lamp, a bread roll) just needs our
>    description to show the same object.
> 4. Fix the cross-unit reuse in unit 3 that points at u1-l1#4. That entry is
>    now "evening on the street outside the dormitory, greeting a neighbour and
>    her grandson". It's no longer pán Kováč at his desk.
> 5. Update the "Porter's lodge" row in the README's Recurring places table. It
>    still says "First in u1-l1#4", which is no longer a porter's-lodge picture.
> 6. Rebuild each unit with build-plan.ts. Don't change course content, and
>    don't commit.
>
> When you're done, reply with:
> - per unit, how many entries you rewrote, how many crops you dropped or
>   replaced, and how many you left unchanged;
> - a few before/after examples;
> - the new totals.

## What is kept where

| What | Where | In git |
|---|---|---|
| Rules, cast sheet, recurring places, workflow | [README.md](README.md) | yes |
| Every picture description, reuse and crop link | `plan/map-uN.json`, built into `plan/unitN.json` | yes |
| Which book pictures were matched (boxes on pages) | `plan/book-panels-uN.txt` | yes |
| The render prompt and which style pages go with it | [tools/gemini.ts](tools/gemini.ts) | yes |
| The finished pictures, as served | `public/illustrations/*.webp` | yes |
| Which picture belongs to which exercise | `src/lib/course/illustrations.json` | yes |
| The two textbooks (Krížom-krážom A1, *On a Magical Do-Nothing Day*) | PDFs in the project root | no: copyrighted |
| Style reference pages (`mdn-*.jpg`) | `style-refs/` | no: copyrighted |
| Book crops | `book-refs/` | no: copyrighted, rebuilt from the PDF with `tools/cut-panels.sh` |
| Full-size renders (JPEG, before conversion to WebP) | `renders/` | no: large |
| Test renders, with and without crops | `test-renders/` | no |

The git-ignored files exist only on the owner's machine (the project sits on an
iCloud-synced Desktop). Keep a private copy of the PDFs, `style-refs/` and
`renders/`: without the style pages the pictures can't be extended in the same
style, and without `renders/` every picture would be redrawn.
