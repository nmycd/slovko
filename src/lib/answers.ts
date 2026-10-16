// Answer checking for typed, built and spoken answers.

export type CheckResult = {
  correct: boolean;
  /** Message key of a hint shown under the verdict, e.g. missing accents. */
  note?: "answer.accents" | "answer.typo" | "answer.names" | "answer.extra" | "answer.close";
  /** A typed answer that wasn't exact: the expected sentence, word by word, marked. */
  words?: MarkedWord[];
};

/** "soft": a forgiven slip or a name (marked, but never failing); "bad": wrong or missing. */
export type MarkedWord = { text: string; mark: "ok" | "soft" | "bad" };

/** Lowercase, drop punctuation, collapse whitespace. Keeps diacritics. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,!?¿¡…:;"“”„«»—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * Typed answers (dictation), judged word by word. Each typed word is matched to the
 * expected word it most resembles, so a mangled name is still understood as that name.
 * Missing accents pass. One slip (a wrong, missing, extra or swapped letter, or a stray
 * space) in a word of 5+ letters passes but is marked, unless it changes the ending. Names (`isName`, given
 * normalized words) are checked only lightly: marked when misspelt, missing or out of
 * place, never failing the answer. Wrong, missing, extra and out-of-order words fail it.
 */
export function checkTyped(
  input: string,
  accepted: string[],
  isName: (word: string) => boolean = () => false,
): CheckResult {
  const typed = normalize(input).split(" ").filter(Boolean);
  if (!typed.length) return { correct: false };
  if (accepted.some((a) => normalize(a) === typed.join(" "))) return { correct: true };
  const results = accepted.map((a) => judgeTyped(a, typed, isName));
  return results.find((r) => r.correct) ?? results[0];
}

/**
 * A memorize round (writing practice), word by word: "exact" letter for letter, accents
 * included (case and punctuation don't count); "accents" only the accents wrong, which
 * still misses; otherwise "wrong".
 */
export function checkMemorized(words: string[], typed: string[]): ("exact" | "accents" | "wrong")[] {
  return words.map((word, i) => {
    const [want, got] = [normalize(word), normalize(typed[i] ?? "")];
    if (want === got) return "exact";
    return stripDiacritics(want) === stripDiacritics(got) ? "accents" : "wrong";
  });
}

/** "missing": not given (or out of order), for the caller to judge. */
type Verdict = "exact" | "accents" | "slip" | "name" | "wrong" | "missing";

function judgeTyped(expected: string, typed: string[], isName: (word: string) => boolean): CheckResult {
  const { pieces, verdicts, extra } = align(expected, typed, {
    isName,
    form: stripDiacritics,
    judge: judgeWord,
    missing: (_, name) => (name ? "name" : "wrong"),
  });
  const correct = !verdicts.includes("wrong") && extra === 0;
  const note: CheckResult["note"] = correct
    ? verdicts.includes("slip")
      ? "answer.typo"
      : verdicts.includes("name")
        ? "answer.names"
        : verdicts.includes("accents")
          ? "answer.accents"
          : undefined
    : !verdicts.includes("wrong")
      ? "answer.extra"
      : undefined;
  return { correct, note, words: marked(pieces, verdicts) };
}

type AlignRules = {
  isName: (word: string) => boolean;
  /** The form words are compared in (e.g. without accents). */
  form: (word: string) => string;
  /** A given word (or two run together) against the expected one it was matched to. */
  judge: (want: string, got: string, name: boolean) => Verdict;
  /** An expected word that wasn't given, or was out of order. */
  missing: (word: string, name: boolean) => Verdict;
};

/**
 * Matches the given words to the expected sentence's: each given word to the expected
 * word it most resembles, so a mangled name is still understood as that name. Words
 * are given in the order heard, so words outside the longest run in order don't count.
 * Returns the expected words (in the sentence's pieces), a verdict for each, and how
 * many given words matched nothing.
 */
