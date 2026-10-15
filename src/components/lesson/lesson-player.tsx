"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/app-provider";
import { BoltIcon, CheckIcon, CloseIcon, CrownIcon, StarIcon } from "@/components/icons";
import {
  BuildView,
  ChoiceView,
  FillView,
  GrammarView,
  IntroView,
  ListenView,
  MatchView,
  SpeakView,
  SpellView,
  type Answer,
  type Resolution,
} from "@/components/lesson/exercises";
import { VolumeSlider } from "@/components/lesson/volume-slider";
import { checkBuilt, checkSpelled, checkTyped, shuffle, toTiles, type MarkedWord } from "@/lib/answers";
import { playSlovak, preloadLesson, stopSlovak } from "@/lib/audio";
import { fillSentence, speakableTexts } from "@/lib/course/helpers";
import type { Illustration } from "@/lib/course/illustrations";
import { properNames } from "@/lib/course/names";
import type { Exercise, Lesson } from "@/lib/course/types";
import { setDictionaryQuery } from "@/lib/dictionary-store";
import { taughtItemIds } from "@/lib/review/items";
import { markSeen } from "@/lib/review/store";
import { unlockAllLessons } from "@/lib/env";
import type { Locale } from "@/lib/i18n";

/** A queued exercise: its index in the lesson (so a language switch updates the text). */
type Item = { index: number; key: string; retry: boolean };
type Phase = "playing" | "done" | "paywall";
type Summary = { xp: number; score: number; seconds: number };

const praise = ["Výborne!", "Super!", "Skvelé!", "Presne tak!", "Správne!"];

/** Grades exercises that use the Check button. `tiles` is the build exercise's word bank. */
function grade(ex: Exercise, answer: Answer, tiles: string[]): Resolution {
  switch (ex.type) {
    case "choice":
      return { correct: answer === ex.answer, solution: ex.options[ex.answer] };
    case "fill":
      return {
        correct: answer === ex.answer,
        solution: fillSentence(ex.before, ex.options[ex.answer], ex.after),
      };
    case "build": {
      const words = Array.isArray(answer) ? answer.map((i) => tiles[i]) : [];
      return { ...checkBuilt(words, ex.answers), solution: ex.answers[0] };
    }
    case "listen":
      return {
        ...checkTyped(typeof answer === "string" ? answer : "", [ex.sk], (word) => properNames.has(word)),
        solution: ex.sk,
      };
    case "spell":
      return { ...checkSpelled(typeof answer === "string" ? answer : "", ex.sk), solution: ex.sk };
    default:
      return { correct: true };
  }
}

/** The Slovak text to read aloud after an answer is checked, if any. */
function solutionAudio(ex: Exercise): string | null {
  switch (ex.type) {
    case "choice":
      return ex.optionsLang === "sk" ? ex.options[ex.answer] : null;
    case "fill":
      return fillSentence(ex.before, ex.options[ex.answer], ex.after);
    case "build":
      return ex.promptLang === "en" ? ex.answers[0] : null;
    default:
      return null;
  }
}

function hasAnswer(answer: Answer): boolean {
  if (answer === null) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === "string") return answer.trim().length > 0;
  return true;
}

type PlayerProps = {
  /** The lesson in each native language (same exercises, translated). */
  lessons: Record<Locale, Lesson>;
  /** The lesson's unit needs Premium. */
  premiumUnit: boolean;
  /** The following lesson, for the "Next lesson" button. */
  nextId: string | null;
  /** The lesson's pictures by exercise index. */
  pictures: Record<number, Illustration>;
  /** Unit number and the lesson's number within it, for the header. */
  place: { unit: number; lesson: number };
  /** Every lesson in the course, for the course progress in the header. */
  courseLessonIds: string[];
};

/** An exercise already played: what was answered, so it can be shown again. */
type Visit = { answer: Answer; tiles: string[]; result: Resolution | null };

