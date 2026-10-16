// Course content model. Slovak text is always in `sk`, the learner's
// base language (English for now) in `en`.

/**
 * An exercise's name, unique in its lesson ("dobry-den", "choice-dovidenia"). Translation
 * keys, `ref`s, pictures and spelling cards point at exercises by it ("u1-l1#dobry-den"),
 * so exercises can be added, removed and reordered freely. It stays when the exercise
 * changes; `npm run course:ids` names new exercises (see AUTHORING.md, "Exercise ids").
 */
export type ExerciseId = string;

/** A new word or phrase shown on a teaching card. */
export type IntroExercise = {
  id: ExerciseId;
  type: "intro";
  sk: string;
  en: string;
  note?: string;
  /**
   * A card about a person: the form for the other gender, if Slovak has one
   * ("čašník" → "čašníčka", "Som chorá." → "Som chorý."). Shown on the card as
   * "For a woman: …" or "For a man: …".
   */
  otherGender?: { sk: string; gender: "m" | "f" };
  /** Single nouns, added as the course loads from the word's tags: its gender, or plural only. */
  gender?: "m" | "f" | "n" | "plural";
};

/** Pick the right option. Slovak options get audio buttons. */
export type ChoiceExercise = {
  id: ExerciseId;
  type: "choice";
  question: string;
  /** Slovak phrase shown (and spoken) above the options. */
  sk?: string;
  /** Review only: play `sk` without showing it (a listening drill). */
  audioOnly?: boolean;
  options: string[];
  optionsLang: "sk" | "en";
  answer: number;
  /** Shown after a wrong answer: why the answer is right, in a sentence or two (see AUTHORING.md). */
  why?: string;
  /** The grammar card `why` rests on, "lessonId#exerciseId", here or earlier. */
  ref?: string;
  /** `ref` looked up, as the course loads. */
  rule?: RuleCard;
};

/** A wrong tile of a word-order exercise, the answer's tile it competes with, and why that one is right. */
export type Trap = { wrong: string; right: string; why: string };

/** Build a sentence from word tiles. */
export type BuildExercise = {
  id: ExerciseId;
  type: "build";
  /** Sentence to translate, in `promptLang`. */
  prompt: string;
  promptLang: "sk" | "en";
  /** Accepted answers; the first one is shown as the correct solution and is split into tiles. */
  answers: string[];
  /** Extra wrong tiles mixed in. */
  distractors: string[];
  /**
   * Answer in Slovak only: the distractors that compete with one tile of the answer
   * (`wrong` "Bratislava" for `right` "Bratislave"), and `why` the right one is right,
   * shown when a learner uses the wrong one (see AUTHORING.md).
   */
  traps?: Trap[];
  /**
   * Tiles shown with their capital (names, "I"); the rest show in lowercase, so the
   * first word isn't given away. Filled in as the course loads (see ../tile-case).
   */
  keepCase?: string[];
};

/** Type what you hear. */
export type ListenExercise = {
  id: ExerciseId;
  type: "listen";
  sk: string;
  en: string;
};

/**
 * Hear one word and type it, so its spelling is practised before a typed sentence
 * needs it. Not written by hand: scripts/plan-spelling.ts places these (see ../spelling.ts),
 * with the id "spell-" and the word.
 */
export type SpellExercise = {
  id: ExerciseId;
  type: "spell";
  sk: string;
  /** The word's meaning, when an intro card teaches this exact form. */
  en?: string;
  /** Review only: ask for the Slovak from the meaning, with no audio until answered. */
  fromMeaning?: boolean;
};

/** A word to memorize in writing practice: Slovak, and its meaning in the learner's language. */
export type MemoWord = { sk: string; en: string };

/**
 * Writing practice only: memorize how a few words are spelled, then type each from its
 * meaning once the Slovak is hidden and the rows are shuffled. Written as a bare stub;
 * the words are dealt when the lesson starts, from the lesson's `wordPool`.
 */
export type MemorizeExercise = {
  id: ExerciseId;
  type: "memorize";
  /** Dealt by the lesson player. */
  words?: MemoWord[];
};

/** Tap matching pairs. */
export type MatchExercise = {
  id: ExerciseId;
  type: "match";
  pairs: { sk: string; en: string }[];
};

/** Say the phrase out loud (speech-to-text). */
export type SpeakExercise = {
  id: ExerciseId;
  type: "speak";
  sk: string;
  en: string;
};

/**
 * A grammar explanation card: a short rule, an optional table (e.g. a
 * conjugation) and voiced examples. In body, table cells and example `sk`,
 * wrap the part to highlight (usually an ending) in **double asterisks**:
 * "študent**ka**".
 */
/** A grammar card that an explanation points back to, and where it's taught (lesson numbers and title, its place in the lesson). */
export type RuleCard = {
  card: GrammarExercise;
  unit: number;
  lesson: number;
  title: string;
  index: number;
  count: number;
};

export type GrammarExercise = {
  id: ExerciseId;
  type: "grammar";
  title: string;
  /** 1–3 short paragraphs. */
  body: string[];
  table?: GrammarTable;
  /** Up to 4 example sentences; each gets an audio button. */
  examples?: { sk: string; en: string }[];
};

export type GrammarTable = {
  caption?: string;
  head?: string[];
  rows: string[][];
};

/** Pick the word that fills the gap. */
export type FillExercise = {
  id: ExerciseId;
  type: "fill";
  before: string;
  after: string;
  options: string[];
  answer: number;
  en: string;
  /** Shown after a wrong answer: why the answer is right, in a sentence or two (see AUTHORING.md). */
  why?: string;
  /** The grammar card `why` rests on, "lessonId#exerciseId", here or earlier. */
  ref?: string;
  /** `ref` looked up, as the course loads. */
  rule?: RuleCard;
};

export type Exercise =
  | IntroExercise
  | ChoiceExercise
  | BuildExercise
  | ListenExercise
  | SpellExercise
  | MatchExercise
  | SpeakExercise
  | FillExercise
  | GrammarExercise
  | MemorizeExercise;

/** "grammar" lessons open with grammar cards; "review" lessons mix earlier material. */
export type LessonKind = "vocab" | "grammar" | "review" | "writing";

export type Lesson = {
  id: string;
  title: string;
  titleEn: string;
  /** Defaults to "vocab". */
  kind?: LessonKind;
  exercises: Exercise[];
  /**
   * Writing lessons, filled as the course loads: the words taught on intro cards since
   * the previous writing lesson, which its memorize rounds are dealt from.
   */
  wordPool?: MemoWord[];
};

export type Unit = {
  id: string;
  number: number;
  title: string;
  titleEn: string;
  topics: string[];
  grammar: string[];
  premium: boolean;
  lessons: Lesson[];
};

/** What the learning path needs: units and lesson titles, without exercises. */
export type LessonOutline = Pick<Lesson, "id" | "title" | "titleEn" | "kind">;
export type UnitOutline = Omit<Unit, "lessons"> & { lessons: LessonOutline[] };
