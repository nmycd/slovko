"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  type Answer,
  type Resolution,
} from "@/components/lesson/exercises";
import { checkBuilt, checkTyped, shuffle, toTiles } from "@/lib/answers";
import { playSlovak, stopSlovak } from "@/lib/audio";
import { fillSentence } from "@/lib/course/helpers";
import type { Exercise, Lesson } from "@/lib/course/types";
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
      return { ...checkTyped(typeof answer === "string" ? answer : "", [ex.sk]), solution: ex.sk };
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
};

export function LessonPlayer(props: PlayerProps) {
  const lessonId = props.lessons.en.id;
  const router = useRouter();
  const { ready, authEnabled, authKnown, user, profile } = useApp();
  const signedOut = authEnabled && authKnown && !user;

  // The proxy already redirects signed-out visitors; this covers client-side navigation.
  useEffect(() => {
    if (signedOut) router.replace(`/login?next=${encodeURIComponent(`/lesson/${lessonId}`)}`);
  }, [signedOut, router, lessonId]);

  // Wait for hydration (progress lives in localStorage, exercises shuffle on
  // mount) and for the profile, which decides whether premium units are open.
  const profileLoading = user !== null && profile === null;
  if (!ready || !authKnown || signedOut || profileLoading) return <div className="min-h-dvh" />;
  return <Player key={lessonId} {...props} />;
}

function Player({ lessons, premiumUnit, nextId }: PlayerProps) {
  const router = useRouter();
  const { isPremium, completeLesson, t, locale } = useApp();
  const lesson = lessons[locale];
  const lessonId = lesson.id;

  const [queue, setQueue] = useState<Item[]>(() =>
    lesson.exercises.map((_, index) => ({ index, key: String(index), retry: false })),
  );
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<Phase>(() =>
    premiumUnit && !isPremium ? "paywall" : "playing",
  );
  const stats = useRef({ right: 0, graded: 0, startedAt: 0 });
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    stats.current.startedAt = Date.now();
  }, []);

  const item = queue[pos];
  const exercise = lesson.exercises[item.index];

  function onGraded(r: Resolution) {
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
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      return;
    }
    const { right, graded, startedAt } = stats.current;
    const score = graded ? Math.round((right / graded) * 100) : 100;
    const xp = 10 + (score === 100 ? 5 : 0);
    completeLesson(lessonId, score, xp);
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

  const progressPct = (pos / queue.length) * 100;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 pt-6">
        <Link
          href="/learn"
          aria-label={t("lesson.quit")}
          className="text-muted hover:text-text"
          onClick={(e) => {
            if (pos > 0 && !confirm(t("lesson.quitConfirm"))) e.preventDefault();
          }}
        >
          <CloseIcon size={28} />
        </Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-ok transition-[width] duration-300"
            style={{ width: `${Math.max(progressPct, 2)}%` }}
          />
        </div>
      </div>

      {/* Remounts on a language switch so word tiles are rebuilt in the new language. */}
      <Step key={`${item.key}-${locale}`} exercise={exercise} onGraded={onGraded} onNext={next} />
    </div>
  );
}

/** One exercise: owns its answer, word tiles and result. Remounted per queue item. */
function Step({
  exercise: ex,
  onGraded,
  onNext,
}: {
  exercise: Exercise;
  onGraded: (r: Resolution) => void;
  onNext: () => void;
}) {
  const [answer, setAnswer] = useState<Answer>(null);
  const [result, setResult] = useState<Resolution | null>(null);
  const [tiles] = useState(() =>
    ex.type === "build" ? shuffle([...toTiles(ex.answers[0]), ...ex.distractors]) : [],
  );

  // Teaching cards have no answer: just Continue.
  // Leaving an exercise silences its audio (e.g. the answer read out after Check).
  useEffect(() => stopSlovak, []);

  const isIntro = ex.type === "intro" || ex.type === "grammar";
  const selfGraded = ex.type === "match" || ex.type === "speak";
  const locked = result !== null;

  const resolve = (r: Resolution) => {
    setResult(r);
    onGraded(r);
  };
  const check = () => {
    if (!result && hasAnswer(answer)) resolve(grade(ex, answer, tiles));
  };

  // Enter checks or continues. Re-subscribed every render so it sees fresh state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (result || isIntro) onNext();
      else if (!selfGraded) check();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
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
        {ex.type === "match" && <MatchView exercise={ex} onResolve={resolve} locked={locked} />}
        {ex.type === "speak" && <SpeakView exercise={ex} onResolve={resolve} locked={locked} />}
      </div>

      <Footer
        result={result}
        canCheck={hasAnswer(answer)}
        mode={isIntro ? "continue" : selfGraded ? "self" : "check"}
        onCheck={check}
        onNext={onNext}
        onSkip={ex.type === "speak" ? onNext : undefined}
      />
    </>
  );
}

function Footer({
  result,
  canCheck,
  mode,
  onCheck,
  onNext,
  onSkip,
}: {
  result: Resolution | null;
  canCheck: boolean;
  mode: "check" | "continue" | "self";
  onCheck: () => void;
  onNext: () => void;
  onSkip?: () => void;
}) {
  const { t } = useApp();
  const [word] = useState(() => praise[Math.floor(Math.random() * praise.length)]);

  if (result) {
    const ok = result.correct;
    return (
      <footer className={`animate-slide-up ${ok ? "bg-ok-soft" : "bg-bad-soft"}`}>
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span
              className={`grid size-14 shrink-0 place-items-center rounded-full bg-bg ${ok ? "text-ok" : "text-bad"}`}
            >
              {ok ? <CheckIcon size={30} /> : <CloseIcon size={30} />}
            </span>
            <div className={ok ? "text-ok-dark" : "text-bad"}>
              <p className="text-2xl font-black">{ok ? word : t("lesson.correctSolution")}</p>
              {!ok && result.solution && <p className="text-lg font-semibold">{result.solution}</p>}
              {result.heard !== undefined && (
                <p className="text-sm font-semibold opacity-80">
                  {t("lesson.weHeard", { text: result.heard || "…" })}
                </p>
              )}
              {result.note && <p className="text-sm font-semibold">{t(result.note)}</p>}
            </div>
          </div>
          <button type="button" onClick={onNext} className={`btn ${ok ? "btn-ok" : "btn-bad"} sm:min-w-40`}>
            {t("lesson.continue")}
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t-2 border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-6">
        {onSkip ? (
          <button type="button" onClick={onSkip} className="btn btn-ghost">
            {t("lesson.cantSpeak")}
          </button>
        ) : (
          <span />
        )}
        {mode === "continue" ? (
          <button type="button" onClick={onNext} className="btn btn-ok sm:min-w-40">
            {t("lesson.continue")}
          </button>
        ) : mode === "check" ? (
          <button type="button" onClick={onCheck} disabled={!canCheck} className="btn btn-ok sm:min-w-40">
            {t("lesson.check")}
          </button>
        ) : null}
      </div>
    </footer>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
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
        <h1 className="text-3xl font-black text-gold">{t("lesson.done.title")}</h1>
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

function Stat({
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
    <div className="overflow-hidden rounded-2xl border-2" style={{ borderColor: color }}>
      <p className="py-1 text-xs font-extrabold uppercase text-white" style={{ background: color }}>
        {label}
      </p>
      <p className="flex items-center justify-center gap-1 py-3 text-xl font-black" style={{ color }}>
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
        <h1 className="text-3xl font-black">{t("lesson.paywall.title")}</h1>
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
