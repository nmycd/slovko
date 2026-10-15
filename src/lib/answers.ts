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

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
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

type Verdict = "exact" | "accents" | "slip" | "name" | "wrong";

function judgeTyped(expected: string, typed: string[], isName: (word: string) => boolean): CheckResult {
  // The sentence as shown (punctuation kept), and the words compared in each piece.
  const pieces = expected
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, words: normalize(text).split(" ").filter(Boolean) }));
  const want = pieces.flatMap((p) => p.words);
  const names = want.map(isName);
  const bareWant = want.map(stripDiacritics);
  const bareTyped = typed.map(stripDiacritics);

  // Candidate pairings: a word with a word, or with two run together (a stray or
  // missing space). Cheapest first; a small nudge keeps repeated words in order.
  type Pair = { want: number[]; typed: number[]; cost: number };
  const pairs: Pair[] = [];
  const consider = (w: number[], t: number[], extra = 0) => {
    const a = w.map((i) => bareWant[i]).join("");
    const b = t.map((j) => bareTyped[j]).join("");
    const distance = slips(a, b) / Math.max(a.length, b.length);
    const name = w.some((i) => names[i]);
    if (!name && distance > 0.5) return;
    const drift = Math.abs(w[0] / want.length - t[0] / typed.length) / 100;
    pairs.push({ want: w, typed: t, cost: (name ? Math.min(distance, 0.6) : distance) + extra + drift });
  };
  want.forEach((_, i) =>
    typed.forEach((_, j) => {
      consider([i], [j]);
      if (j + 1 < typed.length) consider([i], [j, j + 1], 0.05);
      if (i + 1 < want.length) consider([i, i + 1], [j], 0.05);
    }),
  );
  pairs.sort((x, y) => x.cost - y.cost);

  // Until matched, a word counts as missing: a name only lightly, anything else fully.
  const verdicts: Verdict[] = want.map((_, i) => (names[i] ? "name" : "wrong"));
  const usedWant = new Set<number>();
  const usedTyped = new Set<number>();
  const matched: { want: number[]; typed: number }[] = [];
  for (const pair of pairs) {
    if (pair.want.some((i) => usedWant.has(i)) || pair.typed.some((j) => usedTyped.has(j))) continue;
    pair.want.forEach((i) => usedWant.add(i));
    pair.typed.forEach((j) => usedTyped.add(j));
    matched.push({ want: pair.want, typed: pair.typed[0] });
    const spaced = pair.want.length + pair.typed.length > 2;
    const verdict = judgeWord(
      pair.want.map((i) => want[i]).join(""),
      pair.typed.map((j) => typed[j]).join(""),
      pair.want.some((i) => names[i]),
    );
    const forgiven = spaced && (verdict === "exact" || verdict === "accents") ? "slip" : verdict;
    pair.want.forEach((i) => (verdicts[i] = forgiven));
  }

  // The recording sets the order: words outside the longest run typed in order are wrong.
  matched.sort((x, y) => x.want[0] - y.want[0]);
  const inOrder = longestRun(matched.map((m) => m.typed));
  matched.forEach((m, k) => {
    if (!inOrder.has(k)) m.want.forEach((i) => (verdicts[i] = names[i] ? "name" : "wrong"));
  });

  const extra = typed.length - usedTyped.size;

  let w = 0;
  const words = pieces.map(({ text, words: inPiece }) => {
    const mine = verdicts.slice(w, (w += inPiece.length));
    const mark: MarkedWord["mark"] = mine.includes("wrong")
      ? "bad"
      : mine.some((v) => v === "slip" || v === "name")
        ? "soft"
        : "ok";
    return { text, mark };
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
  return { correct, note, words };
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

/** Built-from-tiles answers: the words must match exactly. */
export function checkBuilt(words: string[], accepted: string[]): CheckResult {
  const given = normalize(words.join(" "));
  return { correct: accepted.some((a) => normalize(a) === given) };
}

/**
 * Spoken answers from speech-to-text. Recognisers drop accents and mishear
 * short words, so compare without diacritics and allow some distance.
 */
export function checkSpoken(transcript: string, target: string): CheckResult {
  const said = stripDiacritics(normalize(transcript));
  const want = stripDiacritics(normalize(target));
  if (!said) return { correct: false };
  if (said === want) return { correct: true };
  const similarity = 1 - levenshtein(said, want) / Math.max(said.length, want.length);
  return similarity >= 0.75 ? { correct: true, note: "answer.close" } : { correct: false };
}

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
