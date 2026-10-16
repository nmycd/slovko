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
]);

/** Capitalised words that aren't names (holidays and the like): graded like any other word. */
export const capitalisedWords = new Set(["vianoce"]);
