# Illustrations plan

Slovko's lessons get their own illustrations. This folder plans them (which
exercise gets a picture, what the picture shows, and which page of the
Krížom-krážom A1 textbook illustrated the same thing) and renders them (see
Rendering). Where this fits in the whole course workflow:
[CONTENT-PIPELINE.md](../CONTENT-PIPELINE.md). How the pictures came about, with
the brief their descriptions were written to: [HISTORY.md](HISTORY.md).

- `plan/unitN.json`: one entry per exercise that gets a picture. Entries name
  exercises by lesson and exercise id (`u1-l1#dobre-rano`), so adding or moving
  other exercises leaves them alone.
- `book-refs/`: crops of the textbook's pictures, matched to entries. **Not in
  git** (the repo is public and the book is copyrighted). Rebuild them from the
  PDF in the project root; see "Book crops" below.

## Rules

- **Our pictures are our own.** The book crops show what the textbook chose
  to depict, so we can check that we covered the same situations. Never give a
  crop to an image model as input, and don't describe a book picture's layout
  in a `picture` description. Describe the scene the lesson needs.
- **No words in pictures.** The app shows the phrase in three languages next
  to the picture. No speech bubbles with text, no signs to read. An empty name
  badge or a blank sign is fine.
- **A crop and its picture show the same situation.** When an entry has a
  book crop, its `picture` shows what happens in that crop (the kind of place,
  who does what) with our cast in the roles. Describe the situation, not the
  drawing: no layout, poses or framing. If the exercise's own text sets a
  different scene ("Emma bumps into pán Kováč in the corridor"), follow the
  text and set `book` to null. Never link a crop only because it has the same
  phrase.
- **Use the cast.** Recurring characters look the same everywhere (see below).
  Name them in `picture` descriptions; the image prompt adds their look.
- **Style comes from the references** (see Rendering). Keep descriptions about
  content (who, where, doing what, mood), not about style or medium.

## Which exercises get a picture

- `intro` cards: yes, when the word or phrase can be shown.
- `choice` exercises that describe a situation ("Emma walks into a bakery"):
  yes. Reuse an earlier picture when it shows the same situation.
- `grammar` cards: only when a scene carries the point (ty vs vy).
- Everything else (`listen`, `speak`, `build`, `fill`, `match`): no.
- Pronunciation lessons: no.

## Entry format

```jsonc
{
  "lesson": "u1-l1",
  "exercise": "dobre-rano",   // the exercise's id
  "type": "intro",
  "text": "Dobré ráno. = Good morning.",   // snapshot, to spot edits to the exercise
  "picture": "…",             // what to draw; omitted when reusing
  "reuse": "u1-l1#dobry-den", // instead of picture: show that entry's picture
  "book": {                   // null when the book has no matching picture
    "pdfPage": 6, "printedPage": 9, "panel": "6",
    "crop": "book-refs/panels/p6-6.jpg"
  }
}
```

## Cast

| Name | Look |
| --- | --- |
| **Emma** | 21, Irish exchange student. Fair skin, auburn shoulder-length wavy hair, freckles. Mustard-yellow cardigan over a white T-shirt, jeans, canvas tote bag. |
| **Lucia** | 19, Slovak student, Emma's roommate. Fair skin, long dark-brown hair in a high ponytail, round glasses. Navy-and-white striped top, dark trousers. |
| **Tomáš** | 30, programmer from Košice. Tall, fair skin, short black hair, neat short black beard. Grey hoodie, laptop backpack. |
| **Marek** | 28, Lucia's brother, a cook. Stocky, fair skin, short curly dark-brown hair. White chef's jacket at work, red flannel shirt otherwise. |
| **pani Horváthová** | About 55, Slovak teacher at the university. Fair skin, short silver bob, glasses on a chain, teal blazer, patterned scarf. |
| **pán Kováč** | About 65, porter at the dormitory. Fair, ruddy skin, grey moustache, flat cap, brown cardigan, a big ring of keys. |

Minor characters who appear in more than one picture. The course doesn't name
Oksana or Dušan; the names are only handles for the image prompt.

