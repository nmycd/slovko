// Course content model. Slovak text is always in `sk`, the learner's
// base language (English for now) in `en`.

/** A new word or phrase shown on a teaching card. */
export type IntroExercise = {
  type: "intro";
  sk: string;
  en: string;
  note?: string;
};

/** Pick the right option. Slovak options get audio buttons. */
export type ChoiceExercise = {
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
  /** The grammar card `why` rests on, "lessonId#index" (index as written), here or earlier. */
  ref?: string;
  /** `ref` looked up, as the course loads. */
  rule?: RuleCard;
};

/** Build a sentence from word tiles. */
export type BuildExercise = {
  type: "build";
  /** Sentence to translate, in `promptLang`. */
  prompt: string;
  promptLang: "sk" | "en";
  /** Accepted answers; the first one is shown as the correct solution and is split into tiles. */
  answers: string[];
  /** Extra wrong tiles mixed in. */
  distractors: string[];
  /**
   * Tiles shown with their capital (names, "I"); the rest show in lowercase, so the
   * first word isn't given away. Filled in as the course loads (see ../tile-case).
   */
  keepCase?: string[];
};

/** Type what you hear. */
export type ListenExercise = {
  type: "listen";
  sk: string;
  en: string;
};

/**
 * Hear one word and type it, so its spelling is practised before a typed sentence
 * needs it. Not written by hand: scripts/plan-spelling.ts places these (see ../spelling.ts).
 */
export type SpellExercise = {
  type: "spell";
  sk: string;
  /** The word's meaning, when an intro card teaches this exact form. */
  en?: string;
  /** Review only: ask for the Slovak from the meaning, with no audio until answered. */
  fromMeaning?: boolean;
};

/** Tap matching pairs. */
export type MatchExercise = {
  type: "match";
  pairs: { sk: string; en: string }[];
};

/** Say the phrase out loud (speech-to-text). */
export type SpeakExercise = {
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
  type: "fill";
  before: string;
  after: string;
  options: string[];
  answer: number;
  en: string;
  /** Shown after a wrong answer: why the answer is right, in a sentence or two (see AUTHORING.md). */
  why?: string;
  /** The grammar card `why` rests on, "lessonId#index" (index as written), here or earlier. */
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
  | GrammarExercise;

/** "grammar" lessons open with grammar cards; "review" lessons mix earlier material. */
export type LessonKind = "vocab" | "grammar" | "review";

export type Lesson = {
  id: string;
  title: string;
  titleEn: string;
  /** Defaults to "vocab". */
  kind?: LessonKind;
  exercises: Exercise[];
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
