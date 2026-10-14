// Answer checking for typed, built and spoken answers.

export type CheckResult = {
  correct: boolean;
  /** Shown under the verdict, e.g. "Watch the accents". */
  note?: string;
};

/** Lowercase, drop punctuation, collapse whitespace. Keeps diacritics. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,!?¿¡…:;"“”„—–-]/g, " ")
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

/** Typed answers: exact match wins, missing accents or one typo still pass with a note. */
export function checkTyped(input: string, accepted: string[]): CheckResult {
  const given = normalize(input);
  if (!given) return { correct: false };
  const targets = accepted.map(normalize);
  if (targets.includes(given)) return { correct: true };

  const bare = stripDiacritics(given);
  if (targets.some((t) => stripDiacritics(t) === bare)) {
    return { correct: true, note: "Watch the accents (mäkčeň and dĺžeň)." };
  }
  if (targets.some((t) => t.length >= 6 && levenshtein(t, given) <= 1)) {
    return { correct: true, note: "You have a typo." };
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
  return similarity >= 0.75 ? { correct: true, note: "Close enough. Keep practising!" } : { correct: false };
}

/** Split a sentence into word tiles (punctuation removed, case kept). */
export function toTiles(sentence: string): string[] {
  return sentence
    .replace(/[.,!?…:;"“”„]/g, " ")
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