| Name | Look |
| --- | --- |
| **Oksana** | 20, Ukrainian student in Emma's Slovak class. Long straight blonde hair in a side braid, green bomber jacket. |
| **Dušan** | About 35, the waiter at Marek's restaurant. Tall and thin, slicked-back dark hair, black waistcoat over a white shirt, notepad in his apron pocket. |
| **the baker** | About 50, runs the neighbourhood bakery. Round face, bald, white apron, flour on his forearms. |
| **the salesman** | About 25, at the clothes shop. Short fair hair, black polo shirt, a tape measure round his neck. |
| **the woman with the shopping bag** | About 70, a Bratislava local who gives Emma directions. Grey perm, beige raincoat, a string shopping bag. |
| **the pensioner** | About 80. Felt hat, long dark coat, walking stick. |
| **the clerk at the international office** | About 25, at the university's international office. Neat side parting, light-blue shirt, lanyard. |
| **the shop assistant** | About 60, at the corner shop near the dorm. Fair skin, short grey hair, a green checked shirt under a dark-green apron. |
| **Emma's mum** | About 50, at home in Ireland. Fair skin, rosy cheeks, shoulder-length wavy light-brown hair, a cream jumper with a patterned yoke. |
| **Emma's dad** | About 55, at home in Ireland. Tall, fair skin and freckles, thinning auburn hair going grey, a short ginger-grey beard, a navy knitted jumper. |
| **Emma's brother and sister** | Younger than Emma, both fair and freckled with auburn hair. Her brother, about 15: lanky, messy hair, a green football shirt. Her sister, about 11: two plaits, a red jumper. |
| **pán Horváth** | About 60, pani Horváthová's husband. Tall and broad, fair skin, white hair combed back, a short white beard, a brown corduroy jacket over a checked shirt. |
| **the doctor** | About 45, a woman GP. Fair skin, short dark-brown hair tucked behind her ears, a white coat over a sage-green blouse, a stethoscope round her neck. |

## Recurring places

Places that come back in several units. Keep their layout the same each time.

| Place | What it looks like | First in |
| --- | --- | --- |
| Emma and Lucia's dorm room | Small and cosy. Seen from the door: two desks along the left wall, Lucia's at the front by the door and Emma's at the back under the window, with a map of Europe above it; the two beds along the right wall; a tall wooden wardrobe at the back; plants on the windowsill. | u1-l1#choice-dobru-noc, u3-l1#izba, u3-l3#vlavo-vpravo |
| Dorm kitchen | Shared. Small stove, fridge, sink, microwave, kettle, a washing machine under the counter, a table by the window. Lucia's birthday party is here. | u1-l2#ano-prosim, u3-l1#kuchyna |
| Dorm bathroom | Shower with a curtain, sink with two toothbrushes in a mug, towels on hooks. | u3-l1#kupelna |
| Dormitory building | Tall concrete student block with rows of windows; long corridors of identical doors, a staircase, a narrow balcony. | u3-l1#byvam-na-internate |
| Porter's lodge | Just inside the dormitory entrance: pán Kováč sits behind a window onto the entrance hall, with a computer, a small TV and a big clock on the wall. Notices get pinned to the entrance door. | u3-l1#vratnica, u7-l2#kolko-je-hodin |
| Slovak classroom | Desks in rows facing pani Horváthová's desk and a whiteboard. Pushed into one big table for seminars. | u2-l2#choice-odkial-ste, u7-l1#seminar |
| University | Main building with a clock over the entrance; a sunny courtyard; tiered lecture hall; library with tall shelves, long tables and green lamps; canteen; international office counter. | u1-l1#ahoj, u7-l1#prednaska |
| Café near the university | Small round tables, a big street window, a counter with a coffee machine. | u1-l4#choice-ako-sa-mate-2, u4-l2#kaviaren |
| Marek's restaurant | Dining room with checked tablecloths and leather-bound menus; a busy kitchen with big pots. | u1-l2#choice-nech-sa-paci, u4-l3#co-robis-som, u6-l1#jedalny-listok |
| Marek's flat | Hallway in the middle; bright living room with a big window, sofa, rug and TV; small dim bedroom facing a courtyard. | u3-l5#byt |
| Corner shop | Near the dorm. Shelves of groceries, crates of fruit and vegetables, a deli counter with scales, a small till with a card reader. | u5-l1#kolko-stoji-sunka, u5-obchod#ovocie-a-zelenina |
| Clothes shop | Racks and shelves of clothes, a mirror, a counter with high shelves behind it. | u4-l3#predavac, u5-l3#tricko-a-sveter |
| Neighbourhood bakery | Small; shelves of rolls and loaves behind the counter. | u1-l1#dobry-den |
| Tomáš's company | An office building with several floors: a reception desk at the entrance, a canteen, a meeting room, a training room, a room for staff parties, the technical department. Tomáš's own office is untidy: a desk with a lamp above it, a printer, shelves. | u8-l1#firma, u6-l5#grammar-where-pred-za |
| Bratislava Old Town | Square with a fountain and pastel houses, narrow streets, a church with a tall spire; the white castle with four corner towers on its hill; the bridge with one pylon and a round saucer on top; café tables on the Danube embankment. | u4-l1#mesto |
| Park bench | Tomáš's bench from the weather pictures (sunny, partly cloudy, cloudy, rain); the pensioner feeds pigeons in the same park. | u1-l3#mam-sa-dobre, u10-l2#je-oblacno |
| Conference centre | Foyer with a registration desk and posters; a hall with a lectern and a big screen. | u9-l1#konferencia |
| Emma's family home in Ireland | A small terraced house with a red front door; a cosy living room with a sofa, an armchair, plants and patterned wallpaper; a small back garden. | u4-rodina#mama-a-otec, u9-l1#pozvanka, u9-l5#trvale-bydlisko |
| Doctor's surgery | Small and bright: the doctor's desk with a computer, an examination couch with a paper sheet, a glass cabinet of medicines, a window with blinds. | u9-lekar#mam-horucku |