export function LessonPlayer(props: PlayerProps) {
  const lessonId = props.lessons.en.id;
  const router = useRouter();
  const search = useSearchParams();
  const { ready, authEnabled, authKnown, user, profile } = useApp();
  const signedOut = authEnabled && authKnown && !user;

  // The proxy already redirects signed-out visitors; this covers client-side navigation.
  useEffect(() => {
    if (signedOut) {
      const next = `/lesson/${lessonId}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [signedOut, router, lessonId]);

  // Wait for hydration (progress lives in localStorage, exercises shuffle on
  // mount) and for the profile, which decides whether premium units are open.
  const profileLoading = user !== null && profile === null;
  if (!ready || !authKnown || signedOut || profileLoading) return <div className="min-h-dvh" />;
  // Next keeps recently visited pages alive and shows them as they were left. A lesson
  // should instead start afresh on every visit (a link, not Back): keyed by the visit
  // (bfcacheId) and by the card a dictionary result asks for.
  const card = search.get("card");
  return (
    <Player key={`${lessonId}:${router.bfcacheId}:${card}`} {...props} card={card} step={search.get("step")} />
  );
}

/** Testing only (unlock-all switch): `?step=N` opens the lesson at exercise N. */
function startStep(count: number, param: string | null): number {
  if (!unlockAllLessons || param === null) return 0;
  const step = Number(param);
  return Number.isInteger(step) && step > 0 && step < count ? step : 0;
}

/**
 * `?card=N`, from the dictionary on /learn: just that teaching card, then back to
 * /learn. Null for a normal run (or if exercise N isn't a teaching card).
 */
function lookUpCard(exercises: Exercise[], param: string | null): number | null {
  const card = Number(param);
  const ex = param === null ? undefined : exercises[card];
  return Number.isInteger(card) && (ex?.type === "intro" || ex?.type === "grammar") ? card : null;
}

function Player({
  lessons,
  premiumUnit,
  nextId,
  pictures,
  place,
  courseLessonIds,
  card,
  step,
}: PlayerProps & { card: string | null; step: string | null }) {
  const router = useRouter();
  const { isPremium, completeLesson, t, locale, progress } = useApp();
  const lesson = lessons[locale];
  const lessonId = lesson.id;

  const [queue, setQueue] = useState<Item[]>(() =>
    lesson.exercises.map((_, index) => ({ index, key: String(index), retry: false })),
  );
  const [pos, setPos] = useState(() => startStep(lesson.exercises.length, step));
  // Looking a word up: one card, open in any unit (its word and meaning already show in the search).
  const lookUp = lookUpCard(lesson.exercises, card);
  const [phase, setPhase] = useState<Phase>(() =>
    lookUp === null && premiumUnit && !isPremium && !unlockAllLessons ? "paywall" : "playing",
  );
  const stats = useRef({ right: 0, graded: 0, startedAt: 0 });
  // Played exercises by queue key, and the one being looked back at (a queue position).
  const [history, setHistory] = useState<Record<string, Visit>>({});
  const [viewing, setViewing] = useState<number | null>(null);

  // Fetch and decode the lesson's pictures up front, so each one is ready when its
  // exercise appears instead of loading in after it.
  useEffect(() => {
    for (const src of new Set(Object.values(pictures).map((p) => p.src))) {
      const img = new window.Image();
      img.src = src;
      img.decode().catch(() => {});
    }
  }, [pictures]);

  // Same for its audio: every clip, fetched in the background from the start.
  useEffect(() => {
    if (phase !== "paywall" && lookUp === null) preloadLesson(lesson.exercises.flatMap(speakableTexts));
  }, [lesson, phase, lookUp]);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    stats.current.startedAt = Date.now();
  }, []);

  const item = queue[pos];
  const exercise = lesson.exercises[item.index];

  function onGraded(r: Resolution, answer: Answer, tiles: string[]) {
    setHistory((h) => ({ ...h, [item.key]: { answer, tiles, result: r } }));
    if (r.skipped) return;
    if (!item.retry) {
      stats.current.graded++;
      if (r.correct) stats.current.right++;
    }
    // Mistakes come back once at the end of the lesson.
    if (!r.correct && !item.retry) {
      setQueue((q) => [...q, { index: item.index, key: `${item.key}r`, retry: true }]);
    }
    const audio = solutionAudio(exercise);
    if (audio) void playSlovak(audio);
  }

  function next() {
    // Teaching cards have no answer; remember them as seen, and put what they
    // teach into the learner's review deck.
    setHistory((h) => (h[item.key] ? h : { ...h, [item.key]: { answer: null, tiles: [], result: null } }));
    markSeen(taughtItemIds(exercise));
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      return;
    }
    const { right, graded, startedAt } = stats.current;
    const score = graded ? Math.round((right / graded) * 100) : 100;
    const xp = 10 + (score === 100 ? 5 : 0);
    completeLesson(lessonId, score, xp);
    markSeen(lesson.exercises.flatMap(taughtItemIds)); // all of it, even cards skipped past
    setSummary({ xp, score, seconds: Math.round((Date.now() - startedAt) / 1000) });
    setPhase("done");
  }

  if (phase === "paywall") return <PaywallScreen />;
  if (phase === "done" && summary) {
    return (
      <DoneScreen
        {...summary}
        nextId={nextId}
        onContinue={() => router.push("/learn")}
      />
    );
  }

  // Each exercise fills its share once settled: answered, or for a miss, once its
  // second try is answered. A mistake holds the bar still rather than pulling it back.
  const lastTry = new Map(queue.map((q, i) => [q.index, i]));
  const settled = queue.filter(
    (q, i) => lastTry.get(q.index) === i && (i < pos || (i === pos && history[q.key]?.result)),
  ).length;
  const progressPct = (settled / lesson.exercises.length) * 100;
  // Lessons with pictures get a wider frame: on wide screens a step with a
  // picture shows the exercise on the left and the picture on the right; steps
  // without one stay centred.
  const book = Object.keys(pictures).length > 0;
  const frame = book ? "max-w-6xl px-4 lg:px-8" : "max-w-3xl px-4";

  const done = courseLessonIds.filter((id) => progress.completed[id]).length;
  const coursePct = Math.round((done / courseLessonIds.length) * 100);

  // Looking back at a finished exercise, or playing the current one. Either way an
  // exercise that was already answered comes back with its answer and result.
  const reviewing = viewing !== null;
  const shown = reviewing ? queue[viewing] : item;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className={`mx-auto w-full pt-3 sm:pt-5 ${frame}`}>
        <div className="flex items-center gap-3">
          <Link
            href="/learn"
            aria-label={t("lesson.quit")}
            className="shrink-0 text-muted hover:text-text"
            onClick={(e) => {
              if (pos > 0 && !confirm(t("lesson.quitConfirm"))) e.preventDefault();
            }}
          >
            <CloseIcon size={28} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted">{t("lesson.place", place)}</p>
            <p className="hidden truncate font-serif text-lg leading-tight sm:block">{lesson.title}</p>
          </div>
          {/* Phones have room for it beside the course (the lesson's title is hidden); wider screens, under it. */}
          <VolumeSlider className="flex sm:hidden" />
          <div className="shrink-0 text-right">
            <p className="text-xs font-semibold text-muted">{t("lesson.course")}</p>
            <p className="text-sm leading-tight font-semibold text-brand sm:text-lg">
              {t("lesson.coursePct", { pct: coursePct })}
            </p>
            <VolumeSlider className="mt-1 hidden sm:flex" />
          </div>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-locked sm:mt-3">
          {lookUp === null ? (
            <div
              className="h-full rounded-full bg-lichen transition-[width] duration-300"
              style={{ width: `${Math.max(progressPct, 2)}%` }}
            />
          ) : (
            // Not a run through the lesson: grey, just marking where the card sits in it.
            <div
              className="h-full rounded-full bg-border-strong"
              style={{ width: `${((lookUp + 1) / lesson.exercises.length) * 100}%` }}
            />
          )}
        </div>
      </header>

      {lookUp !== null ? (
        <Step
          key={`card-${lookUp}-${locale}`}
          exercise={lesson.exercises[lookUp]}
          illustration={pictures[lookUp]}
          frame={frame}
          nextLabel={t("lesson.return")}
          nav={null}
          onGraded={() => {}}
          onNext={() => {
            // Back to the dictionary with an empty search box.
            setDictionaryQuery("");
            router.push("/learn");
          }}
        />
      ) : (
        // Remounts on a language switch so word tiles are rebuilt in the new language.
        <Step
          key={`${shown.key}-${locale}${reviewing ? "-review" : ""}`}
          exercise={lesson.exercises[shown.index]}
          illustration={pictures[shown.index]}
          frame={frame}
          initial={history[shown.key]}
          review={reviewing}
          nextLabel={reviewing ? t("lesson.backTo", { n: item.index + 1 }) : undefined}
          nav={
            <StepNav
              queue={queue}
              pos={pos}
              viewing={viewing}
              history={history}
              onPick={(i) => setViewing(i < pos ? i : null)}
            />
          }
          onGraded={onGraded}
          onNext={reviewing ? () => setViewing(null) : next}
        />
      )}
    </div>
  );
}

/** One exercise: owns its answer, word tiles and result. Remounted per queue item. Also used by reviews. */
export function Step({
  exercise: ex,
  illustration,
  frame,
  initial,
  review = false,
  nextLabel,
  nav,
  skip,
  onGraded,
  onNext,
}: {
  exercise: Exercise;
  illustration?: Illustration;
  /** Width classes shared with the top bar and footer. */
  frame: string;
  /** An earlier answer to restore (a finished exercise, or the current one after a look back). */
  initial?: Visit;
  /** Looking back at a finished exercise: read-only, and Continue returns to the current one. */
  review?: boolean;
  /** Label for the Continue button (e.g. "Back to exercise 5" when reviewing). */
  nextLabel?: string;
  /** The lesson's exercise navigation, shown in the footer (null when looking a word up). */
  nav: React.ReactNode;
  /** A way out of this exercise other than answering (default: "Can't speak now" on speaking). */
  skip?: { label: string; onSkip: () => void };
  onGraded: (r: Resolution, answer: Answer, tiles: string[]) => void;
  onNext: () => void;
}) {
  const [answer, setAnswer] = useState<Answer>(initial?.answer ?? null);
  const [result, setResult] = useState<Resolution | null>(initial?.result ?? null);
  const [tiles] = useState(() =>
    initial?.tiles.length
      ? initial.tiles
      : ex.type === "build"
        ? shuffle([...toTiles(ex.answers[0]), ...ex.distractors])
        : [],
  );

  // Teaching cards have no answer: just Continue.
  // Leaving an exercise silences its audio (e.g. the answer read out after Check).
  useEffect(() => stopSlovak, []);

  const isIntro = ex.type === "intro" || ex.type === "grammar";
  const selfGraded = ex.type === "match" || ex.type === "speak";
  const locked = result !== null || review;

  const resolve = (r: Resolution) => {
    if (review) return;
    setResult(r);
    onGraded(r, answer, tiles);
  };
  const check = () => {
    if (!result && hasAnswer(answer)) resolve(grade(ex, answer, tiles));
  };

  // Enter checks or continues. Re-subscribed every render so it sees fresh state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (result || isIntro || review) onNext();
      else if (!selfGraded) check();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <div
        className={`mx-auto w-full flex-1 py-4 sm:py-8 ${
          illustration
            ? "grid max-w-6xl content-center items-center gap-6 px-4 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:gap-x-16 lg:px-8"
            : "flex max-w-2xl flex-col justify-center px-4"
        }`}
      >
        {illustration && (
          // Decorative: the exercise's own text says what it shows. Phones: small, above
          // the exercise; wide screens: the right-hand page.
          // Already sized and compressed for the web (render-plan.ts), so served as is:
          // the same URL the lesson preloads, straight from the cache.
          <Image
            src={illustration.src}
            width={illustration.width}
            height={illustration.height}
            alt=""
            unoptimized
            preload
            className="illustration mx-auto h-auto max-h-[24dvh] w-auto max-w-full lg:order-last lg:max-h-[calc(100dvh-14rem)]"
          />
        )}
        <div className="min-w-0">
          {ex.type === "intro" && <IntroView exercise={ex} />}
          {ex.type === "grammar" && <GrammarView exercise={ex} />}
          {ex.type === "choice" && (
            <ChoiceView exercise={ex} answer={answer} setAnswer={setAnswer} locked={locked} />
          )}
          {ex.type === "fill" && (
            <FillView exercise={ex} answer={answer} setAnswer={setAnswer} locked={locked} />
          )}
          {ex.type === "build" && (
            <BuildView exercise={ex} tiles={tiles} answer={answer} setAnswer={setAnswer} locked={locked} />
          )}
          {ex.type === "listen" && (
            <ListenView exercise={ex} answer={answer} setAnswer={setAnswer} locked={locked} />
          )}
          {ex.type === "spell" && (
            <SpellView exercise={ex} answer={answer} setAnswer={setAnswer} locked={locked} />
          )}
          {ex.type === "match" && <MatchView exercise={ex} onResolve={resolve} locked={locked} />}
          {ex.type === "speak" && <SpeakView exercise={ex} onResolve={resolve} locked={locked} />}
        </div>
      </div>

      <Footer
        frame={frame}
        result={result}
        canCheck={hasAnswer(answer)}
        mode={isIntro || review ? "continue" : selfGraded ? "self" : "check"}
        nextLabel={nextLabel}
        nav={nav}
        onCheck={check}
        onNext={onNext}
        onSkip={skip?.onSkip ?? (ex.type === "speak" && !review ? onNext : undefined)}
        skipLabel={skip?.label}
      />
    </>
  );
}

function Footer({
  frame,
  result,
  canCheck,
  mode,
  nextLabel,
  nav,
  onCheck,
  onNext,
  onSkip,
  skipLabel,
}: {
  frame: string;
  result: Resolution | null;
  canCheck: boolean;
  mode: "check" | "continue" | "self";
  nextLabel?: string;
  nav: React.ReactNode;
  onCheck: () => void;
  onNext: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  const { t } = useApp();
  const [word] = useState(() => praise[Math.floor(Math.random() * praise.length)]);
  // Phones: its own row on top. Wider screens: centred in the space the other parts
  // leave, or on a row of its own when a long answer leaves too little.
  const navSlot = nav && (
    <div className="order-first flex basis-full justify-center sm:order-none sm:flex-1 sm:basis-0">{nav}</div>
  );

  if (result) {
    const ok = result.correct;
    return (
      <footer className={`animate-slide-up ${ok ? "bg-ok-soft" : "bg-bad-soft"}`}>
        <div className={`mx-auto flex flex-wrap items-center gap-x-6 gap-y-3 py-3 sm:gap-y-4 sm:py-6 ${frame}`}>
          <div className="flex basis-full gap-4 sm:basis-auto">
            <span
              className={`grid size-14 shrink-0 place-items-center rounded-full bg-bg ${ok ? "text-ok" : "text-bad"}`}
            >
              {ok ? <CheckIcon size={30} /> : <CloseIcon size={30} />}
            </span>
            <div className={ok ? "text-ok-dark" : "text-bad-dark"}>
              <p className="text-2xl font-semibold">{ok ? word : t("lesson.correctSolution")}</p>
              {result.words ? (
                <MarkedSentence words={result.words} />
              ) : (
                !ok && result.solution && <p className="text-lg font-semibold">{result.solution}</p>
              )}
              {result.heard !== undefined && (
                <p className="text-sm font-semibold opacity-80">
                  {t("lesson.weHeard", { text: result.heard || "…" })}
                </p>
              )}
              {result.note && <p className="text-sm font-semibold">{t(result.note)}</p>}
            </div>
          </div>
          {navSlot}
          <button type="button" onClick={onNext} className={`btn ${ok ? "btn-ok" : "btn-bad"} w-full sm:ml-auto sm:w-auto sm:min-w-40`}>
            {nextLabel ?? t("lesson.continue")}
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border">
      <div className={`mx-auto flex flex-wrap items-center gap-x-6 gap-y-3 py-3 sm:py-6 ${frame}`}>
        {onSkip && (
          <button type="button" onClick={onSkip} className="btn btn-ghost">
            {skipLabel ?? t("lesson.cantSpeak")}
          </button>
        )}
        {navSlot}
        {mode === "continue" ? (
          <button type="button" onClick={onNext} className="btn btn-ok ml-auto sm:min-w-40">
            {nextLabel ?? t("lesson.continue")}
          </button>
        ) : mode === "check" ? (
          <button type="button" onClick={onCheck} disabled={!canCheck} className="btn btn-ok ml-auto sm:min-w-40">
            {t("lesson.check")}
          </button>
        ) : null}
      </div>
    </footer>
  );
}

/** A typed answer's expected sentence: forgiven slips and names in yellow, mistakes in red. */
function MarkedSentence({ words }: { words: MarkedWord[] }) {
  return (
    <p className="text-lg font-semibold">
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

/**
 * The lesson in the order it's played: one bar per exercise, then, after a gap, a
 * second try for each one missed (added as mistakes happen). Finished ones can be
 * opened again; the current one returns to playing.
 */
function StepNav({
  queue,
  pos,
  viewing,
  history,
  onPick,
}: {
  queue: Item[];
  pos: number;
  viewing: number | null;
  history: Record<string, Visit>;
  onPick: (index: number) => void;
}) {
  const { t } = useApp();
  const firstRetry = queue.findIndex((item) => item.retry);
  return (
    <nav aria-label={t("lesson.nav")} className="w-full">
      {/* Bars keep a 1:4 shape while there's room and narrow when a lesson runs long. */}
      <ol className="flex justify-center gap-1.5">
        {queue.map((item, i) => {
          const result = history[item.key]?.result;
          const state = result ? (result.correct ? "right" : "wrong") : i === pos ? "current" : i > pos ? "upcoming" : "seen";
          const look = {
            current: "bg-brand",
            // A second try still ahead is an outline, so it doesn't read as a new exercise.
            upcoming: item.retry ? "border-[1.5px] border-muted/40" : "bg-border-strong",
            seen: "bg-lichen group-hover:bg-accent",
            right: "bg-ok group-hover:bg-ok-dark",
            wrong: "bg-bad group-hover:bg-bad-dark",
          }[state];
          const open = viewing === i || (viewing === null && i === pos);
          const label = t(item.retry ? "lesson.navRetry" : "lesson.navItem", { n: item.index + 1 });
          return (
            <li key={item.key} className={`max-w-8 min-w-1.5 flex-1 ${i === firstRetry ? "ml-3 sm:ml-5" : ""}`}>
              <button
                type="button"
                disabled={i > pos}
                onClick={() => onPick(i)}
                aria-label={label}
                title={label}
                aria-current={open ? "step" : undefined}
                className="group block w-full py-2"
              >
                <span
                  className={`block h-2 rounded-xs transition-colors ${look} ${
                    open ? "outline-2 outline-offset-2 outline-lichen" : ""
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      {children}
    </div>
  );
}

function DoneScreen({
  xp,
  score,
  seconds,
  nextId,
  onContinue,
}: {
  xp: number;
  score: number;
  seconds: number;
  nextId: string | null;
  onContinue: () => void;
}) {
  const { t } = useApp();
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <Screen>
      <StarIcon size={96} className="animate-pop text-gold" />
      <div>
        <h1 className="text-3xl">{t("lesson.done.title")}</h1>
        <p className="mt-1 text-muted">{t(score === 100 ? "lesson.done.perfect" : "lesson.done.keepUp")}</p>
      </div>
      <div className="grid w-full grid-cols-3 gap-3">
        <Stat label={t("lesson.stat.xp")} value={`+${xp}`} color="var(--gold)" icon={<BoltIcon size={20} />} />
        <Stat label={t("lesson.stat.accuracy")} value={`${score}%`} color="var(--ok)" icon={<CheckIcon size={20} />} />
        <Stat label={t("lesson.stat.time")} value={time} color="var(--brand)" icon={<StarIcon size={20} />} />
      </div>
      <div className="flex w-full flex-col gap-3">
        {nextId && (
          <Link href={`/lesson/${nextId}`} className="btn btn-ok w-full">
            {t("lesson.next")}
          </Link>
        )}
        <button type="button" onClick={onContinue} className="btn btn-ghost w-full">
          {t("lesson.backToPath")}
        </button>
      </div>
    </Screen>
  );
}

export function Stat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border-[1.5px]" style={{ borderColor: color }}>
      <p className="py-1 text-xs font-semibold text-bg" style={{ background: color }}>
        {label}
      </p>
      <p className="flex items-center justify-center gap-1 py-3 text-xl font-semibold" style={{ color }}>
        {icon}
        {value}
      </p>
    </div>
  );
}

function PaywallScreen() {
  const { t } = useApp();
  return (
    <Screen>
      <CrownIcon size={96} className="text-gold" />
      <div>
        <h1 className="text-3xl">{t("lesson.paywall.title")}</h1>
        <p className="mt-2 text-muted">{t("lesson.paywall.body")}</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Link href="/pricing" className="btn btn-gold w-full">
          {t("lesson.paywall.button")}
        </Link>
        <Link href="/learn" className="btn btn-ghost w-full">
          {t("lesson.backToPath")}
        </Link>
      </div>
    </Screen>
  );
}
