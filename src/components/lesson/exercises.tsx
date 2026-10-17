"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookIcon, MicIcon } from "@/components/icons";
import { useApp } from "@/components/app-provider";
import { AudioButton } from "@/components/lesson/audio-button";
import { RichText } from "@/components/lesson/rich-text";
import { checkMemorized, checkSpoken, shuffle, toTiles, type CheckResult, type MarkedWord } from "@/lib/answers";
import { playSlovak, playTile, preloadLesson, stopSlovak, useSlovakPlaying } from "@/lib/audio";
import {
  isSilentTile,
  LESSON_TILE_STYLE,
  stripMarkup,
  tileStyles,
  tileWords,
  type TileStyle,
} from "@/lib/course/helpers";
import { properNames } from "@/lib/course/names";
import type { MessageKey } from "@/lib/i18n";
import type {
  RuleCard,
  BuildExercise,
  ChoiceExercise,
  FillExercise,
  GrammarExercise,
  IntroExercise,
  ListenExercise,
  MatchExercise,
  MemorizeExercise,
  SpeakExercise,
  SpellExercise,
} from "@/lib/course/types";
import { useRecorder } from "@/lib/useRecorder";

// Exercise screens. These mount only on the client (the player waits for
// hydration), so shuffling with Math.random in state initialisers is safe.

/** null = nothing entered yet. */
/** A memorize round's answer is one typed word per row, in the order the words were dealt. */
export type Answer = number | number[] | string | string[] | null;

/** Result reported by exercises that grade themselves (match, speak). */
/** `why` and `rule`: shown after a wrong answer, why the answer is right and the card that teaches it. */
export type Resolution = CheckResult & {
  solution?: string;
  heard?: string;
  skipped?: boolean;
  why?: string;
  rule?: RuleCard;
  /** Memorize rounds: the share of words spelled right (0–100). */
  score?: number;
};

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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <AudioButton text={exercise.sk} autoPlay />
        <span className="font-serif text-3xl font-medium sm:text-4xl">{exercise.sk}</span>
        {exercise.gender && (
          <span className="rounded-full border border-border-strong px-2.5 py-0.5 text-sm font-semibold text-muted">
            {t(`ex.gender.${exercise.gender}`)}
          </span>
        )}
      </div>
      <p className="text-xl text-muted">{exercise.en}</p>
      {exercise.otherGender && (
        <p className="text-lg">
          <span className="text-muted">{t(`ex.otherGender.${exercise.otherGender.gender}`)} </span>
          <span lang="sk" className="font-serif text-xl font-medium">
            {exercise.otherGender.sk}
          </span>
        </p>
      )}
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

/** `order`: the options' indexes in the order they're shown; answers stay indexes into `options`. */
type Shuffled = { order: number[] };