## Book crops

The PDF has no text layer; pages are scans. PDF page numbers differ from the
printed ones by an offset that grows where the scan skips a page (Lekcia 1 is
PDF 4 = printed 7). Read the printed number off the page.

| Lekcia | PDF pages | Printed minus PDF |
| --- | --- | --- |
| 1–5 | 4–80 | 3 |
| 6–8 | 81–128 | 5 |
| 9–10 | 129–151 | 7 |

Lekcia 6 and 9 have no title page in the scan. The answer key starts at PDF 152.

## Workflow per unit

1. `npx tsx illustrations/tools/list-exercises.ts . N` lists the unit's
   exercises with their ids.
2. Read the book lesson's pages and pick the pictures that match.
3. Write the panel boxes to `plan/book-panels-uN.txt` (committed), then
   `sh illustrations/tools/cut-panels.sh N` cuts the crops. Check them on a
   contact sheet (`magick montage …`) and fix boxes that cut off a picture.
4. Write `plan/map-uN.json` (see `map-u1.json`), keyed `"uN-lM#exercise-id"`, then
   `npx tsx illustrations/tools/build-plan.ts . N <printed minus PDF page>`
   writes `plan/unitN.json`. It checks that every crop exists and that every
   reuse points at an entry with a picture. A reuse may point into an earlier
   unit (`"reuse": "u1-l3#mam-sa-vyborne"`); prefer that to describing the same scene again.
   Unused crops in `book-panels-uN.txt` are fine: they show what the book
   pictured that we chose not to.

## Rendering

- `npx tsx illustrations/tools/render-plan.ts [--unit N] [--concurrency 8]`
  renders every entry with a `picture` that has no file in `renders/` yet
  (git-ignored, `renders/<lesson>-<exercise id>.jpg`), converts it to
  `public/illustrations/<lesson>-<exercise id>-<hash>.webp` and writes
  `src/lib/course/illustrations.json` (`"u1-l1#dobre-rano"` → picture), which the
  lesson page reads.
  The hash comes from the render, so a redrawn picture gets a new URL and no
  cache shows the old one. To redo a picture, delete its file in `renders/` and
  run it again. Entries whose exercise text changed since the plan are left out.
- `npx tsx illustrations/tools/render-test.ts [--dry-run] u1-l1#dobre-rano …` renders
  single entries into `test-renders/` (git-ignored) to try prompt changes.
- `npx tsx illustrations/tools/check-edges.ts` flags renders whose painting
  runs into the image border instead of fading out on paper.
- Model: Nano Banana 2.1 (`gemini-nano-banana-2.1`) at 1K, about $0.05 a
  picture (October 2026). The key is `GEMINI_API_KEY` in `.env.local`.
- Style: three pages of Beatrice Alemagna's *On a Magical Do-Nothing Day* in
  `style-refs/` (git-ignored, from the PDF in the project root), sent with every
  prompt ([gemini.ts](tools/gemini.ts)). Replace them with our own style sheet
  before commercial use.
