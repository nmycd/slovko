// Personal and place names in the typed sentences, lowercase as the grader compares
// them. They're checked only lightly (a misspelt name is marked but never fails the
// answer), and learners aren't drilled on spelling them. scripts/validate-course.ts
// flags a capitalised word in a typed sentence that's in neither list below.
export const properNames = new Set([
  // People
  "emma",
  "horváthová",
  "kováč",
  "lucia",
  "luciou",
  "marek",
  "marekom",
  "martin",
  "tomáš",
  // Places
  "bratislave",
  "poľska",
  "slovenska",
  "talianska",
  // A2: each unit's names (people and places, every case form used), between its markers.
  // A2 unit 1
  "daniel",
  "kristína",
  // (end of A2 unit 1)
  // A2 unit 2
  "filip",
  // (end of A2 unit 2)
  // A2 unit 3
  "pavol",
  // (end of A2 unit 3)
  // A2 unit 4
  "bratislavy",
  "žiliny",
  // (end of A2 unit 4)
  // A2 unit 5
  "veronika",
  // (end of A2 unit 5)
  // A2 unit 6
  "hudákom",
  "írska",
  // (end of A2 unit 6)
  // A2 unit 7
  // (end of A2 unit 7)
  // A2 unit 8
  // (end of A2 unit 8)
  // A2 unit 9
  "sarah",
  "veronika",
  // (end of A2 unit 9)
  // A2 unit 10
  "bratislava",
  "slovensku",
  // (end of A2 unit 10)
]);

/** Capitalised words that aren't names (holidays and the like): graded like any other word. */
export const capitalisedWords = new Set(["vianoce"]);
