"use client";

import { useEffect, useState } from "react";
import { MicIcon } from "@/components/icons";
import { AudioButton } from "@/components/lesson/audio-button";
import { checkSpoken, shuffle, type CheckResult } from "@/lib/answers";
import { playSlovak } from "@/lib/audio";
import type {
  BuildExercise,
  ChoiceExercise,
  FillExercise,
  IntroExercise,
  ListenExercise,
  MatchExercise,
  SpeakExercise,
} from "@/lib/course";
import { useRecorder } from "@/lib/useRecorder";

// Exercise screens. These mount only on the client (the player waits for
// hydration), so shuffling with Math.random in state initialisers is safe.

/** null = nothing entered yet. */
export type Answer = number | number[] | string | null;

/** Result reported by exercises that grade themselves (match, speak). */
export type Resolution = CheckResult & { solution?: string; heard?: string; skipped?: boolean };

type Props<E> = {
  exercise: E;
  answer: Answer;
  setAnswer: (a: Answer) => void;
  /** True once the answer has been checked. */
  locked: boolean;
};

function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-black sm:text-3xl">{children}</h1>;
}

export function IntroView({ exercise }: { exercise: IntroExercise }) {
  return (
    <div className="animate-pop space-y-6">
      <p className="text-sm font-extrabold uppercase tracking-wide text-brand">New phrase</p>
      <div className="flex items-center gap-4">
        <AudioButton text={exercise.sk} autoPlay />
        <span className="text-3xl font-black sm:text-4xl">{exercise.sk}</span>
      </div>
      <p className="text-xl font-semibold text-muted">{exercise.en}</p>
      {exercise.note && (
        <p className="rounded-2xl bg-surface p-4">
          <span className="mr-2 font-extrabold text-brand">Tip</span>
          {exercise.note}
        </p>
      )}
    </div>
  );
}

function optionState(i: number, selected: Answer, answer: number, locked: boolean) {
  if (locked && i === answer) return "correct";
  if (locked && i === selected) return "wrong";
  if (i === selected) return "selected";
  return undefined;
}