function align(expected: string, given: string[], rules: AlignRules) {
  // The sentence as shown (punctuation kept), and the words compared in each piece.
  const pieces = expected
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, words: normalize(text).split(" ").filter(Boolean) }));
  const want = pieces.flatMap((p) => p.words);
  const names = want.map(rules.isName);
  const bareWant = want.map(rules.form);
  const bareGiven = given.map(rules.form);

  // Candidate pairings: a word with a word, or with two run together (a stray or
  // missing space). Cheapest first; a small nudge keeps repeated words in order.
  type Pair = { want: number[]; given: number[]; cost: number };
  const pairs: Pair[] = [];
  const consider = (w: number[], g: number[], extra = 0) => {
    const a = w.map((i) => bareWant[i]).join("");
    const b = g.map((j) => bareGiven[j]).join("");
    const distance = slips(a, b) / Math.max(a.length, b.length);
    const name = w.some((i) => names[i]);
    if (!name && distance > 0.5) return;
    const drift = Math.abs(w[0] / want.length - g[0] / given.length) / 100;
    pairs.push({ want: w, given: g, cost: (name ? Math.min(distance, 0.6) : distance) + extra + drift });
  };
  want.forEach((_, i) =>
    given.forEach((_, j) => {
      consider([i], [j]);
      if (j + 1 < given.length) consider([i], [j, j + 1], 0.05);
      if (i + 1 < want.length) consider([i, i + 1], [j], 0.05);
    }),
  );
  pairs.sort((x, y) => x.cost - y.cost);

  const verdicts: Verdict[] = want.map((w, i) => rules.missing(w, names[i]));
  const usedWant = new Set<number>();
  const usedGiven = new Set<number>();
  const matched: { want: number[]; given: number }[] = [];
  for (const pair of pairs) {
    if (pair.want.some((i) => usedWant.has(i)) || pair.given.some((j) => usedGiven.has(j))) continue;
    pair.want.forEach((i) => usedWant.add(i));
    pair.given.forEach((j) => usedGiven.add(j));
    matched.push({ want: pair.want, given: pair.given[0] });
    const spaced = pair.want.length + pair.given.length > 2;
    const verdict = rules.judge(
      pair.want.map((i) => want[i]).join(""),
      pair.given.map((j) => given[j]).join(""),
      pair.want.some((i) => names[i]),
    );
    const forgiven = spaced && (verdict === "exact" || verdict === "accents") ? "slip" : verdict;
    pair.want.forEach((i) => (verdicts[i] = forgiven));
  }

  // The recording sets the order: words outside the longest run given in order don't count.
  matched.sort((x, y) => x.want[0] - y.want[0]);
  const inOrder = longestRun(matched.map((m) => m.given));
  matched.forEach((m, k) => {
    if (!inOrder.has(k)) m.want.forEach((i) => (verdicts[i] = rules.missing(want[i], names[i])));
  });

  return { pieces, want, verdicts, extra: given.length - usedGiven.size };
}

/** The sentence as shown, each piece marked by its words' verdicts. */
function marked(pieces: { text: string; words: string[] }[], verdicts: Verdict[]): MarkedWord[] {
  let w = 0;
  return pieces.map(({ text, words }) => {
    const mine = verdicts.slice(w, (w += words.length));
    const mark: MarkedWord["mark"] = mine.includes("wrong")
      ? "bad"
      : mine.some((v) => v === "slip" || v === "name")
        ? "soft"
        : "ok";
    return { text, mark };
  });
}

function judgeWord(want: string, got: string, name: boolean): Verdict {
  if (want === got) return "exact";
  const a = stripDiacritics(want);
  const b = stripDiacritics(got);
  if (a === b) return "accents";
  if (name) return "name";
  // A different last letter is usually grammar (gender, case, person), not a slip.
  return a.length >= 5 && a.at(-1) === b.at(-1) && slips(a, b) <= 1 ? "slip" : "wrong";
}

/** Positions of a longest increasing run in `xs` (any one, if there are several). */
function longestRun(xs: number[]): Set<number> {
  const length = xs.map(() => 1);
  const prev = xs.map(() => -1);
  xs.forEach((x, i) => {
    for (let j = 0; j < i; j++) {
      if (xs[j] < x && length[j] + 1 > length[i]) {
        length[i] = length[j] + 1;
        prev[i] = j;
      }
    }
  });
  const run = new Set<number>();
  for (let i = length.indexOf(Math.max(0, ...length)); i >= 0; i = prev[i]) run.add(i);
  return run;
}

/** Edit distance in which swapping two neighbouring letters is a single slip. */
export function slips(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** A single word typed from audio: missing accents pass (the word is shown), nothing else does. */
export function checkSpelled(input: string, word: string): CheckResult {
  const given = normalize(input);
  const want = normalize(word);
  if (given === want) return { correct: true };
  if (given && stripDiacritics(given) === stripDiacritics(want)) {
    return { correct: true, note: "answer.accents", words: [{ text: word, mark: "ok" }] };
  }
  return { correct: false };
}

/**
 * A built answer (word tiles in order) against its accepted orders. When it's wrong:
 * the accepted answer it's closest to, to show as the solution, with its words marked
 * (bad: not used, often because a wrong tile took its place; soft: used, but somewhere
 * else), and the explanations of the wrong tiles used (`traps`), in the order used.
 */
export function checkBuiltAnswer(
  words: string[],
  accepted: string[],
  traps: { wrong: string; right: string; why: string }[] = [],
): CheckResult & { solution: string; whys: string[] } {
  const given = words.map(normalize).filter(Boolean);
  if (accepted.some((a) => normalize(a) === given.join(" "))) return { correct: true, solution: accepted[0], whys: [] };

  const targets = accepted.map((a) => toTiles(a).map(normalize));
  const distances = targets.map((target) => tileDistance(given, target));
  const best = distances.indexOf(Math.min(...distances));
  const target = targets[best];

  // In place: the longest run of the answer's words given in the same order. The rest
  // were given elsewhere (soft) or not at all (bad).
  const inPlace = commonOrder(given, target);
  const spare = new Map<string, number>();
  given.forEach((w, j) => !inPlace.given.has(j) && spare.set(w, (spare.get(w) ?? 0) + 1));
  const marks = target.map((w, i): MarkedWord["mark"] => {
    if (inPlace.target.has(i)) return "ok";
    if (!spare.get(w)) return "bad";
    spare.set(w, spare.get(w)! - 1);
    return "soft";
  });

  const solution = accepted[best];
  let k = 0;
  const marked = solution
    .split(/\s+/)
    .filter(Boolean)
    .map((text): MarkedWord => {
      const mine = marks.slice(k, (k += toTiles(text).length));
      return { text, mark: mine.includes("bad") ? "bad" : mine.includes("soft") ? "soft" : "ok" };
    });
  // In the order of the solution shown above them, by where each right tile goes.
  const used = traps
    .filter((trap) => given.includes(normalize(trap.wrong)))
    .map((trap) => ({ trap, at: target.indexOf(normalize(trap.right)) }))
    .sort((a, b) => a.at - b.at);
  return { correct: false, words: marked, solution, whys: [...new Set(used.map(({ trap }) => trap.why))] };
}

/** Edit distance between word lists, a swap of neighbours counting as one step. */
function tileDistance(a: string[], b: string[]): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** A longest common subsequence of two word lists, as the positions it uses in each. */
function commonOrder(a: string[], b: string[]): { given: Set<number>; target: Set<number> } {
  const L = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
  }
  const given = new Set<number>();
  const target = new Set<number>();
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) {
      given.add(i++);
      target.add(j++);
    } else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  return { given, target };
}