export function ChoiceView({ exercise, order, answer, setAnswer, locked }: Props<ChoiceExercise> & Shuffled) {
  useNumberKeys(order, setAnswer, locked);
  return (
    <div className="space-y-5 sm:space-y-8">
      <Title>{exercise.question}</Title>
      {exercise.sk &&
        (exercise.audioOnly && !locked ? (
          <div className="flex justify-center">
            <AudioButton text={exercise.sk} autoPlay size="lg" withSlow />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <AudioButton text={exercise.sk} autoPlay={!exercise.audioOnly} />
            <span className="rounded-xl border-[1.5px] border-border-strong px-4 py-3 font-serif text-2xl font-medium">
              {exercise.sk}
            </span>
          </div>
        ))}
      <div className="grid gap-3">
        {order.map((i, place) => (
          <button
            key={exercise.options[i]}
            type="button"
            disabled={locked}
            onClick={() => setAnswer(i)}
            data-state={optionState(i, answer, exercise.answer, locked)}
            className="tile flex items-center gap-4 p-4 text-left text-lg"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-current text-sm opacity-60">
              {place + 1}
            </span>
            {exercise.options[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FillView({ exercise, order, answer, setAnswer, locked }: Props<FillExercise> & Shuffled) {
  const { t } = useApp();
  useNumberKeys(order, setAnswer, locked);
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
        {order.map((i) => (
          <button
            key={exercise.options[i]}
            type="button"
            disabled={locked}
            onClick={() => setAnswer(i)}
            data-state={optionState(i, answer, exercise.answer, locked)}
            className="tile px-5 py-3 text-lg"
          >
            {exercise.options[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BuildView({
  exercise,
  tiles,
  clipsIn,
  dev = false,
  answer,
  setAnswer,
  locked,
}: Props<BuildExercise> & {
  tiles: string[];
  /** The exercise as "lesson#id", whose tiles have clips cut from its sentence. */
  clipsIn?: string;
  /** Dev mode: also every tile in each style its clip can be made in, to compare. */
  dev?: boolean;
}) {
  const { t } = useApp();
  const picked = Array.isArray(answer) ? (answer as number[]) : [];
  const toSk = exercise.promptLang === "en";
  // Lowercase, or the capitalised tile would give the first word away; names keep theirs.
  const label = (tile: string) => (exercise.keepCase?.includes(tile) ? tile : tile.toLocaleLowerCase());

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
            {label(tiles[tileIndex])}
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
                if (toSk) playTile(word, LESSON_TILE_STYLE ? clipsIn : undefined);
                setAnswer([...picked, i]);
              }}
              data-state={used ? "done" : undefined}
              className="tile h-12 px-4 text-lg"
            >
              {label(word)}
            </button>
          );
        })}
      </div>

      {dev && toSk && clipsIn && <TileStyleRows exercise={exercise} clipsIn={clipsIn} label={label} />}
    </div>
  );
}

const styleNames = Object.keys(tileStyles) as TileStyle[];

/**
 * Dev mode: a row per way of making a tile's clip (`tileStyles`), each with every tile
 * in sentence order and then the wrong ones, to compare by ear. Long words sound the
 * same in B, C and D: only short ones are slowed. E1 and E2 exist only for the
 * exercises voiced word by word so far.
 */
function TileStyleRows({
  exercise,
  clipsIn,
  label,
}: {
  exercise: BuildExercise;
  clipsIn: string;
  label: (tile: string) => string;
}) {
  const right = [...new Set(toTiles(exercise.answers[0]))];
  const wrong = exercise.distractors.filter((d) => !right.includes(d));
  useEffect(() => {
    const words = tileWords(exercise);
    preloadLesson(styleNames.flatMap((style) => words.map((text) => ({ text, in: clipsIn, style }))));
  }, [exercise, clipsIn]);
  const tile = (word: string, style: TileStyle) => (
    <button
      key={word}
      type="button"
      disabled={isSilentTile(word)}
      onClick={() => playTile(word, clipsIn, style)}
      className="tile h-8 px-2.5 text-sm"
    >
      {label(word)}
    </button>
  );
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-border-strong p-3 text-sm">
      <p className="text-muted">
        Dev: tile sounds in each style. Lessons play {LESSON_TILE_STYLE ? "the (lessons) style" : "each word's own clip"};
        a tile with no clip in a style plays nothing here, and its own clip in lessons.
      </p>
      {styleNames.map((style) => (
        <div key={style} className="flex flex-wrap items-center gap-1.5">
          <span className="basis-full text-muted sm:basis-48">
            {tileStyles[style].label}
            {style === LESSON_TILE_STYLE && " (lessons)"}
          </span>
          {right.map((word) => tile(word, style))}
          {wrong.length > 0 && (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span className="px-1 text-muted">wrong:</span>
              {wrong.map((word) => tile(word, style))}
            </span>
          )}
        </div>
      ))}
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
        target={exercise.sk}
      />
    </div>
  );
}

/** One word to type from audio, with its meaning when the course teaches it. */
export function SpellView({ exercise, answer, setAnswer, locked }: Props<SpellExercise>) {
  const { t } = useApp();
  return (
    <div className="space-y-4 sm:space-y-8">
      <Title>{t(exercise.fromMeaning ? "ex.writeSlovak" : "ex.spell")}</Title>
      {exercise.fromMeaning ? (
        // Recall from the meaning alone: the sound would give the answer away.
        <p className="text-center font-serif text-2xl">{exercise.en}</p>
      ) : (
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <AudioButton text={exercise.sk} autoPlay size="lg" withSlow />
          {exercise.en && <p className="text-muted sm:text-lg">{exercise.en}</p>}
        </div>
      )}
      <TypedAnswer
        answer={answer}
        setAnswer={setAnswer}
        locked={locked}
        rows={1}
        placeholder={t("ex.spellPlaceholder")}
        target={exercise.sk}
      />
    </div>
  );
}

/**
 * A text box for Slovak, with keys for the letters most keyboards lack, and a hint that
 * shows the answer's outline in the box (`target`: the answer).
 */
function TypedAnswer({
  answer,
  setAnswer,
  locked,
  rows,
  placeholder,
  target,
}: Omit<Props<unknown>, "exercise"> & { rows: number; placeholder: string; target: string }) {
  const { t } = useApp();
  const [hint, setHint] = useState(false);
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
      <div className="relative rounded-xl border-[1.5px] border-border-strong bg-bg focus-within:border-accent">
      {hint && <Ghost target={target} typed={text} className="inset-0 p-4 font-mono text-xl break-words whitespace-pre-wrap" />}
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
        placeholder={hint ? undefined : placeholder}
        className="relative block w-full resize-none rounded-xl bg-transparent p-4 font-mono text-xl outline-none"
      />
      </div>
      <SlovakKeys
        label={t("ex.accentKeys")}
        disabled={locked}
        onKey={insert}
        extra={!locked && <HintButton on={hint} onToggle={() => setHint(!hint)} />}
      />
    </>
  );
}

type Tone = "right" | "near" | "wrong";
const TONE: Record<Tone, string> = { right: "bg-ok/25", near: "bg-gold/30", wrong: "bg-bad/20" };

/**
 * A typed word against the answer's, once it has as many letters (case and punctuation
 * aside): right, one letter off (a missing accent counts), or wrong. A one-letter word
 * is right or wrong: its one letter off is the whole word. Null until then.
 */
function toneOf(typed: string, word: string): Tone | null {
  const letters = (w: string) => [...w.normalize("NFC").toLocaleLowerCase("sk")].filter((ch) => /[\p{L}\p{N}]/u.test(ch));
  const a = letters(typed);
  const b = letters(word);
  if (a.length !== b.length) return null;
  const off = a.filter((ch, i) => ch !== b[i]).length;
  return off === 0 ? "right" : off === 1 && b.length > 1 ? "near" : "wrong";
}

/**
 * A word of the answer as a hint shows it: its letters invisible, on one block, off-white
 * or, once the typed word has as many letters, shaded by `tone`.
 */
function Shape({ word, tone = null, className = "" }: { word: string; tone?: Tone | null; className?: string }) {
  return (
    <span className={`whitespace-pre ${className}`}>
      {(word.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) ?? []).map((run, i) =>
        /[\p{L}\p{N}]/u.test(run) ? (
          <span key={i} className={`rounded-sm ${tone ? TONE[tone] : "bg-surface-2"}`}>
            {run}
          </span>
        ) : (
          run
        ),
      )}
    </span>
  );
}

/**
 * The hint for a typed answer: each word of the answer as an off-white block, in the
 * box's own monospace type (every letter as wide), behind the text box (`className`: the
 * box's padding and type, so the two line up). It tells how many words there are and how
 * many letters each has. The blocks follow the typing, not the answer: the typed text is laid out
 * here as the box lays it out, each typed word's block starting where that word does,
 * the word being typed keeping room for the whole word, and the words still to come
 * after it. So a word typed shorter or longer (a missing accent, a typo) moves nothing.
 * A typed word with the right number of letters shades its block: green when right,
 * yellow when one letter is off (in a longer word), red otherwise.
 */
function Ghost({ target, typed, className }: { target: string; typed: string; className: string }) {
  const words = target.split(/\s+/).filter(Boolean);
  // Typed words and the spaces between them, as typed.
  const parts = typed.split(/(\s+)/).filter(Boolean);
  const open = typed !== "" && !/\s$/.test(typed);
  let k = 0;
  const laid = parts.map((part, i) => {
    if (/^\s/.test(part)) return part;
    const word = words[k++];
    if (!word) return <span key={i}>{part}</span>;
    // The word being typed: as wide as the typing or the whole word, whichever is wider.
    if (open && i === parts.length - 1) {
      return (
        <span key={i} className="inline-grid">
          <span className="[grid-area:1/1]">{part}</span>
          <Shape word={word} tone={toneOf(part, word)} className="[grid-area:1/1]" />
        </span>
      );
    }
    // A finished word: as wide as typed, so what follows sits where the box puts it, its
    // whole word's block running on past it from a zero-width cell. Stacked in one grid
    // cell rather than positioned, so the block keeps to the text's baseline.
    return (
      <span key={i} className="inline-grid">
        <span className="[grid-area:1/1]">{part}</span>
        <span className="w-0 [grid-area:1/1]">
          <Shape word={word} tone={toneOf(part, word)} />
        </span>
      </span>
    );
  });
  const rest = words.slice(k).flatMap((word, j) => [j > 0 || open ? " " : "", <Shape key={`rest-${j}`} word={word} />]);
  return (
    <div aria-hidden className={`pointer-events-none absolute text-transparent select-none ${className}`}>
      {/* One inline run, so the spaces between words survive a flex box. */}
      <span>
        {laid}
        {rest}
      </span>
    </div>
  );
}

/** Shows or hides a typed answer's outline. Keeps the focus in the text box. */
function HintButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const { t } = useApp();
  return (
    <button
      type="button"
      aria-pressed={on}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onToggle}
      className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-accent hover:bg-surface-2"
    >
      {t(on ? "ex.hintHide" : "ex.hint")}
    </button>
  );
}

/** On-screen keys for Slovak letters most keyboards don't have (plain letters come from the keyboard). */
function SlovakKeys({
  label,
  onKey,
  disabled,
  extra,
}: {
  label: string;
  onKey: (ch: string) => void;
  disabled: boolean;
  /** Beside the label, at the right (the hint button). */
  extra?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-muted">{label}</p>
        {extra}
      </div>
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

/** Memorize rounds: how long the rows take to blur, and to clear again. */
const BLUR_MS = 250;

/** A new order for n rows in which every row's content moves somewhere else. */
function derangement(n: number): number[] {
  const start = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return start;
  for (;;) {
    const order = shuffle([...start]);
    if (order.every((v, i) => v !== i)) return order;
  }
}

/**
 * Writing practice: a few words to memorize. While studying, each meaning stands beside its
 * Slovak. Once the learner is ready (`studied`), the rows blur and clear again with the
 * meanings in a new order (so a word's place gives nothing away) and a box to type each
 * word in. The rows themselves stay put. `answer` holds the typed words in the order they
 * were dealt, whatever the rows show.
 */
export function MemorizeView({
  exercise,
  answer,
  setAnswer,
  locked,
  studied,
}: Props<MemorizeExercise> & { studied: boolean }) {
  const { t } = useApp();
  const words = exercise.words ?? [];
  const typed = Array.isArray(answer) ? (answer as string[]) : words.map(() => "");
  const [phase, setPhase] = useState<"study" | "hiding" | "write">(studied ? "write" : "study");
  const [order, setOrder] = useState(() => words.map((_, i) => i));
  const [hint, setHint] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focused = useRef(0);
  const caret = useRef<number | null>(null);

  // Ready: blur the rows, put the meanings in a new order while they're blurred, and let
  // them clear with the boxes in. At once with reduced motion. Once per round: a round
  // brought back already studied starts with its boxes.
  const started = useRef(studied);
  useEffect(() => {
    if (!studied || started.current) return;
    started.current = true;
    const reveal = () => {
      setOrder((current) => derangement(current.length).map((i) => current[i]));
      setPhase("write");
    };
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps: [number, () => void][] = still
      ? [[0, reveal]]
      : [
          [0, () => setPhase("hiding")],
          [BLUR_MS, reveal],
        ];
    const timers = steps.map(([ms, run]) => setTimeout(run, ms));
    return () => {
      timers.forEach(clearTimeout);
      started.current = false;
    };
  }, [studied]);

  useEffect(() => {
    if (phase === "write" && !locked) inputs.current[order[0]]?.focus();
    // Only when the boxes first appear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Accent keys type into the focused box, at its cursor.
  function insert(ch: string) {
    const i = focused.current;
    const el = inputs.current[i];
    const text = typed[i] ?? "";
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    caret.current = start + ch.length;
    setAnswer(typed.map((v, j) => (j === i ? text.slice(0, start) + ch + text.slice(end) : v)));
  }
  useLayoutEffect(() => {
    const el = inputs.current[focused.current];
    if (caret.current === null || !el) return;
    el.focus();
    el.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  const marks = locked ? checkMemorized(words.map((w) => w.sk), typed) : null;
  // The heading and both sides of each row blur together, and clear with their new content.
  const haze = `transition-[filter,opacity] duration-[250ms] ${phase === "hiding" ? "opacity-60 blur-md select-none" : ""}`;
  return (
    // Every part keeps its size from studying to typing, so nothing jumps when the boxes
    // appear: both headings share one place (the taller sets its height), a word sits in a
    // box shaped like the input that replaces it, and the accent keys are there, unseen.
    <div className="space-y-6">
      <div className={`grid ${haze}`}>
        <div className={`[grid-area:1/1] ${phase === "write" ? "invisible" : ""}`}>
          <Title>{t("ex.memorize.title")}</Title>
          <p className="mt-2 text-muted">{t("ex.memorize.prompt")}</p>
        </div>
        <div className={`[grid-area:1/1] ${phase === "write" ? "" : "invisible"}`}>
          <Title>{t("ex.memorize.write")}</Title>
        </div>
      </div>
      <ol className="space-y-3">
        {order.map((i, place) => {
          const word = words[i];
          const mark = marks?.[i];
          // Rows are keyed by place, so a row stays where it is and only its content blurs
          // and clears, the new content coming into focus in place.
          return (
            <li
              key={place}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3 rounded-xl border border-border bg-bg p-3"
            >
              <span className={`text-muted ${haze}`}>{word.en}</span>
              <div className={`min-w-0 ${haze}`}>
                {phase === "write" ? (
                  <>
                    <div className="relative">
                    {hint && (
                      <Ghost
                        target={word.sk}
                        typed={typed[i] ?? ""}
                        className="inset-[1.5px] flex items-center overflow-hidden px-3 font-mono text-lg whitespace-pre"
                      />
                    )}
                    <input
                      key={i}
                      ref={(el) => {
                        inputs.current[i] = el;
                      }}
                      value={typed[i] ?? ""}
                      onChange={(e) => setAnswer(typed.map((v, j) => (j === i ? e.target.value : v)))}
                      onFocus={() => {
                        focused.current = i;
                      }}
                      onKeyDown={(e) => {
                        // Enter goes to the next box; on the last one it checks (the player's key handler).
                        if (e.key !== "Enter") return;
                        const next = order[place + 1];
                        if (next === undefined) return;
                        e.preventDefault();
                        e.stopPropagation();
                        inputs.current[next]?.focus();
                      }}
                      disabled={locked}
                      lang="sk"
                      spellCheck={false}
                      autoCapitalize="off"
                      autoComplete="off"
                      autoCorrect="off"
                      placeholder={hint ? undefined : t("ex.memorize.placeholder")}
                      aria-label={word.en}
                      data-mark={mark}
                      className={`relative h-12 w-full rounded-lg border-[1.5px] border-border-strong px-3 font-mono text-lg outline-none focus:border-accent data-[mark=accents]:border-gold data-[mark=exact]:border-ok data-[mark=wrong]:border-bad ${hint ? "bg-transparent" : "bg-bg"}`}
                    />
                    </div>
                    {mark && mark !== "exact" && <p className="mt-1 font-mono text-base font-semibold">{word.sk}</p>}
                  </>
                ) : (
                  <div
                    lang="sk"
                    className="flex h-12 items-center rounded-lg border-[1.5px] border-transparent px-3 font-mono text-lg font-semibold"
                  >
                    {word.sk}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className={phase === "write" ? "transition-opacity duration-300" : "invisible opacity-0"}>
        <SlovakKeys
          label={t("ex.accentKeys")}
          disabled={locked || phase !== "write"}
          onKey={insert}
          extra={!locked && <HintButton on={hint} onToggle={() => setHint(!hint)} />}
        />
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

/**
 * An answer's expected sentence, marked: forgiven slips and names in yellow, mistakes in
 * red. `className` sets the type (default: the feedback footer's).
 */
export function MarkedSentence({
  words,
  className = "text-lg font-semibold",
}: {
  words: MarkedWord[];
  className?: string;
}) {
  return (
    <p className={className}>
      {words.map(({ text, mark }, i) => {
        // Highlight the word itself, not the punctuation around it.
        const [, lead, core, trail] = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(text) ?? ["", "", text, ""];
        const look =
          mark === "bad"
            ? "rounded bg-bad/15 px-0.5 underline decoration-bad decoration-2 underline-offset-4"
            : mark === "soft"
              ? "rounded bg-gold/30 px-0.5"
              : undefined;
        return (
          <Fragment key={i}>
            {i > 0 && " "}
            {lead}
            <span className={look}>{core}</span>
            {trail}
          </Fragment>
        );
      })}
    </p>
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
  // The mic stays open while the card waits for an answer, except while Slovak audio plays.
  const playing = useSlovakPlaying();
  const { recording, finishing, error: micError, level, deviceLabel, start, stop } = useRecorder(!locked && !playing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);
  // A miss gets one more try, after hearing the sentence; the second answer counts.
  const [miss, setMiss] = useState<Resolution | null>(null);

  async function record() {
    if (recording) return stop();
    setError(null);
    setNotice(null);
    stopSlovak();
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
      body.append("expected", exercise.sk);
      body.append("peak", rec.peak.toFixed(4));
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
      const result: Resolution = {
        ...checkSpoken(heard, exercise.sk, (word) => properNames.has(word)),
        solution: exercise.sk,
        heard,
      };
      if (!result.correct && !miss) {
        setMiss(result);
        void playSlovak(exercise.sk);
        return;
      }
      onResolve(result);
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
          {miss?.words && !locked ? (
            <MarkedSentence words={miss.words} className="font-serif text-2xl font-medium" />
          ) : (
            <p className="font-serif text-2xl font-medium">{exercise.sk}</p>
          )}
          <p className="text-muted">{exercise.en}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={record}
        disabled={locked || busy || finishing}
        className={`btn btn-ghost h-20 w-full text-lg ${recording ? "!border-bad !text-bad" : ""}`}
      >
        <MicIcon size={30} className={recording ? "animate-pulse" : ""} />
        {t(busy || finishing ? "ex.mic.checking" : recording ? "ex.mic.stop" : "ex.mic.speak")}
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
      {miss && !locked && (
        <div className="rounded-2xl bg-bad-soft p-4 text-bad-dark">
          <p className="font-semibold">{t("ex.mic.tryAgain")}</p>
          <p className="text-sm font-semibold opacity-80">{t("lesson.weHeard", { text: miss.heard || "…" })}</p>
        </div>
      )}
      {(error ?? micError) && (
        <p className="font-bold text-bad">{error ?? (micError && t(micError))}</p>
      )}
      {notice && <p className="rounded-2xl bg-surface p-4 font-bold text-muted">{t(notice)}</p>}
    </div>
  );
}

/** Keys 1–n pick an option, counting in the order they're shown. */
function useNumberKeys(order: number[], setAnswer: (a: Answer) => void, locked: boolean) {
  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= order.length) setAnswer(order[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, setAnswer, locked]);
}
