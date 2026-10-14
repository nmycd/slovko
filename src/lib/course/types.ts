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
  options: string[];
  optionsLang: "sk" | "en";
  answer: number;
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
};

/** Type what you hear. */
export type ListenExercise = {
  type: "listen";
  sk: string;
  en: string;
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

/** Pick the word that fills the gap. */
export type FillExercise = {
  type: "fill";
  before: string;
  after: string;
  options: string[];
  answer: number;
  en: string;
};

export type Exercise =
  | IntroExercise
  | ChoiceExercise
  | BuildExercise
  | ListenExercise
  | MatchExercise
  | SpeakExercise
  | FillExercise;

export type Lesson = {
  id: string;
  title: string;
  titleEn: string;
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
