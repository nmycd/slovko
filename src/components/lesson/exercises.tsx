"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookIcon, MicIcon } from "@/components/icons";
import { useApp } from "@/components/app-provider";
import { AudioButton } from "@/components/lesson/audio-button";
import { RichText } from "@/components/lesson/rich-text";
import { checkSpoken, shuffle, type CheckResult } from "@/lib/answers";
import { playSlovak } from "@/lib/audio";
import { stripMarkup } from "@/lib/course/helpers";
import type { MessageKey } from "@/lib/i18n";
import type {
  BuildExercise,
  ChoiceExercise,
  FillExercise,
  GrammarExercise,
  IntroExercise,
  ListenExercise,
  MatchExercise,
  SpeakExercise,
  SpellExercise,
} from "@/lib/course/types";
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
  // Instructions are interface text (sans); Slovak gets the serif.
  return <h1 className="font-sans text-xl font-semibold tracking-normal sm:text-2xl">{children}</h1>;
}

export function IntroView({ exercise }: { exercise: IntroExercise }) {
  const { t } = useApp();
  return (
    <div className="animate-pop space-y-6">
      <p className="text-sm font-semibold text-brand">{t("ex.newPhrase")}</p>
      <div className="flex items-center gap-4">
        <AudioButton text={exercise.sk} autoPlay />
        <span className="font-serif text-3xl font-medium sm:text-4xl">{exercise.sk}</span>
      </div>
      <p className="text-xl text-muted">{exercise.en}</p>
      {exercise.note && (
        <p className="rounded-2xl bg-surface p-4">
          <span className="mr-2 font-semibold text-brand">{t("ex.tip")}</span>
          <RichText text={exercise.note} />
        </p>
      )}
    </div>
  );
}