/**
 * Spoken answers, from speech-to-text, judged word by word like typed ones but with
 * the recogniser's quirks forgiven: accents and numbers written as digits ("8" for
 * "osem", "2" for "dva" or "dve") don't matter, a word may be a little off (one sound in four: a recogniser's
 * mishearing or an accent, marked "close"), and a missing one- or two-letter word is
 * marked but doesn't fail the answer (recognisers drop them), unless another word was
 * said instead. Other extra words (a filler, a word said twice) don't count. Names are
 * checked only lightly, as in typing.
 */
export function checkSpoken(
  transcript: string,
  target: string,
  isName: (word: string) => boolean = () => false,
): CheckResult {
  // Digits stand for the sentence's number word of that value, whatever its gender.
  const numberWords = new Map(
    normalize(target)
      .split(" ")
      .flatMap((word) => {
        const value = numbers.get(stripDiacritics(word));
        return value ? [[value, word] as const] : [];
      })
      .reverse(), // the first one wins
  );
  const said = normalize(transcript)
    .split(" ")
    .filter(Boolean)
    .map((word) => numberWords.get(word) ?? word);
  if (!said.length) return { correct: false };
  const { pieces, want, verdicts, extra } = align(target, said, {
    isName,
    form: stripDiacritics,
    judge: judgeSpokenWord,
    missing: (_, name) => (name ? "name" : "missing"),
  });
  const judged = verdicts.map((v, i) => (v !== "missing" ? v : want[i].length <= 2 && !extra ? "slip" : "wrong"));
  if (judged.every((v) => v === "exact")) return { correct: true };
  const correct = !judged.includes("wrong");
  return { correct, note: correct ? "answer.close" : undefined, words: marked(pieces, judged) };
}

function judgeSpokenWord(want: string, got: string, name: boolean): Verdict {
  const a = stripDiacritics(want);
  const b = stripDiacritics(got);
  if (a === b) return "exact";
  if (name) return "name";
  return slips(a, b) <= Math.floor(a.length / 4) ? "slip" : "wrong";
}

/** Slovak number words (without accents, every gender) → digits, 0–100. */
const numbers: ReadonlyMap<string, string> = (() => {
  const units = [
    ["nula"],
    ["jeden", "jedna", "jedno"],
    ["dva", "dve", "dvaja"],
    ["tri", "traja"],
    ["styri", "styria"],
    ["pat"],
    ["sest"],
    ["sedem"],
    ["osem"],
    ["devat"],
  ];
  const teens = [
    "desat", "jedenast", "dvanast", "trinast", "strnast",
    "patnast", "sestnast", "sedemnast", "osemnast", "devatnast",
  ];
  const tens = [
    "dvadsat", "tridsat", "styridsat", "patdesiat",
    "sestdesiat", "sedemdesiat", "osemdesiat", "devatdesiat",
  ];
  const map = new Map<string, string>();
  units.forEach((forms, n) => forms.forEach((f) => map.set(f, String(n))));
  teens.forEach((f, n) => map.set(f, String(10 + n)));
  tens.forEach((ten, t) => {
    map.set(ten, String(20 + t * 10));
    units.slice(1).forEach((forms, n) => forms.forEach((f) => map.set(ten + f, String(20 + t * 10 + n + 1))));
  });
  map.set("sto", "100");
  return map;
})();

/** Split a sentence into word tiles (punctuation removed, case kept). */
export function toTiles(sentence: string): string[] {
  return sentence
    .replace(/[.,!?…:;"“”„«»—–]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function shuffle<T>(items: T[], seed = Math.random()): T[] {
  const out = [...items];
  let s = Math.floor(seed * 2 ** 31) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
