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
- A2's plan is in `plan/a2/` and its crops in `book-refs/a2/` (the two books'
  page numbers would clash). Every tool takes `--course a2` for it; its pictures
  map is `src/lib/course/a2/illustrations.json`, and an A2 entry may reuse an A1
  picture. Renders and web pictures share their folders, named by the ids.

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
| **Veronika** | (A2) About 28, a young doctor at the hospital who treats Marek's broken arm, later his girlfriend. Tall and slim, fair skin, long straight black hair, big dark eyes. At work: a white coat over blue scrubs, hair tied back, a stethoscope. For the dinner: a new dark-red dress, hair loose. |

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
| **Emma's brother and sister** | Liam and Sarah, younger than Emma, both fair and freckled with auburn hair. Her brother Liam, 15: tall and lanky, messy hair, a green football shirt. Her sister Sarah, 11: two plaits, a red jumper (a red T-shirt in summer). |
| **pán Horváth** | About 60, pani Horváthová's husband. Tall and broad, fair skin, white hair combed back, a short white beard, a brown corduroy jacket over a checked shirt. |
| **the doctor** | About 45, a woman GP. Fair skin, short dark-brown hair tucked behind her ears, a white coat over a sage-green blouse, a stethoscope round her neck. |
| **Lucia's mum** | (A2) Katarína Šimková, about 52, a nurse at the hospital in Žilina. Slim, fair skin, chin-length dark-brown hair with a few grey strands, round glasses like Lucia's, a warm, slightly worried smile. A burgundy cardigan over a cream blouse. |
| **Lucia's dad** | (A2) Jozef Šimko, about 55, a bus driver in Žilina. Stocky like Marek, fair skin, short curly dark hair going grey, clean-shaven, a round, cheerful face. A dark-green fleece over a light-blue shirt. |
| **babka Helena** | (A2) About 80, Lucia's dad's mother; lives with the family in Žilina. Short and slim, fair wrinkled skin, rosy cheeks, white hair in a small bun. A dark-blue dress with small white flowers, a plain white apron, a grey knitted cardigan. |
| **ujo Pavol** | (A2) About 45, Lucia's mum's brother. Tall and broad, fair skin, short brown hair, a full bushy brown beard, laughing eyes. A moss-green jumper. |
| **teta Mirka** | (A2) About 42, ujo Pavol's wife. Small and lively, fair skin, short bright copper-red hair, big hoop earrings. A purple jumper. |
| **Samko** | (A2) 8, ujo Pavol and teta Mirka's son, Lucia's cousin. Small and lively, fair skin, sandy hair sticking up, a gap in his front teeth. A bright-blue jumper with a rocket on it. |
| **Daniel** | (A2) 19, history student from Munich, half Slovak; on Emma's quiz team. Tall, fair skin, short fair hair, rectangular black-framed glasses, a wide grin. A navy track jacket over a white T-shirt, trainers. |
| **Kristína** | (A2) 20, first-year economics student from Trenčín, Emma's classmate; shy and quiet. Fair skin, short curly black hair, green eyes. A lilac jumper, jeans, a small crossbody bag. |
| **Martina** | (A2) About 22, reporter for the student radio. Fair skin, a short dark-brown pixie cut, big headphones round her neck, a handheld microphone. A denim jacket over a black T-shirt. |
| **Filip** | (A2) About 20, a quiet, shy student from the dorm's second floor. Thin, fair skin, straight brown hair to his shoulders, falling over his face. An oversized dark-blue hoodie. |
| **Filip's dog** | (A2) Small, white and scruffy, a very friendly mongrel with a red collar. |
| **the nurse** | (A2) About 40, at Emma's doctor's surgery. Fair skin, short light-brown hair, a white tunic and trousers, a small watch pinned to her chest. |
| **the pharmacist** | (A2) About 45, a woman at the pharmacy. Fair skin, dark hair with grey streaks in a low bun, half-moon glasses, a white coat. |
| **Petra** | (A2) Petra Bartošová, about 30, the receptionist at Tomáš's company. Fair skin, a sleek blonde bob, a phone headset. A coral blouse. |
| **pán Hudák** | (A2) Pán inžinier Hudák, about 55, Tomáš's boss and Emma's at her internship. Heavy-set, fair skin, short receding grey hair, rimless glasses. A dark-grey suit, white shirt, burgundy tie. |
| **pani Kollárová** | (A2) Pani inžinierka Kollárová, about 40, Tomáš's colleague. Slim, fair skin, chin-length black hair with a straight fringe, red-framed glasses. A charcoal trouser suit. |
| **pani Sokolová** | (A2) Viera Sokolová, about 60, owner of the guesthouse in the Tatras and its receptionist. Sturdy, rosy cheeks, grey-blonde hair pinned up, reading glasses pushed up on her head. A red-and-white patterned knitted cardigan over a white blouse. |

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
| Marek's flat | Hallway in the middle; bright living room with a big window, sofa, rug and TV; small dim bedroom facing a courtyard. (A2) A narrow kitchen off the hallway; for the dinner with Veronika, a small table by the living-room window, laid for two with a white cloth, candles and flowers. | u3-l5#byt, a2-u9-l13#choice-stol-je-prestrety |
| Corner shop | Near the dorm. Shelves of groceries, crates of fruit and vegetables, a deli counter with scales, a small till with a card reader. | u5-l1#kolko-stoji-sunka, u5-obchod#ovocie-a-zelenina |
| Clothes shop | Racks and shelves of clothes, a mirror, a counter with high shelves behind it. | u4-l3#predavac, u5-l3#tricko-a-sveter |
| Neighbourhood bakery | Small; shelves of rolls and loaves behind the counter. | u1-l1#dobry-den |
| Tomáš's company | An office building with several floors: a reception desk at the entrance, a canteen, a meeting room, a training room, a room for staff parties, the technical department. Tomáš's own office is untidy: a desk with a lamp above it, a printer, shelves. (A2) Emma interns here: Petra's reception desk has a phone and a computer; a small office kitchen with a coffee machine and a fridge; pán Hudák's glass-walled corner office. | u8-l1#firma, u6-l5#grammar-where-pred-za, a2-u6-l3#recepcia |
| Bratislava Old Town | Square with a fountain and pastel houses, narrow streets, a church with a tall spire; the white castle with four corner towers on its hill; the bridge with one pylon and a round saucer on top; café tables on the Danube embankment. | u4-l1#mesto |
| Park bench | Tomáš's bench from the weather pictures (sunny, partly cloudy, cloudy, rain); the pensioner feeds pigeons in the same park. | u1-l3#mam-sa-dobre, u10-l2#je-oblacno |
| Conference centre | Foyer with a registration desk and posters; a hall with a lectern and a big screen. | u9-l1#konferencia |
| Emma's family home in Ireland | A small terraced house with a red front door; a cosy living room with a sofa, an armchair, plants and patterned wallpaper; a small back garden. | u4-rodina#mama-a-otec, u9-l1#pozvanka, u9-l5#trvale-bydlisko |
| Doctor's surgery | Small and bright: the doctor's desk with a computer, an examination couch with a paper sheet, a glass cabinet of medicines, a window with blinds. | u9-lekar#mam-horucku |
| Ice rink (A2) | Indoor, the zimný štadión: a big hall with a curved roof, white ice inside low boards, rows of seats, a counter that hires out skates. | a2-u2-l6#zimny-stadion |
| Zoo (A2) | Bratislava's zoo on a wooded hillside: paths between enclosures of rocks and trees for the lions, tigers and bears; giraffes and an elephant in big paddocks; monkeys and gorillas behind glass; benches and an ice-cream kiosk. | a2-u2-l8#zoo, a2-u9-l2#lev |
| The Šimkos' house in Žilina (A2) | Lucia's family home: a two-storey house with a small front garden on a quiet street, snowy at Christmas. A hallway with the home phone; a living room with the Christmas tree in the corner, a big dining table and a sofa; a warm kitchen where Lucia's mum and babka Helena cook. | a2-u3-navsteva#mate-krasny-dom, a2-u3-stedry-vecer#vianocny-stromcek |
| Railway station (A2) | Žilina station: a hall with ticket-office windows, benches and a big clock; platforms reached by an underpass. Bratislava's main station looks much the same, with taxis waiting outside. | a2-u4-l2#stanica, a2-u4-l5#objednat-si-taxik |
| The train (A2) | An InterCity carriage with compartments: two facing rows of three seats, a window with a small fold-out table, luggage racks overhead, a sliding glass door onto the corridor. Tomáš commutes from Košice on the same kind of train. | a2-u4-l3#vozen |
| Hospital (A2) | Where Veronika works and Marek's arm goes into plaster: an A&E waiting area with rows of plastic chairs; a bright treatment room with a couch, an X-ray on a screen, a sink and a trolley of bandages. | a2-u5-l7#nemocnica, a2-u5-l8#sadra |
| Tomáš's car (A2) | An old dark-blue estate car with a roof box, bags piled in the boot. It takes the four friends round Slovakia in May and Tomáš to the festival. | a2-u7-l2#som-na-ceste |
| Orava Castle (A2) | Pale walls and dark roofs built in tiers up a steep rock high above a river, wooded hills around; a ticket office at the gate at the bottom. | a2-u7-l4#vstupenka |
| Guesthouse in the Tatras (A2) | Pani Sokolová's: a chalet-style house with a steep roof and wooden balconies, the mountains behind. A small reception desk with a rack of keys; a breakfast room with wooden tables and a view of the peaks; bedrooms upstairs with pine furniture. | a2-u7-l6#penzion |
| Festival by the lake (A2) | A meadow by a lake with woods around: the main stage at the water's edge, a big white main tent for the workshops, a smaller theatre tent, food stalls, and a campsite of small tents, the friends' big orange tent among them. | a2-u8-l1#festival, a2-u8-l4#podium |
| Circus (A2) | A circus without animals: a red-and-white striped big top; inside, a round ring with tiered seats all around, a rope stretched high above it for the performers, spotlights. | a2-u9-l4#cirkus, a2-u9-l5#artistka |

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