export function GrammarView({ exercise }: { exercise: GrammarExercise }) {
  const { t } = useApp();
  const { title, body, table, examples } = exercise;
  return (
    <div className="animate-pop space-y-6">
      <p className="flex items-center gap-2 text-sm font-semibold text-accent">
        <BookIcon size={18} /> {t("ex.grammar")}
      </p>
      <h1 className="text-2xl sm:text-3xl">{title}</h1>
      {body.map((paragraph, i) => (
        <p key={i} className="text-lg leading-relaxed">
          <RichText text={paragraph} />
        </p>
      ))}

      {table && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-left text-base sm:text-lg">
            {table.caption && (
              <caption className="bg-surface px-4 py-2 text-left text-sm font-semibold text-muted">
                {table.caption}
              </caption>
            )}
            {table.head && (
              <thead>
                <tr className="border-b border-border">
                  {table.head.map((cell, i) => (
                    <th key={i} className="px-3 py-2 text-xs font-semibold text-muted sm:px-4 sm:text-sm">
                      <RichText text={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r} className="even:bg-surface">
                  {row.map((cell, c) => (
                    <td key={c} className={`px-3 py-2 sm:px-4 ${c === 0 ? "font-bold" : ""}`}>
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {examples && examples.length > 0 && (
        <ul className="space-y-3">
          {examples.map((example) => (
            <li key={example.sk} className="flex items-center gap-4 rounded-2xl bg-surface p-3">
              <AudioButton text={stripMarkup(example.sk)} />
              <div>
                <p className="text-lg font-bold">
                  <RichText text={example.sk} />
                </p>
                <p className="text-muted">{example.en}</p>
              </div>
            </li>
          ))}
        </ul>
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
          <span className="rounded-xl border-[1.5px] border-border-strong px-4 py-3 font-serif text-2xl font-medium">
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
  const { t } = useApp();
  useNumberKeys(exercise.options.length, setAnswer, locked);
  const chosen = typeof answer === "number" ? exercise.options[answer] : null;
  return (
    <div className="space-y-8">
      <Title>{t("ex.fill")}</Title>
      <p className="text-muted">{exercise.en}</p>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-3 font-serif text-2xl font-medium">
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
  const { t } = useApp();
  const picked = Array.isArray(answer) ? answer : [];
  const toSk = exercise.promptLang === "en";

  return (
    <div className="space-y-8">
      <Title>{t(toSk ? "ex.writeSlovak" : "ex.writeNative")}</Title>
      <div className="flex items-center gap-4">
        {!toSk && <AudioButton text={exercise.prompt} autoPlay />}
        <span className="rounded-xl border-[1.5px] border-border-strong px-4 py-3 font-serif text-xl font-medium">
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
  const { t } = useApp();
  return (
    <div className="space-y-4 sm:space-y-8">
      <Title>{t("ex.listen")}</Title>
      <div className="flex justify-center">
        <AudioButton text={exercise.sk} autoPlay size="lg" withSlow />
      </div>
      <TypedAnswer
        answer={answer}
        setAnswer={setAnswer}
        locked={locked}
        rows={2}
        placeholder={t("ex.listenPlaceholder")}
      />
    </div>
  );
}

/** One word to type from audio, with its meaning when the course teaches it. */
export function SpellView({ exercise, answer, setAnswer, locked }: Props<SpellExercise>) {
  const { t } = useApp();
  return (
    <div className="space-y-4 sm:space-y-8">
      <Title>{t("ex.spell")}</Title>
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <AudioButton text={exercise.sk} autoPlay size="lg" withSlow />
        {exercise.en && <p className="text-muted sm:text-lg">{exercise.en}</p>}
      </div>
      <TypedAnswer
        answer={answer}
        setAnswer={setAnswer}
        locked={locked}
        rows={1}
        placeholder={t("ex.spellPlaceholder")}
      />
    </div>
  );
}

/** A text box for Slovak, with keys for the letters most keyboards lack. */
function TypedAnswer({
  answer,
  setAnswer,
  locked,
  rows,
  placeholder,
}: Omit<Props<unknown>, "exercise"> & { rows: number; placeholder: string }) {
  const { t } = useApp();
  const input = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  const text = typeof answer === "string" ? answer : "";

  // Accent keys type at the cursor (replacing any selection) and keep the focus.
  function insert(ch: string) {
    const el = input.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    caret.current = start + ch.length;
    setAnswer(text.slice(0, start) + ch + text.slice(end));
  }

  // React puts the cursor at the end when it writes a new value; put it back
  // right after the inserted letter.
  useLayoutEffect(() => {
    if (caret.current === null || !input.current) return;
    input.current.focus();
    input.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  return (
    <>
      <textarea
        ref={input}
        autoFocus
        value={text}
        // One line of Slovak, never more. This also drops the line break the Enter that
        // left the previous card types once this box takes the focus, and any in a paste.
        onChange={(e) => setAnswer(e.target.value.replace(/[\r\n]+/g, " ").trimStart())}
        onKeyDown={(e) => {
          // Enter submits via the player's key handler; don't add a newline.
          if (e.key === "Enter") e.preventDefault();
        }}
        disabled={locked}
        rows={rows}
        lang="sk"
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border-[1.5px] border-border-strong bg-bg p-4 font-serif text-xl outline-none focus:border-accent"
      />
      <SlovakKeys label={t("ex.accentKeys")} disabled={locked} onKey={insert} />
    </>
  );
}

/** On-screen keys for Slovak letters most keyboards don't have (plain letters come from the keyboard). */
function SlovakKeys({
  label,
  onKey,
  disabled,
}: {
  label: string;
  onKey: (ch: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {["á", "ä", "č", "ď", "é", "í", "ľ", "ĺ", "ň", "ó", "ô", "ŕ", "š", "ť", "ú", "ý", "ž"].map((ch) => (
          <button
            key={ch}
            type="button"
            disabled={disabled}
            // Keep the text box focused so the letter goes in at the cursor.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onKey(ch)}
            className="tile size-10 text-lg"
          >
            {ch}
          </button>
        ))}
      </div>
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
  const { t } = useApp();
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
      <Title>{t("ex.match")}</Title>
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
  const { t } = useApp();
  const { recording, error: micError, level, deviceLabel, start, stop } = useRecorder();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);

  async function record() {
    if (recording) return stop();
    setError(null);
    setNotice(null);
    const rec = await start();
    if (!rec) return;
    // Silence isn't a wrong answer: don't grade it, and don't pay for transcribing it.
    if (rec.silent) {
      setError(rec.deviceLabel ? t("ex.mic.silentFrom", { name: rec.deviceLabel }) : t("ex.mic.silent"));
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("audio", rec.audio);
      const res = await fetch("/api/stt", { method: "POST", body });
      const data = (await res.json()) as { text?: string };
      if (res.status === 429) {
        // Usage cap: not an error on the learner's side.
        setNotice("ex.mic.quota");
        return;
      }
      if (!res.ok) {
        setError(
          t(res.status === 401 ? "ex.mic.signIn" : res.status === 413 ? "ex.mic.tooLong" : "ex.mic.failed"),
        );
        return;
      }
      const heard = data.text ?? "";
      if (!heard) {
        setError(t("ex.mic.noWords"));
        return;
      }
      onResolve({ ...checkSpoken(heard, exercise.sk), solution: exercise.sk, heard });
    } catch {
      setError(t("ex.mic.offline"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <Title>{t("ex.speak")}</Title>
      <div className="flex items-center gap-4">
        <AudioButton text={exercise.sk} autoPlay />
        <div>
          <p className="font-serif text-2xl font-medium">{exercise.sk}</p>
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
        {t(busy ? "ex.mic.checking" : recording ? "ex.mic.stop" : "ex.mic.speak")}
      </button>
      {recording && (
        <div className="space-y-2">
          <div className="h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div
              className="h-full rounded-full bg-ok transition-[width] duration-75"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </div>
          {deviceLabel && <p className="text-sm text-muted">{t("ex.mic.device", { name: deviceLabel })}</p>}
        </div>
      )}
      {(error ?? micError) && (
        <p className="font-bold text-bad">{error ?? (micError && t(micError))}</p>
      )}
      {notice && <p className="rounded-2xl bg-surface p-4 font-bold text-muted">{t(notice)}</p>}
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