export function ChoiceView({ exercise, answer, setAnswer, locked }: Props<ChoiceExercise>) {
  useNumberKeys(exercise.options.length, setAnswer, locked);
  return (
    <div className="space-y-8">
      <Title>{exercise.question}</Title>
      {exercise.sk && (
        <div className="flex items-center gap-4">
          <AudioButton text={exercise.sk} autoPlay />
          <span className="rounded-2xl border-2 border-border px-4 py-3 text-2xl font-black">
            {exercise.sk}
          </span>
        </div>
      )}
      <div className="grid gap-3">
        {exercise.options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            disabled={locked}
            onClick={() => setAnswer(i)}
            data-state={optionState(i, answer, exercise.answer, locked)}
            className="tile flex items-center gap-4 p-4 text-left text-lg"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-current text-sm opacity-60">
              {i + 1}
            </span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FillView({ exercise, answer, setAnswer, locked }: Props<FillExercise>) {
  useNumberKeys(exercise.options.length, setAnswer, locked);
  const chosen = typeof answer === "number" ? exercise.options[answer] : null;
  return (
    <div className="space-y-8">
      <Title>Fill in the blank</Title>
      <p className="text-muted">{exercise.en}</p>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-3 text-2xl font-black">
        {exercise.before && <span>{exercise.before}</span>}
        <span
          className={`inline-block min-w-24 border-b-4 px-2 text-center ${
            chosen ? "border-brand text-brand" : "border-border text-transparent"
          }`}
        >
          {chosen ?? "____"}
        </span>
        <span>{exercise.after}</span>
      </p>
      <div className="flex flex-wrap gap-3">
        {exercise.options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            disabled={locked}
            onClick={() => setAnswer(i)}
            data-state={optionState(i, answer, exercise.answer, locked)}
            className="tile px-5 py-3 text-lg"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BuildView({
  exercise,
  tiles,
  answer,
  setAnswer,
  locked,
}: Props<BuildExercise> & { tiles: string[] }) {
  const picked = Array.isArray(answer) ? answer : [];
  const toSk = exercise.promptLang === "en";

  return (
    <div className="space-y-8">
      <Title>{toSk ? "Write this in Slovak" : "Write this in English"}</Title>
      <div className="flex items-center gap-4">
        {!toSk && <AudioButton text={exercise.prompt} autoPlay />}
        <span className="rounded-2xl border-2 border-border px-4 py-3 text-xl font-bold">
          {exercise.prompt}
        </span>
      </div>

      {/* Answer line */}
      <div className="flex min-h-[7.5rem] flex-wrap content-start gap-2 border-y-2 border-border py-3">
        {picked.map((tileIndex, i) => (
          <button
            key={tileIndex}
            type="button"
            disabled={locked}
            onClick={() => setAnswer(picked.filter((_, j) => j !== i))}
            className="tile animate-pop h-12 px-4 text-lg"
          >
            {tiles[tileIndex]}
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map((word, i) => {
          const used = picked.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={locked || used}
              onClick={() => {
                if (toSk) void playSlovak(word);
                setAnswer([...picked, i]);
              }}
              data-state={used ? "done" : undefined}
              className="tile h-12 px-4 text-lg"
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ListenView({ exercise, answer, setAnswer, locked }: Props<ListenExercise>) {
  return (
    <div className="space-y-8">
      <Title>Type what you hear</Title>
      <div className="flex justify-center">
        <AudioButton text={exercise.sk} autoPlay size="lg" withSlow />
      </div>
      <textarea
        autoFocus
        value={typeof answer === "string" ? answer : ""}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          // Enter submits via the player's key handler; don't add a newline.
          if (e.key === "Enter") e.preventDefault();
        }}
        disabled={locked}
        rows={3}
        lang="sk"
        spellCheck={false}
        autoCapitalize="off"
        placeholder="Type in Slovak"
        className="w-full resize-none rounded-2xl border-2 border-border bg-surface p-4 text-xl outline-none focus:border-brand"
      />
      <SlovakKeys
        disabled={locked}
        onKey={(ch) => setAnswer(`${typeof answer === "string" ? answer : ""}${ch}`)}
      />
    </div>
  );
}

/** On-screen keys for Slovak letters most keyboards don't have. */
function SlovakKeys({ onKey, disabled }: { onKey: (ch: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {["á", "ä", "č", "ď", "é", "í", "ľ", "ĺ", "ň", "ó", "ô", "ŕ", "š", "ť", "ú", "ý", "ž"].map((ch) => (
        <button
          key={ch}
          type="button"
          disabled={disabled}
          onClick={() => onKey(ch)}
          className="tile size-10 text-lg"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}

export function MatchView({
  exercise,
  onResolve,
  locked,
}: {
  exercise: MatchExercise;
  onResolve: (r: Resolution) => void;
  locked: boolean;
}) {
  const [left] = useState(() => shuffle(exercise.pairs.map((_, i) => i)));
  const [right] = useState(() => shuffle(exercise.pairs.map((_, i) => i)));
  const [pick, setPick] = useState<{ side: "sk" | "en"; index: number } | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState<{ sk: number; en: number } | null>(null);

  function tap(side: "sk" | "en", index: number) {
    if (side === "sk") void playSlovak(exercise.pairs[index].sk);
    if (!pick || pick.side === side) {
      setPick({ side, index });
      return;
    }
    const sk = side === "sk" ? index : pick.index;
    const en = side === "en" ? index : pick.index;
    setPick(null);
    if (sk === en) {
      const next = [...matched, sk];
      setMatched(next);
      if (next.length === exercise.pairs.length) onResolve({ correct: true });
    } else {
      setWrong({ sk, en });
      setTimeout(() => setWrong(null), 500);
    }
  }

  function state(side: "sk" | "en", index: number) {
    if (matched.includes(index)) return "done";
    if (wrong && wrong[side] === index) return "wrong";
    if (pick?.side === side && pick.index === index) return "selected";
    return undefined;
  }

  return (
    <div className="space-y-8">
      <Title>Tap the matching pairs</Title>
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {(["sk", "en"] as const).map((side) => (
          <div key={side} className="grid gap-3">
            {(side === "sk" ? left : right).map((i) => (
              <button
                key={i}
                type="button"
                disabled={locked || matched.includes(i)}
                onClick={() => tap(side, i)}
                data-state={state(side, i)}
                className={`tile min-h-14 px-3 py-2 text-base sm:text-lg ${
                  wrong && wrong[side] === i ? "animate-shake" : ""
                }`}
              >
                {exercise.pairs[i][side]}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpeakView({
  exercise,
  onResolve,
  locked,
}: {
  exercise: SpeakExercise;
  onResolve: (r: Resolution) => void;
  locked: boolean;
}) {
  const { recording, error: micError, level, deviceLabel, start, stop } = useRecorder();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function record() {
    if (recording) return stop();
    setError(null);
    const rec = await start();
    if (!rec) return;
    // Silence isn't a wrong answer: don't grade it, and don't pay for transcribing it.
    if (rec.silent) {
      setError(
        `We couldn't hear anything${rec.deviceLabel ? ` from “${rec.deviceLabel}”` : ""}. ` +
          "Check that the right microphone is selected (on a Mac: System Settings → Sound → Input), then try again.",
      );
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("audio", rec.audio);
      const res = await fetch("/api/stt", { method: "POST", body });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Speech recognition failed.");
        return;
      }
      const heard = data.text ?? "";
      if (!heard) {
        setError("We didn't catch any words. Speak a little louder and try again.");
        return;
      }
      onResolve({ ...checkSpoken(heard, exercise.sk), solution: exercise.sk, heard });
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <Title>Speak this sentence</Title>
      <div className="flex items-center gap-4">
        <AudioButton text={exercise.sk} autoPlay />
        <div>
          <p className="text-2xl font-black">{exercise.sk}</p>
          <p className="text-muted">{exercise.en}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={record}
        disabled={locked || busy}
        className={`btn btn-ghost h-20 w-full text-lg ${recording ? "!border-bad !text-bad" : ""}`}
      >
        <MicIcon size={30} className={recording ? "animate-pulse" : ""} />
        {busy ? "Checking…" : recording ? "Tap to stop" : "Tap to speak"}
      </button>
      {recording && (
        <div className="space-y-2">
          <div className="h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div
              className="h-full rounded-full bg-ok transition-[width] duration-75"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </div>
          {deviceLabel && <p className="text-sm text-muted">Microphone: {deviceLabel}</p>}
        </div>
      )}
      {(error ?? micError) && <p className="font-bold text-bad">{error ?? micError}</p>}
    </div>
  );
}

/** Keys 1–n pick an option. */
function useNumberKeys(count: number, setAnswer: (a: Answer) => void, locked: boolean) {
  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= count) setAnswer(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, setAnswer, locked]);
}
