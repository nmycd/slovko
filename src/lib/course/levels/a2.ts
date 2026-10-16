// ┌──────────────────────────────────────────────────────────────────────────┐
// │ A2: NOT FILLED IN YET. Fill this before the first A2 unit is written.     │
// └──────────────────────────────────────────────────────────────────────────┘
//
// Until then `npm run course:coverage -- a2` reports an empty checklist and
// exits with code 1. What to fill, in order (CONTENT-PIPELINE.md, stage 1):
//
// 1. `units`: the A2 course's units, once the course has a place in the data
//    model (A1's lesson ids and progress assume one course; see "Not covered
//    yet" in CONTENT-PIPELINE.md). `knows: [a1]` makes A1's words count as known.
// 2. `textbook`: the A2 book, the local folder of its inventory
//    (research/inventory/a2/ by convention) and which unit teaches each lesson.
// 3. `fields`: A2's everyday fields, core words only. Start from A1's and add
//    the fields the A2 checklist's situations need (likely candidates: travel
//    and accommodation, work, renting a flat, health and appointments,
//    services, the media, feelings). Keep three or four of the units' own
//    topics as controls.
// 4. `checklist`: from the same kinds of source as A1, at A2:
//    - CEFR 2001, Table 2 (self-assessment grid), the A2 column, five skills;
//    - a Slovak standard's A2 grammar minimum, situations and topics: Kvapil
//      et al. 2018 if it covers A2 (A1's came from its A1 pages, ch. 3.2–3.3),
//      otherwise the Comenius University standards it draws on.
//    Make sure it picks up what A1 left for later: the genitive and dative,
//    which A1 meets as chunks only (z Írska, do kina, páči sa mi), as the A1
//    minimum allows; the imperative and the conditional as forms, not only
//    phrases; and A1's open items (`npm run -s course:coverage -- a1`).
//    Give every item the unit planned for it (`in: ["u3"]`) before writing
//    starts, and a `probe` once the lessons exist.

import type { Level } from "./types";

export const a2: Level = {
  key: "a2",
  name: "A2",
  units: [],
  sources: {},
  fields: [],
  checklist: [],
};
