"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/components/app-provider";
import { BoltIcon, CheckIcon, CloseIcon, CrownIcon, StarIcon } from "@/components/icons";
import {
  BuildView,
  ChoiceView,
  FillView,
  GrammarView,
  IntroView,
  ListenView,
  MarkedSentence,
  MatchView,
  SpeakView,
  SpellView,
  type Answer,
  type Resolution,
} from "@/components/lesson/exercises";
import { RichText } from "@/components/lesson/rich-text";
import { VolumeSlider } from "@/components/lesson/volume-slider";
import { checkBuiltAnswer, checkSpelled, checkTyped, shuffle, toTiles } from "@/lib/answers";
import { playSlovak, preloadLesson, stopSlovak, type Clip } from "@/lib/audio";
import { fillSentence, speakableTexts, tileWords } from "@/lib/course/helpers";
import type { Illustration } from "@/lib/course/illustrations";
import { properNames } from "@/lib/course/names";
import type { Exercise, ExerciseId, Lesson, RuleCard } from "@/lib/course/types";
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
      return { correct: answer === ex.answer, solution: ex.options[ex.answer], why: ex.why, rule: ex.rule };
    case "fill":
      return {
        correct: answer === ex.answer,
        solution: fillSentence(ex.before, ex.options[ex.answer], ex.after),
        why: ex.why,
        rule: ex.rule,
      };
    case "build": {
      const words = Array.isArray(answer) ? answer.map((i) => tiles[i]) : [];
      const { whys, ...result } = checkBuiltAnswer(words, ex.answers, ex.traps);
      return { ...result, why: whys.length ? whys.join(" ") : undefined };
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

/** Every clip a lesson may play, in order: word tiles as cut from their own sentence. */
function lessonClips(lesson: Lesson): Clip[] {
  return lesson.exercises.flatMap((ex) => {
    const tiles = tileWords(ex);
    const key = `${lesson.id}#${ex.id}`;
    return [
      ...speakableTexts(ex).filter((text) => !tiles.includes(text)),
      ...tiles.map((text) => ({ text, in: key })),
    ];
  });
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
  /** The lesson's pictures by exercise id. */
  pictures: Record<ExerciseId, Illustration>;
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

/**
 * Testing only (unlock-all switch, or dev mode): `?step=N` opens the lesson at exercise
 * N as played (counting from 0, spelling cards included), `?step=<exercise id>` at that
 * exercise.
 */
function startStep(exercises: Exercise[], param: string | null, dev: boolean): number {
  if (!(unlockAllLessons || dev) || param === null) return 0;
  const step = /^\d+$/.test(param) ? Number(param) : exercises.findIndex((ex) => ex.id === param);
  return step > 0 && step < exercises.length ? step : 0;
}

/**
 * `?card=<exercise id>`, from the dictionary on /learn: just that teaching card, then
 * back to /learn. Its place in the lesson; null for a normal run (or if that exercise
 * isn't a teaching card).
 */
function lookUpCard(exercises: Exercise[], param: string | null): number | null {
  const card = exercises.findIndex((ex) => ex.id === param);
  const ex = exercises[card];
  return ex?.type === "intro" || ex?.type === "grammar" ? card : null;
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
  const { isPremium, dev, completeLesson, t, locale, progress } = useApp();
  const lesson = lessons[locale];
  const lessonId = lesson.id;

  const [queue, setQueue] = useState<Item[]>(() =>
    lesson.exercises.map((_, index) => ({ index, key: String(index), retry: false })),
  );
  const [pos, setPos] = useState(() => startStep(lesson.exercises, step, dev));
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
    if (phase !== "paywall" && lookUp === null) preloadLesson(lessonClips(lesson));
  }, [lesson, phase, lookUp]);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    stats.current.startedAt = Date.now();
  }, []);

  const item = queue[pos];
  const exercise = lesson.exercises[item.index];

  function onGraded(r: Resolution, answer: Answer, tiles: string[]) {
    // Dev mode can answer an exercise again; only its first answer counts.
    const first = !history[item.key]?.result;
    setHistory((h) => ({ ...h, [item.key]: { answer, tiles, result: r } }));
    if (r.skipped) return;
    if (!item.retry && first) {
      stats.current.graded++;
      if (r.correct) stats.current.right++;
    }
    // Mistakes come back once at the end of the lesson.
    if (!r.correct && !item.retry && !queue.some((q) => q.key === `${item.key}r`)) {
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
            <p className="text-xs font-semibold text-muted">
              {t("lesson.place", place)}
              {/* Dev tools aren't translated. */}
              {dev && <span className="ml-2 rounded-sm bg-locked px-1.5 py-px text-text">Dev</span>}
            </p>
            <p className="hidden truncate font-serif text-lg leading-tight sm:block">{lesson.title}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-semibold text-muted">{t("lesson.course")}</p>
            <p className="text-sm leading-tight font-semibold text-brand sm:text-lg">
              {t("lesson.coursePct", { pct: coursePct })}
            </p>
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
        <VolumeSlider className="mt-4.5 flex" />
      </header>

      {lookUp !== null ? (
        <Step
          key={`card-${lookUp}-${locale}`}
          exercise={lesson.exercises[lookUp]}
          illustration={pictures[lesson.exercises[lookUp].id]}
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
          lessonId={lesson.id}
          illustration={pictures[lesson.exercises[shown.index].id]}
          frame={frame}
          initial={history[shown.key]}
          review={reviewing}
          dev={dev}
          nextLabel={reviewing ? t("lesson.backTo", { n: item.index + 1 }) : undefined}
          nav={
            <StepNav
              queue={queue}
              pos={pos}
              viewing={viewing}
              history={history}
              dev={dev}
              onPick={(i) => {
                // Dev mode: any exercise, ahead or behind, becomes the one being played.
                if (dev) {
                  setPos(i);
                  setViewing(null);
                } else setViewing(i < pos ? i : null);
              }}
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
  lessonId,
  illustration,
  pictureAfterAnswer = false,
  frame,
  initial,
  review = false,
  dev = false,
  nextLabel,
  nav,
  skip,
  onGraded,
  onNext,
}: {
  exercise: Exercise;
  /** The lesson the exercise is in, for its word tiles' clips. */
  lessonId?: string;
  illustration?: Illustration;
  /** Keep the picture back until the exercise is answered (where it would give the answer away); phones skip it. */
  pictureAfterAnswer?: boolean;
  /** Width classes shared with the top bar and footer. */
  frame: string;
  /** An earlier answer to restore (a finished exercise, or the current one after a look back). */
  initial?: Visit;
  /** Looking back at a finished exercise: read-only, and Continue returns to the current one. */
  review?: boolean;
  /** Dev mode: after Check, "Change answer" opens the exercise again. */
  dev?: boolean;
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
  // Dev mode: answer again. The answer stays, to be changed; matching and speaking
  // keep their own state, so they start over.
  const [attempt, setAttempt] = useState(0);
  const answerAgain = () => {
    setResult(null);
    if (selfGraded) setAttempt((n) => n + 1);
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
            className={`illustration mx-auto h-auto max-h-[24dvh] w-auto max-w-full transition-opacity duration-500 lg:order-last lg:max-h-[calc(100dvh-14rem)] ${
              // Kept back: beside the exercise its place waits empty until the answer; above
              // it (narrow screens) a gap would push the exercise down, so it isn't shown.
              pictureAfterAnswer ? `max-lg:hidden ${result ? "" : "opacity-0"}` : ""
            }`}
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
            <BuildView
              exercise={ex}
              tiles={tiles}
              clipsIn={lessonId && `${lessonId}#${ex.id}`}
              answer={answer}
              setAnswer={setAnswer}
              locked={locked}
            />
          )}
          {ex.type === "listen" && (
            <ListenView exercise={ex} answer={answer} setAnswer={setAnswer} locked={locked} />
          )}
          {ex.type === "spell" && (
            <SpellView exercise={ex} answer={answer} setAnswer={setAnswer} locked={locked} />
          )}
          {ex.type === "match" && <MatchView key={attempt} exercise={ex} onResolve={resolve} locked={locked} />}
          {ex.type === "speak" && <SpeakView key={attempt} exercise={ex} onResolve={resolve} locked={locked} />}
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
        onAnswerAgain={dev && !review ? answerAgain : undefined}
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
  onAnswerAgain,
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
  /** Dev mode: open the checked exercise again. */
  onAnswerAgain?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  const { t } = useApp();
  const [word] = useState(() => praise[Math.floor(Math.random() * praise.length)]);
  const [ruleOpen, setRuleOpen] = useState(false);
  // The exercise bars have a strip of their own below the footer, the same in every
  // state, so a long answer or explanation never moves or squeezes them.
  const navStrip = nav && (
    <div className="border-t border-border bg-bg">
      <div className={`mx-auto py-1 sm:py-1.5 ${frame}`}>{nav}</div>
    </div>
  );

  if (result) {
    const ok = result.correct;
    return (
      <>
        <footer className={`animate-slide-up ${ok ? "bg-ok-soft" : "bg-bad-soft"}`}>
          <div className={`mx-auto flex flex-wrap items-center gap-x-6 gap-y-3 py-3 sm:gap-y-4 sm:py-6 ${frame}`}>
            <div className="flex basis-full items-center gap-4 sm:basis-auto">
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
                {!ok && result.why && (
                  <p className="mt-1 max-w-xl text-sm text-text">
                    <RichText text={result.why} />
                    {result.rule && (
                      <>
                        {" "}
                        <button
                          type="button"
                          onClick={() => setRuleOpen(true)}
                          className="font-semibold whitespace-nowrap text-brand underline underline-offset-2"
                        >
                          {t("lesson.seeRule")}
                        </button>
                      </>
                    )}
                  </p>
                )}
                {ruleOpen && result.rule && <RuleSheet rule={result.rule} onClose={() => setRuleOpen(false)} />}
              </div>
            </div>
            {onAnswerAgain && (
              <button type="button" onClick={onAnswerAgain} className="btn btn-ghost w-full sm:ml-auto sm:w-auto">
                Change answer
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className={`btn ${ok ? "btn-ok" : "btn-bad"} w-full sm:w-auto sm:min-w-40 ${onAnswerAgain ? "" : "sm:ml-auto"}`}
            >
              {nextLabel ?? t("lesson.continue")}
            </button>
          </div>
        </footer>
        {navStrip}
      </>
    );
  }

  return (
    <>
      <footer className="border-t border-border">
        <div className={`mx-auto flex flex-wrap items-center gap-x-6 gap-y-3 py-3 sm:py-6 ${frame}`}>
          {onSkip && (
            <button type="button" onClick={onSkip} className="btn btn-ghost">
              {skipLabel ?? t("lesson.cantSpeak")}
            </button>
          )}
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
      {navStrip}
    </>
  );
}

/**
 * A grammar card opened from a wrong answer's explanation ("See the rule"): the
 * dictionary's look-up view (grey bar, the card, Return), drawn over the lesson so the
 * lesson underneath keeps its place, and Return just closes it. In the page body: the
 * footer it opens from moves in with a transform, which would hold it.
 */
function RuleSheet({ rule, onClose }: { rule: RuleCard; onClose: () => void }) {
  const { t } = useApp();
  const frame = "max-w-3xl px-4";

  // Enter and Escape are for this card only, not the lesson behind it (where Enter continues).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "Enter") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={rule.card.title}
      className="fixed inset-0 z-50 overflow-y-auto bg-bg"
    >
      <div className="flex min-h-dvh flex-col">
        <header className={`mx-auto w-full pt-3 sm:pt-5 ${frame}`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label={t("lesson.closeRule")}
              className="shrink-0 text-muted hover:text-text"
            >
              <CloseIcon size={28} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted">
                {t("lesson.place", { unit: rule.unit, lesson: rule.lesson })}
              </p>
              <p className="truncate font-serif text-lg leading-tight">{rule.title}</p>
            </div>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-locked sm:mt-3">
            <div
              className="h-full rounded-full bg-border-strong"
              style={{ width: `${((rule.index + 1) / rule.count) * 100}%` }}
            />
          </div>
        </header>
        <Step
          exercise={rule.card}
          frame={frame}
          nextLabel={t("lesson.return")}
          nav={null}
          onGraded={() => {}}
          onNext={onClose}
        />
      </div>
    </div>,
    document.body,
  );
}

/**
 * The lesson in the order it's played: one bar per exercise, then, after a gap, a
 * second try for each one missed (added as mistakes happen). Finished ones can be
 * opened again; the current one returns to playing. In dev mode every bar opens.
 */
function StepNav({
  queue,
  pos,
  viewing,
  history,
  dev,
  onPick,
}: {
  queue: Item[];
  pos: number;
  viewing: number | null;
  history: Record<string, Visit>;
  dev: boolean;
  onPick: (index: number) => void;
}) {
  const { t } = useApp();
  const firstRetry = queue.findIndex((item) => item.retry);
  const exercises = firstRetry < 0 ? queue.length : firstRetry;
  const list = useRef<HTMLOListElement>(null);

  // A long lesson with many second tries may not fit: keep the current bar in view,
  // scrolling the strip only (never the page).
  useEffect(() => {
    const strip = list.current;
    const current = strip?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!strip || !current) return;
    const bar = current.getBoundingClientRect();
    const view = strip.getBoundingClientRect();
    if (bar.left < view.left) strip.scrollLeft += bar.left - view.left - 8;
    else if (bar.right > view.right) strip.scrollLeft += bar.right - view.right + 8;
  }, [pos, viewing, queue.length]);

  return (
    <nav aria-label={t("lesson.nav")} className="w-full">
      {/* Bars have a fixed size (--bar; small enough on phones for the longest lesson,
          23), and the lesson's own bars stay centred: second tries extend to the right,
          so a wrong answer moves and squeezes nothing. Too many to fit, and it scrolls. */}
      <ol
        ref={list}
        className="flex gap-(--gap) overflow-x-auto [--bar:0.625rem] [--gap:0.25rem] [scrollbar-width:none] sm:[--bar:2rem] sm:[--gap:0.375rem]"
        style={{ paddingLeft: `max(0px, calc((100% - ${exercises} * (var(--bar) + var(--gap)) + var(--gap)) / 2))` }}
      >
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
            <li key={item.key} className={`w-(--bar) shrink-0 ${i === firstRetry ? "ml-3 sm:ml-5" : ""}`}>
              <button
                type="button"
                disabled={i > pos && !dev}
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
